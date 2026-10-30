import type { Habit } from "../types/habit";
import type { HabitRepository } from "../types/repository";

const HABITS_STORAGE_KEY = "jejakbaik.habits.v1";

function normalizeCompletions(completions: string[]): string[] {
  return Array.from(new Set(completions)).sort();
}

function isValidHabit(value: unknown): value is Habit {
  if (typeof value !== "object" || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    typeof h.id === "string" &&
    h.id.length > 0 &&
    typeof h.name === "string" &&
    typeof h.category === "string" &&
    typeof h.icon === "string" &&
    typeof h.createdAt === "string" &&
    Array.isArray(h.completions) &&
    h.completions.every((c) => typeof c === "string")
  );
}

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function createLocalHabitRepository(storage: StorageAdapter): HabitRepository {
  return {
    async loadHabits() {
      let raw: string | null;
      try {
        raw = await storage.getItem(HABITS_STORAGE_KEY);
      } catch {
        throw new Error(
          "Gagal membaca penyimpanan lokal JejakBaik. Data lama tidak dihapus, coba lagi."
        );
      }

      if (raw === null || raw.trim() === "") return [];

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(
          "Data JejakBaik rusak (JSON tidak valid). Data lama TIDAK dihapus — perbaiki atau hapus aplikasi secara manual."
        );
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error(
          "Format data JejakBaik tidak dikenal. Data lama TIDAK dihapus."
        );
      }

      const file = parsed as { version?: unknown; habits?: unknown };

      if (file.version !== 1) {
        throw new Error(
          `Versi data JejakBaik tidak didukung (ditemukan: ${JSON.stringify(
            file.version
          )}, diharapkan: 1). Data lama TIDAK dihapus.`
        );
      }

      if (!Array.isArray(file.habits)) {
        throw new Error(
          "Struktur data JejakBaik tidak valid (habits bukan array). Data lama TIDAK dihapus."
        );
      }

      // Entri rusak dibuang dari hasil baca saja; penyimpanan tidak disentuh sampai ada simpan baru.
      return (file.habits as unknown[])
        .filter(isValidHabit)
        .map((habit) => ({
          ...habit,
          completions: normalizeCompletions(habit.completions),
        }));
    },

    async addHabit(h: Habit) {
      const current = await this.loadHabits();
      const exists = current.some((habit) => habit.id === h.id);
      if (exists) return;

      const habit: Habit = {
        ...h,
        completions: normalizeCompletions(h.completions),
      };

      const updated = [habit, ...current.filter((item) => item.id !== h.id)];
      await this.saveHabits(updated);
    },

    async setCompletion(habitId: string, date: string, done: boolean) {
      const current = await this.loadHabits();
      const habit = current.find((item) => item.id === habitId);
      if (!habit) return;

      const today = date;

      // Gunakan parameter 'done' untuk menentukan apapa tanggal harus disimpan.
      // done = true → tanggal ditambahkan ke completions
      // done = false → tanggal dihapus dari completions
      if (done) {
        // Tambahkan hari jika belum ada
        const alreadyDone = habit.completions.includes(today);
        const withoutToday = habit.completions.filter((d) => d !== today);
        const completions = alreadyDone
          ? withoutToday
          : [...withoutToday, today];
        const updated = current.map((item) =>
          item.id === habitId ? { ...item, completions } : item
        );
        await this.saveHabits(updated);
      } else {
        // Hapus hari dari completions
        const withoutToday = habit.completions.filter((d) => d !== today);
        const updated = current.map((item) =>
          item.id === habitId ? { ...item, completions: withoutToday } : item
        );
        await this.saveHabits(updated);
      }
    },

    async deleteHabit(habitId: string) {
      const current = await this.loadHabits();
      const updated = current.filter((item) => item.id !== habitId);
      await this.saveHabits(updated);
    },

    async saveHabits(habits: Habit[]) {
      const file = {
        version: 1,
        habits: habits.map((habit) => ({
          ...habit,
          completions: normalizeCompletions(habit.completions),
        })),
      };
      await storage.setItem(HABITS_STORAGE_KEY, JSON.stringify(file));
    },
  };
}