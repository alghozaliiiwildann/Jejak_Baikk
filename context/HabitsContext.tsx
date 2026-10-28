/**
 * Konteks data kebiasaan JejakBaik.
 * Memuat dari storage saat mount, memuat ulang saat retry, dan menyimpan setiap perubahan.
 * toggleToday tidak pernah membuat tanggal ganda; addHabit mem-trim nama & membuat id unik.
 */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { habitRepository } from "../context/repository";
import { createId } from "../utils/id";
import type { Habit, HabitCategory } from "../types/habit";
import { getTodayLocal } from "../utils/date";

export type AddHabitInput = {
  name: string;
  target?: string;
  category: HabitCategory;
  icon: string;
};

export type HabitsContextValue = {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  addHabit: (input: AddHabitInput) => Promise<void>;
  toggleToday: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabit: (id: string) => Habit | undefined;
};

// Pure function to find a habit by id (used by getHabit export)
export function getHabitPure(id: string, habits?: Habit[]): Habit | undefined {
  return (habits || []).find((item) => item.id === id);
}

export const HabitsContext = createContext<HabitsContextValue | null>(null);

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan pada data JejakBaik.";
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mirror state terbaru agar mutasi tidak bergantung pada closure yang basi.
  const habitsRef = useRef<Habit[]>([]);
  // Antrean simpan agar penulisan tidak saling menimpa saat toggle cepat berturut-turut.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isMountedRef = useRef(true);

  const applyHabits = useCallback((next: Habit[]) => {
    habitsRef.current = next;
    setHabits(next);
    saveQueueRef.current = saveQueueRef.current.then(() =>
      habitRepository.saveHabits(next).catch((saveError: unknown) => {
        if (isMountedRef.current) setError(toErrorMessage(saveError));
      })
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitRepository.loadHabits();
      if (!isMountedRef.current) return;
      habitsRef.current = data;
      setHabits(data);
    } catch (loadError: unknown) {
      // Gagal baca: tampilkan error, JANGAN menimpa/menghapus data yang sudah ada.
      if (isMountedRef.current) setError(toErrorMessage(loadError));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  const retry = useCallback(async () => {
    await load();
  }, [load]);

  const addHabit = useCallback(
    async (input: AddHabitInput) => {
      const name = input.name.trim();
      if (!name) {
        throw new Error("Nama kebiasaan tidak boleh kosong.");
      }
      const current = habitsRef.current;
      const habit: Habit = {
        id: createId(),
        name,
        ...(input.target?.trim() ? { target: input.target.trim() } : {}),
        category: input.category,
        icon: input.icon,
        createdAt: getTodayLocal(),
        completions: [],
      };
      applyHabits([...current, habit]);
    },
    [applyHabits]
  );

  const toggleToday = useCallback(
    async (id: string) => {
      const today = getTodayLocal();
      const current = habitsRef.current;
      const habit = current.find((item) => item.id === id);
      if (!habit) return;

      const alreadyDone = habit.completions.includes(today);
      // Hapus semua kemungkinan duplikat "today", lalu tambahkan paling banyak satu kali.
      const withoutToday = habit.completions.filter((date) => date !== today);
      const completions = alreadyDone
        ? withoutToday
        : [...withoutToday, today];
      await habitRepository.setCompletion(id, today, completions.length > 0);

      applyHabits(
        current.map((item) =>
          item.id === id ? { ...item, completions } : item
        )
      );
    },
    [applyHabits]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const current = habitsRef.current.filter((item) => item.id !== id);
      await habitRepository.saveHabits(current);
    },
    [applyHabits]
  );

  const getHabit = useCallback(
    (id: string) => getHabitPure(id, habitsRef.current),
    [habitsRef.current]
  );

  const value = useMemo<HabitsContextValue>(
    () => ({
      habits,
      loading,
      error,
      retry,
      addHabit,
      toggleToday,
      deleteHabit,
      getHabit,
    }),
    [
      habits,
      loading,
      error,
      retry,
      addHabit,
      toggleToday,
      deleteHabit,
      getHabit,
    ]
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}
