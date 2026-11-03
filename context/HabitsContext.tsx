/**
 * Konteks data kebiasaan JejakBaik.
 * Memuat dari storage saat mount, memuat ulang saat retry, dan menyimpan setiap perubahan.
 * toggleToday tidak pernah membuat tanggal ganda; addHabit mem-trim nama & membuat id unik.
 * Fase 2:
 * - State "today" diperbarui melalui AppState ("change") dan timer pergantian hari
 * - Satu antrean serial (bertahan selama lifecycle provider) untuk semua operasi tulis
 * - Update optimistik dengan rollback berbasis snapshot
 * - Semua operasi tulis memakai metode repository (bukan saveHabits) agar tidak saling menimpa
 */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { habitRepository } from "../context/repository";
import { createId } from "../utils/id";
import type { Habit, HabitCategory } from "../types/habit";
import { getTodayLocal } from "../utils/date";
import {
  nextDone,
  applyCompletion,
  createWriteQueue,
  createOptimisticWriter,
  removeHabit,
} from "../utils/habitOps";

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
  today: string;
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
  // State untuk daftar kebiasaan
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State "today" - diperbarui melalui AppState dan timer pergantian hari
  const [today, setToday] = useState<string>(getTodayLocal());

  // Mirror ref untuk menghindari closure stale
  const habitsRef = useRef<Habit[]>([]);
  // Satu antrean serial untuk seluruh lifecycle provider (tidak dibuat ulang tiap render)
  const writeQueue = useMemo(() => createWriteQueue(), []);
  const isMountedRef = useRef(true);

  // --- today: AppState listener (API resmi react-native) ---
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        setToday(getTodayLocal());
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // --- today: timer mendeteksi pergantian hari tanpa membaca state basi ---
  useEffect(() => {
    const checkDateChange = () => {
      const newToday = getTodayLocal();
      setToday((previous) => (previous === newToday ? previous : newToday));
    };

    const intervalId = setInterval(checkDateChange, 60000);
    checkDateChange();

    return () => clearInterval(intervalId);
  }, []);

  // Load data dari repository saat mount
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitRepository.loadHabits();
      if (!isMountedRef.current) return;
      habitsRef.current = data;
      setHabits(data);
      // Setelah data dimuat, perbarui "today" agar konsisten
      setToday(getTodayLocal());
    } catch (loadError: unknown) {
      // Gagal baca: tampilkan error, JANGAN menimpa data yang sudah ada di storage/state.
      if (isMountedRef.current) setError(toErrorMessage(loadError));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    await load();
  }, [load]);

  // Optimistic writer: update state seketika, simpan serial lewat satu antrean.
  // Saat ada kegagalan, state akhir disamakan dengan isi repository (reload) agar
  // perubahan yang gagal disimpan tidak tertinggal di memori dan perubahan yang
  // berhasil tidak hilang — termasuk saat operasi lama gagal dan operasi baru sukses.
  const writer = useMemo(
    () =>
      createOptimisticWriter<Habit[]>({
        getState: () => habitsRef.current,
        setState: (next) => {
          habitsRef.current = next;
          if (isMountedRef.current) {
            setHabits(next);
          }
        },
        enqueue: (operation) => writeQueue.enqueue(operation),
        onError: (writeError) => {
          if (isMountedRef.current) setError(toErrorMessage(writeError));
        },
        // Sumber kebenaran untuk rekonsiliasi setelah kegagalan penyimpanan.
        reload: () => habitRepository.loadHabits(),
      }),
    [writeQueue]
  );

  const addHabit = useCallback(
    async (input: AddHabitInput) => {
      const name = input.name.trim();
      if (!name) {
        throw new Error("Nama kebiasaan tidak boleh kosong.");
      }
      const habit: Habit = {
        id: createId(),
        name,
        ...(input.target?.trim() ? { target: input.target.trim() } : {}),
        category: input.category,
        icon: input.icon,
        createdAt: today,
        completions: [],
      };

      // Optimistic: langsung tambahkan ke state, simpan lewat antrean serial.
      await writer.apply([...habitsRef.current, habit], () =>
        habitRepository.addHabit(habit)
      );
    },
    [writer, today]
  );

  const toggleToday = useCallback(
    async (id: string) => {
      const current = habitsRef.current;
      const habit = current.find((item) => item.id === id);
      if (!habit) return;

      // Tanggal sama untuk UI, storage, dan perhitungan done.
      const done = !nextDone(habit, today);
      const { completions } = applyCompletion(habit, done, today);

      const next = current.map((item) =>
        item.id === id ? { ...item, completions } : item
      );

      await writer.apply(next, () =>
        habitRepository.setCompletion(id, today, done)
      );
    },
    [writer, today]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const next = removeHabit(habitsRef.current, id);
      await writer.apply(next, () => habitRepository.deleteHabit(id));
    },
    [writer]
  );

  // getHabit turun dari state `habits` (bukan habitsRef.current)
  const getHabit = useCallback(
    (id: string): Habit | undefined => getHabitPure(id, habits),
    [habits]
  );

  const value = useMemo<HabitsContextValue>(
    () => ({
      habits,
      loading,
      error,
      today,
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
      today,
      retry,
      addHabit,
      toggleToday,
      deleteHabit,
      getHabit,
    ]
  );

  // Load data saat provider mount
  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}
