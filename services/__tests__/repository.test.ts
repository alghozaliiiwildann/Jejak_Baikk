import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Habit } from "../../types/habit";
import { createLocalHabitRepository } from "../../services/LocalHabitRepository";
import {
  applyCompletion,
  createOptimisticWriter,
  createWriteQueue,
  nextDone,
  removeHabit,
} from "../../utils/habitOps";

const STORAGE_KEY = "jejakbaik.habits.v1";

// Fake storage adapter for testing - persists data across calls
function createFakeStorage(initialData: string | null = null) {
  let stored: string | null = initialData;

  return {
    getItem: async (key: string) => {
      if (key !== STORAGE_KEY) return null;
      return stored;
    },
    setItem: async (key: string, value: string) => {
      if (key !== STORAGE_KEY) return;
      stored = value;
    },
    peek: () => stored,
  };
}

// Storage yang getItem selalu gagal, dengan penghitung penulisan.
function createReadFailingStorage(storedValue: string) {
  const writes: Array<{ key: string; value: string }> = [];

  return {
    getItem: async (): Promise<string | null> => {
      throw new Error("disk read failed");
    },
    setItem: async (key: string, value: string) => {
      writes.push({ key, value });
    },
    getWrites: () => writes,
    getStoredValue: () => storedValue,
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

function errorMessage(error: unknown): string {
  assert.ok(error instanceof Error);
  return error.message;
}

/** Isi completions sebuah habit; gagal keras bila habit tidak ada. */
function completionsOf(habits: Habit[], id: string): string[] {
  const habit = habits.find((item) => item.id === id);
  assert.ok(habit, `habit ${id} harus ada`);
  return habit.completions;
}

/**
 * Storage palsu yang bisa menggagalkan penulisan ke-N (1-based).
 * Dipakai untuk mensimulasikan kegagalan sebagian pada antrean tulis.
 */
function createFlakyStorage(initialHabits: Habit[], failingWrites: number[] = []) {
  let stored: string | null = JSON.stringify({ version: 1, habits: initialHabits });
  let writeCount = 0;

  return {
    getItem: async (key: string): Promise<string | null> =>
      key === STORAGE_KEY ? stored : null,
    setItem: async (key: string, value: string): Promise<void> => {
      if (key !== STORAGE_KEY) return;
      writeCount += 1;
      if (failingWrites.includes(writeCount)) {
        throw new Error(`penulisan ke-${writeCount} gagal`);
      }
      stored = value;
    },
    writeCount: () => writeCount,
  };
}

/**
 * Meniru alur data di HabitsProvider: satu antrean, update optimistik,
 * dan rekonsiliasi dari repository setelah kegagalan.
 */
function createOptimisticHarness(
  initialHabits: Habit[],
  failingWrites: number[] = []
) {
  const storage = createFlakyStorage(initialHabits, failingWrites);
  const repository = createLocalHabitRepository(storage);
  const queue = createWriteQueue();
  const errors: unknown[] = [];
  let state: Habit[] = [];

  const writer = createOptimisticWriter<Habit[]>({
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    enqueue: (operation) => queue.enqueue(operation),
    onError: (error) => {
      errors.push(error);
    },
    reload: () => repository.loadHabits(),
  });

  const load = async (): Promise<Habit[]> => {
    state = await repository.loadHabits();
    return state;
  };

  const toggleToday = async (id: string, date = "2026-11-03"): Promise<void> => {
    const habit = state.find((item) => item.id === id);
    if (!habit) return;

    const done = !nextDone(habit, date);
    const { completions } = applyCompletion(habit, done, date);
    const next = state.map((item) =>
      item.id === id ? { ...item, completions } : item
    );

    await writer.apply(next, () => repository.setCompletion(id, date, done));
  };

  const addHabit = async (habit: Habit): Promise<void> => {
    await writer.apply([...state, habit], () => repository.addHabit(habit));
  };

  const deleteHabit = async (id: string): Promise<void> => {
    await writer.apply(removeHabit(state, id), () => repository.deleteHabit(id));
  };

  return {
    repository,
    storage,
    load,
    addHabit,
    toggleToday,
    deleteHabit,
    getState: () => state,
    getErrors: () => errors,
  };
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
      } catch (error: unknown) {
        assert.ok(errorMessage(error).includes("rusak (JSON tidak valid)"));
      }
    });

    it("format lama (version tidak 1) melempar error", async () => {
      const json = JSON.stringify({ version: 2, habits: [] });
      const repo = createLocalHabitRepository(createFakeStorage(json));
      try {
        await repo.loadHabits();
        assert.fail("harus melempar error");
      } catch (error: unknown) {
        assert.ok(errorMessage(error).includes("tidak didukung"));
      }
    });

    it("format tidak dikenal (bukan object/array) melempar error", async () => {
      const repo = createLocalHabitRepository(createFakeStorage("12345"));
      try {
        await repo.loadHabits();
        assert.fail("harus melempar error");
      } catch (error: unknown) {
        assert.ok(errorMessage(error).includes("tidak dikenal"));
      }
    });

    it("kegagalan getItem diteruskan sebagai error, bukan data kosong", async () => {
      const storage = createReadFailingStorage("data-lama");
      const repo = createLocalHabitRepository(storage);

      await assert.rejects(repo.loadHabits(), /Gagal membaca penyimpanan lokal/);
    });

    it("kegagalan membaca tidak memicu penulisan (data lama tidak tertimpa)", async () => {
      const oldData = JSON.stringify({
        version: 1,
        habits: [makeHabit("lama", { completions: ["2026-10-01"] })],
      });
      const storage = createReadFailingStorage(oldData);
      const repo = createLocalHabitRepository(storage);

      await assert.rejects(repo.loadHabits(), /Gagal membaca penyimpanan lokal/);

      assert.deepStrictEqual(storage.getWrites(), []);
      assert.strictEqual(storage.getStoredValue(), oldData);

      // Operasi tulis juga tidak boleh menimpa data lama karena pembacaan gagal.
      await assert.rejects(
        repo.addHabit(makeHabit("baru")),
        /Gagal membaca penyimpanan lokal/
      );
      await assert.rejects(
        repo.deleteHabit("lama"),
        /Gagal membaca penyimpanan lokal/
      );
      assert.deepStrictEqual(storage.getWrites(), []);
      assert.strictEqual(storage.getStoredValue(), oldData);
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

    it("idempotent: done=true berulang hanya menghasilkan satu entry", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a")] })
      ));

      await repo.setCompletion("a", "2026-11-03", true);
      await repo.setCompletion("a", "2026-11-03", true);
      await repo.setCompletion("a", "2026-11-03", true);

      const result = await repo.loadHabits();
      assert.deepStrictEqual(result[0].completions, ["2026-11-03"]);
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

  describe("penulisan bersamaan lewat satu antrean", () => {
    it("dua setCompletion bersamaan tidak saling menimpa", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a"), makeHabit("b")] })
      ));
      const queue = createWriteQueue();

      await Promise.all([
        queue.enqueue(() => repo.setCompletion("a", "2026-11-03", true)),
        queue.enqueue(() => repo.setCompletion("b", "2026-11-03", true)),
      ]);

      const result = await repo.loadHabits();
      assert.deepStrictEqual(result[0].completions, ["2026-11-03"]);
      assert.deepStrictEqual(result[1].completions, ["2026-11-03"]);
    });

    it("tambah + toggle + hapus bersamaan tetap konsisten dan tidak kehilangan data", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a"), makeHabit("b")] })
      ));
      const queue = createWriteQueue();

      await Promise.all([
        queue.enqueue(() => repo.addHabit(makeHabit("c"))),
        queue.enqueue(() => repo.setCompletion("a", "2026-11-03", true)),
        queue.enqueue(() => repo.deleteHabit("b")),
      ]);

      const result = await repo.loadHabits();
      assert.deepStrictEqual(result.map((habit) => habit.id), ["c", "a"]);
      assert.deepStrictEqual(result[1].completions, ["2026-11-03"]);
    });

    it("kegagalan satu operasi tidak menghentikan operasi berikutnya", async () => {
      const repo = createLocalHabitRepository(createFakeStorage(
        JSON.stringify({ version: 1, habits: [makeHabit("a")] })
      ));
      const queue = createWriteQueue();

      const failing = queue.enqueue(async () => {
        throw new Error("gagal-1");
      });
      const following = queue.enqueue(() => repo.setCompletion("a", "2026-11-03", true));

      await assert.rejects(failing, /gagal-1/);
      await following;

      const result = await repo.loadHabits();
      assert.deepStrictEqual(result[0].completions, ["2026-11-03"]);
    });
  });
});

