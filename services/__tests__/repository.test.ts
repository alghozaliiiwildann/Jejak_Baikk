import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Habit } from "../../types/habit";
import { createLocalHabitRepository } from "../../services/LocalHabitRepository";

// Fake storage adapter for testing - persists data across calls
function createFakeStorage(initialData: string | null = null) {
  let stored: string | null = initialData;

  return {
    getItem: async (key: string) => {
      if (key !== "jejakbaik.habits.v1") return null;
      return stored;
    },
    setItem: async (key: string, value: string) => {
      if (key !== "jejakbaik.habits.v1") return;
      stored = value;
    },
  };
}

function makeHabit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: `Kebiasaan ${id}`,
    category: "Kesehatan",
    icon: "leaf",
    createdAt: "2026-10-01",
    completions: [],
    ...overrides,
  };
}

// Helper to parse JSON from fake storage
function parseStoredHabits(json: string): { version: number; habits: Habit[] } {
  return JSON.parse(json);
}

describe("LocalHabitRepository - fake storage", () => {
  describe("loadHabits", () => {
    it("daftar kosong ketika belum ada data (key tidak ada)", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(undefined));
      const result = await repo.loadHabits();
      assert.deepStrictEqual(result, []);
    });

    it("membaca JSON valid dan mereturn habits", async () => {
      const habit = makeHabit("a", { completions: ["2026-10-19"] });
      const json = JSON.stringify({
        version: 1,
        habits: [habit],
      });
      const repo = createLocalHabitRepository(createFakeStorage(json));
      const result = await repo.loadHabits();
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, "a");
      // Normalisasi: completions sudah terurut dan tanpa duplikat oleh repository
      assert.deepStrictEqual(result[0].completions, ["2026-10-19"]);
    });

    it("JSON rusak (tidak valid) melempar error", async () => {
      const repo = createLocalHabitRepository(createFakeStorage("not-json"));
      try {
        await repo.loadHabits();
        assert.fail("harus melempar error");
      } catch (e: any) {
        assert.ok(e.message.includes("rusak (JSON tidak valid)"));
      }
    });

    it("format lama (version tidak 1) melempar error", async () => {
      const json = JSON.stringify({ version: 2, habits: [] });
      const repo = createLocalHabitRepository(createFakeStorage(json));
      try {
        await repo.loadHabits();
        assert.fail("harus melempar error");
      } catch (e: any) {
        assert.ok(e.message.includes("tidak didukung"));
      }
    });

    it("format tidak dikenal (bukan object/array) melempar error", async () => {
      const repo = createLocalHabitRepository(createFakeStorage("12345"));
      try {
        await repo.loadHabits();
        assert.fail("harus melempar error");
      } catch (e: any) {
        assert.ok(e.message.includes("tidak dikenal"));
      }
    });
  });

  describe("addHabit", () => {
    it("menambah habit baru ke daftar", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(JSON.stringify({ version: 1, habits: [] })));
      const habit = makeHabit("a");
      await repo.addHabit(habit);
      const result = await repo.loadHabits();
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, "a");
    });

    it("tidak menambah habit duplikat berdasarkan id", async () => {
      const existing = makeHabit("a", { completions: ["2026-10-19"] });
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [existing] })
      ));
      const duplicate = makeHabit("a");
      await repo.addHabit(duplicate);
      const result = await repo.loadHabits();
      assert.strictEqual(result.length, 1); // Masih 1, tidak dua
    });
  });

  describe("setCompletion", () => {
    it("idempotent: menambah tanggal jika belum ada, hapus jika sudah ada (tanpa duplikat)", async () => {
      const habit = makeHabit("a", { completions: ["2026-10-19"] });
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [habit] })
      ));

      // Toggle hari yang sudah ada → harus dihapus (done=false)
      await repo.setCompletion("a", "2026-10-19", false);
      let result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 0);

      // Toggle hari yang sama lagi → masih 0 (idempotent - done=false lagi)
      await repo.setCompletion("a", "2026-10-19", false);
      result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 0);

      // Toggle hari baru dengan done=true → ditambahkan
      await repo.setCompletion("a", "2026-10-20", true);
      result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 1);
      assert.deepStrictEqual(result[0].completions, ["2026-10-20"]);
    });

    it("idempotent: toggle off kemudian on sama hari menghasilkan satu entry", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a")] })
      ));

      await repo.setCompletion("a", "2026-10-19", true);
      let result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 1);

      await repo.setCompletion("a", "2026-10-19", false);
      result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 0);

      await repo.setCompletion("a", "2026-10-19", true);
      result = await repo.loadHabits();
      assert.strictEqual(result[0].completions.length, 1);
    });
  });

  describe("deleteHabit", () => {
    it("menghapus habit dari daftar", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a"), makeHabit("b")] })
      ));
      await repo.deleteHabit("a");
      const result = await repo.loadHabits();
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, "b");
    });

    it("tidak error ketika menghapus habit yang tidak ada", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a")] })
      ));
      // Harus tidak error
      await repo.deleteHabit("nonexistent");
      const result = await repo.loadHabits();
      assert.strictEqual(result.length, 1);
    });
  });
});