describe("Integrasi optimistic writer + repository", () => {
  it("operasi pertama gagal, operasi kedua berhasil → state akhir = data repository", async () => {
    const harness = createOptimisticHarness([makeHabit("a"), makeHabit("b")], [1]);
    await harness.load();

    const results = await Promise.allSettled([
      harness.toggleToday("a"),
      harness.toggleToday("b"),
    ]);

    assert.deepStrictEqual(
      results.map((result) => result.status),
      ["rejected", "fulfilled"]
    );

    // Perubahan yang gagal tidak tersisa di memori; perubahan yang berhasil tidak hilang.
    const persisted = await harness.repository.loadHabits();
    assert.deepStrictEqual(harness.getState(), persisted);
    assert.deepStrictEqual(completionsOf(harness.getState(), "a"), []);
    assert.deepStrictEqual(completionsOf(harness.getState(), "b"), ["2026-11-03"]);
    assert.strictEqual(harness.getErrors().length, 1);
  });

  it("operasi pertama dan kedua gagal → state kembali ke data repository", async () => {
    const harness = createOptimisticHarness(
      [makeHabit("a"), makeHabit("b")],
      [1, 2]
    );
    await harness.load();

    const results = await Promise.allSettled([
      harness.toggleToday("a"),
      harness.toggleToday("b"),
    ]);

    assert.deepStrictEqual(
      results.map((result) => result.status),
      ["rejected", "rejected"]
    );

    const persisted = await harness.repository.loadHabits();
    assert.deepStrictEqual(harness.getState(), persisted);
    assert.deepStrictEqual(completionsOf(harness.getState(), "a"), []);
    assert.deepStrictEqual(completionsOf(harness.getState(), "b"), []);
  });

  it("operasi pertama berhasil, operasi kedua gagal → hanya perubahan pertama yang bertahan", async () => {
    const harness = createOptimisticHarness(
      [makeHabit("a"), makeHabit("b")],
      [2]
    );
    await harness.load();

    const results = await Promise.allSettled([
      harness.toggleToday("a"),
      harness.toggleToday("b"),
    ]);

    assert.deepStrictEqual(
      results.map((result) => result.status),
      ["fulfilled", "rejected"]
    );

    const persisted = await harness.repository.loadHabits();
    assert.deepStrictEqual(harness.getState(), persisted);
    assert.deepStrictEqual(completionsOf(harness.getState(), "a"), ["2026-11-03"]);
    assert.deepStrictEqual(completionsOf(harness.getState(), "b"), []);
  });

  it("add gagal + toggle + hapus berhasil → tidak ada perubahan yang hilang atau hanya di memori", async () => {
    const harness = createOptimisticHarness(
      [makeHabit("a"), makeHabit("b")],
      [1]
    );
    await harness.load();

    const results = await Promise.allSettled([
      harness.addHabit(makeHabit("c")),
      harness.toggleToday("a"),
      harness.deleteHabit("b"),
    ]);

    assert.deepStrictEqual(
      results.map((result) => result.status),
      ["rejected", "fulfilled", "fulfilled"]
    );

    const persisted = await harness.repository.loadHabits();
    assert.deepStrictEqual(harness.getState(), persisted);
    assert.deepStrictEqual(
      harness.getState().map((habit) => habit.id),
      ["a"]
    );
    assert.deepStrictEqual(completionsOf(harness.getState(), "a"), ["2026-11-03"]);
    assert.strictEqual(harness.storage.writeCount(), 3);
    assert.strictEqual(harness.getErrors().length, 1);
  });
});
