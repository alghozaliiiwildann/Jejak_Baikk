/**
 * Unit test fungsi murni operasi kebiasaan di utils/habitOps.ts.
 * Jalankan: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Habit } from "../../types/habit";
import {
  nextDone,
  applyCompletion,
  removeHabit,
  createWriteQueue,
  createOptimisticWriter,
  resolveToday,
} from "../../utils/habitOps";

/** Beri kesempatan microtask & timer selesai (dipakai untuk menunggu antrean). */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: `habit-${Math.random().toString(36).substring(2, 9)}`,
    name: "Test Habit",
    category: "Kesehatan",
    icon: "leaf",
    createdAt: "2026-10-01",
    completions: [],
    ...overrides,
  };
}

describe("nextDone", () => {
  it("returns true jika habit sudah selesai hari ini", () => {
    const habit = makeHabit({ completions: [resolveToday()] });
    assert.strictEqual(nextDone(habit), true);
  });

  it("returns false jika habit belum selesai hari ini", () => {
    const habit = makeHabit({ completions: [] });
    assert.strictEqual(nextDone(habit), false);
  });

  it("returns false jika completions berisi tanggal lain", () => {
    const habit = makeHabit({ completions: ["2026-10-18"] });
    assert.strictEqual(nextDone(habit), false);
  });

  it("memakai tanggal injeksi (deterministik, bukan jam sistem)", () => {
    const habit = makeHabit({ completions: ["2026-11-03"] });
    assert.strictEqual(nextDone(habit, "2026-11-03"), true);
    assert.strictEqual(nextDone(habit, "2026-11-04"), false);
  });
});

describe("applyCompletion", () => {
  it("done=true menambahkan today tanpa duplikat", () => {
    const habit = makeHabit({ completions: [] });
    const result = applyCompletion(habit, true);
    assert.strictEqual(result.completions.length, 1);
    assert.strictEqual(result.completions[0], resolveToday());
  });

  it("done=false menghapus today", () => {
    const today = resolveToday();
    const habit = makeHabit({ completions: [today] });
    const result = applyCompletion(habit, false);
    assert.strictEqual(result.completions.length, 0);
  });

  it("done=true ketika sudah ada today tetap tanpa duplikat", () => {
    const today = resolveToday();
    const habit = makeHabit({ completions: [today] });
    const result = applyCompletion(habit, true);
    assert.strictEqual(result.completions.length, 1);
    assert.strictEqual(result.completions[0], today);
  });

  it("done=false ketika tidak ada today tidak mengubah", () => {
    const habit = makeHabit({ completions: ["2026-10-18"] });
    const result = applyCompletion(habit, false);
    assert.strictEqual(result.completions.length, 1);
    assert.strictEqual(result.completions[0], "2026-10-18");
  });

  it("idempoten pada tanggal injeksi: done=true berulang tetap satu entry", () => {
    const habit = makeHabit({ completions: ["2026-11-01"] });
    const first = applyCompletion(habit, true, "2026-11-03");
    const second = applyCompletion(
      { completions: first.completions },
      true,
      "2026-11-03"
    );
    assert.deepStrictEqual(second.completions, ["2026-11-01", "2026-11-03"]);
    assert.strictEqual(
      second.completions.filter((d) => d === "2026-11-03").length,
      1
    );
  });

  it("tidak memutasi completions input", () => {
    const completions = ["2026-10-18"];
    const habit = makeHabit({ completions });
    applyCompletion(habit, true, "2026-11-03");
    assert.deepStrictEqual(completions, ["2026-10-18"]);
  });

  it("tidak memutasi input ketika ada duplikat tanggal", () => {
    const completions = ["2026-11-03", "2026-11-03"];
    const habit = makeHabit({ completions });
    const result = applyCompletion(habit, true, "2026-11-03");
    assert.deepStrictEqual(result.completions, ["2026-11-03"]);
    assert.deepStrictEqual(completions, ["2026-11-03", "2026-11-03"]);
  });
});

describe("removeHabit", () => {
  it("menghapus habit dari array", () => {
    const h1 = makeHabit({ id: "a" });
    const h2 = makeHabit({ id: "b" });
    const h3 = makeHabit({ id: "c" });
    const habits = [h1, h2, h3];
    const result = removeHabit(habits, "b");
    assert.strictEqual(result.length, 2);
    assert.ok(result.every((h) => h.id !== "b"));
  });

  it("tidak menghapus habit lain ketika satu dihapus", () => {
    const h1 = makeHabit({ id: "a" });
    const h2 = makeHabit({ id: "b" });
    const h3 = makeHabit({ id: "c" });
    const habits = [h1, h2, h3];
    const result = removeHabit(habits, "b");
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "a");
    assert.strictEqual(result[1].id, "c");
  });

  it("mengembalikan array baru (imutabilitas)", () => {
    const h1 = makeHabit({ id: "a" });
    const h2 = makeHabit({ id: "b" });
    const habits = [h1, h2];
    const originalLength = habits.length;
    removeHabit(habits, "a");
    assert.strictEqual(habits.length, originalLength); // array lama tidak berubah
  });
});

describe("createWriteQueue", () => {
  it("menjalankan operasi secara berurutan", async () => {
    const { enqueue } = createWriteQueue();
    const results: number[] = [];

    await enqueue(async () => { results.push(1); });
    await enqueue(async () => { results.push(2); });
    await enqueue(async () => { results.push(3); });

    assert.deepStrictEqual(results, [1, 2, 3]);
  });

  it("FIFO meskipun operasi punya durasi berbeda", async () => {
    const { enqueue } = createWriteQueue();
    const order: string[] = [];

    const run = (label: string, delay: number) => async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      order.push(label);
    };

    await Promise.all([
      enqueue(run("pertama-lambat", 20)),
      enqueue(run("kedua-cepat", 1)),
      enqueue(run("ketiga", 5)),
    ]);

    assert.deepStrictEqual(order, ["pertama-lambat", "kedua-cepat", "ketiga"]);
  });

  it("dua operasi bersamaan tetap serial (tidak pernah tumpang tindih)", async () => {
    const { enqueue } = createWriteQueue();
    const events: string[] = [];
    let active = 0;
    let maxActive = 0;

    const operation = (label: string) => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      events.push(`start:${label}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push(`end:${label}`);
      active -= 1;
    };

    await Promise.all([
      enqueue(operation("a")),
      enqueue(operation("b")),
      enqueue(operation("c")),
    ]);

    assert.strictEqual(maxActive, 1);
    assert.deepStrictEqual(events, [
      "start:a",
      "end:a",
      "start:b",
      "end:b",
      "start:c",
      "end:c",
    ]);
  });

  it("queue berlanjut setelah operasi gagal dan error diteruskan ke pemanggil", async () => {
    const { enqueue } = createWriteQueue();
    const order: string[] = [];

    const failing = enqueue(async () => {
      order.push("gagal");
      throw new Error("Operasi gagal");
    });

    const following = enqueue(async () => {
      order.push("berikutnya");
    });

    await assert.rejects(failing, /Operasi gagal/);
    await following;

    assert.deepStrictEqual(order, ["gagal", "berikutnya"]);
  });

  it("dua kegagalan berurutan tidak menghentikan operasi ketiga", async () => {
    const { enqueue } = createWriteQueue();
    const results: string[] = [];

    const first = enqueue(async () => { throw new Error("gagal-1"); });
    const second = enqueue(async () => { throw new Error("gagal-2"); });
    const third = enqueue(async () => { results.push("sukses"); });

    await assert.rejects(first, /gagal-1/);
    await assert.rejects(second, /gagal-2/);
    await third;

    assert.deepStrictEqual(results, ["sukses"]);
  });

  it("mengembalikan promise yang resolve setelah operasi selesai", async () => {
    const { enqueue } = createWriteQueue();

    let resolved = false;
    await enqueue(async () => {
      resolved = true;
    });

    assert.strictEqual(resolved, true);
  });
});

describe("createOptimisticWriter", () => {
  function createWriter(initial: string[]) {
    let state = initial;
    const errors: unknown[] = [];
    const queue = createWriteQueue();
    const writer = createOptimisticWriter<string[]>({
      getState: () => state,
      setState: (next) => { state = next; },
      enqueue: (operation) => queue.enqueue(operation),
      onError: (error) => { errors.push(error); },
    });
    return {
      writer,
      getState: () => state,
      getErrors: () => errors,
    };
  }

  it("update optimistik langsung terlihat sebelum penyimpanan selesai", async () => {
    const { writer, getState } = createWriter(["awal"]);

    const control: { finish?: () => void } = {};
    const pending = writer.apply(["optimistik"], () =>
      new Promise<void>((resolve) => { control.finish = resolve; })
    );

    // Update optimistik sudah terlihat sebelum penyimpanan dimulai.
    assert.deepStrictEqual(getState(), ["optimistik"]);

    await Promise.resolve(); // biarkan operasi antrean mulai
    const finishPersist = control.finish;
    assert.ok(finishPersist);
    finishPersist();
    await pending;
  });

  it("rollback ke snapshot saat penyimpanan gagal (bukan ke state optimistik)", async () => {
    const { writer, getState, getErrors } = createWriter(["awal"]);

    await assert.rejects(
      writer.apply(["optimistik"], async () => {
        throw new Error("gagal simpan");
      }),
      /gagal simpan/
    );

    assert.deepStrictEqual(getState(), ["awal"]);
    assert.strictEqual(getErrors().length, 1);
  });

  it("rollback operasi lama tidak menghapus perubahan yang lebih baru", async () => {
    const { writer, getState } = createWriter(["awal"]);

    const control: { reject?: (error: Error) => void } = {};

    const first = writer.apply(["optimistik-1"], () =>
      new Promise<void>((_resolve, reject) => { control.reject = reject; })
    );
    // Pastikan rejection ditangani, bukan unhandled.
    const firstResult = first.then(
      () => null,
      (error: unknown) => error
    );

    // Operasi kedua diterapkan optimistik sebelum operasi pertama gagal.
    const second = writer.apply(["optimistik-1", "optimistik-2"], async () => {});

    await Promise.resolve(); // biarkan operasi pertama mulai
    const rejectFirst = control.reject;
    assert.ok(rejectFirst);
    rejectFirst(new Error("gagal-1"));

    const firstError = await firstResult;
    assert.ok(firstError instanceof Error);
    await second;

    // Perubahan baru tetap ada; rollback lama tidak menghapusnya.
    assert.deepStrictEqual(getState(), ["optimistik-1", "optimistik-2"]);
  });

  it("operasi berikutnya tetap berhasil setelah operasi sebelumnya gagal", async () => {
    const { writer, getState, getErrors } = createWriter(["awal"]);

    await assert.rejects(
      writer.apply(["gagal"], async () => {
        throw new Error("gagal simpan");
      }),
      /gagal simpan/
    );
    await writer.apply(["sukses"], async () => {});

    assert.deepStrictEqual(getState(), ["sukses"]);
    assert.strictEqual(getErrors().length, 1);
  });

  it("menyamakan state dengan hasil reload setelah penyimpanan gagal", async () => {
    let state = ["awal"];
    const errors: unknown[] = [];
    const queue = createWriteQueue();
    let reloadCalls = 0;

    const writer = createOptimisticWriter<string[]>({
      getState: () => state,
      setState: (next) => { state = next; },
      enqueue: (operation) => queue.enqueue(operation),
      onError: (error) => { errors.push(error); },
      reload: async () => {
        reloadCalls += 1;
        return ["disk"];
      },
    });

    await assert.rejects(
      writer.apply(["optimistik"], async () => {
        throw new Error("gagal simpan");
      }),
      /gagal simpan/
    );

    assert.strictEqual(reloadCalls, 1);
    assert.deepStrictEqual(state, ["disk"]);
    assert.strictEqual(errors.length, 1); // hanya error simpan, reload sukses
  });

  it("tidak memanggil reload bila semua operasi berhasil", async () => {
    let state = ["awal"];
    const queue = createWriteQueue();
    let reloadCalls = 0;

    const writer = createOptimisticWriter<string[]>({
      getState: () => state,
      setState: (next) => { state = next; },
      enqueue: (operation) => queue.enqueue(operation),
      onError: () => {}, // tidak diharapkan
      reload: async () => {
        reloadCalls += 1;
        return ["tidak-dipakai"];
      },
    });

    await writer.apply(["sukses"], async () => {});

    assert.strictEqual(reloadCalls, 0);
    assert.deepStrictEqual(state, ["sukses"]);
  });

  it("kegagalan reload dilaporkan dan state tidak berubah menjadi data kosong", async () => {
    let state = ["awal"];
    const errors: unknown[] = [];
    const queue = createWriteQueue();

    const writer = createOptimisticWriter<string[]>({
      getState: () => state,
      setState: (next) => { state = next; },
      enqueue: (operation) => queue.enqueue(operation),
      onError: (error) => { errors.push(error); },
      reload: async () => {
        throw new Error("gagal baca");
      },
    });

    await assert.rejects(
      writer.apply(["optimistik"], async () => {
        throw new Error("gagal simpan");
      }),
      /gagal simpan/
    );

    // Snapshot rollback tetap dipakai; state tidak diganti data kosong.
    assert.deepStrictEqual(state, ["awal"]);
    assert.deepStrictEqual(
      errors.map((error) => (error instanceof Error ? error.message : String(error))),
      ["gagal simpan", "gagal baca"]
    );
  });

  it("hasil reload yang basi tidak menimpa operasi yang lebih baru", async () => {
    let state = ["awal"];
    const errors: unknown[] = [];
    const queue = createWriteQueue();
    const reloadResolvers: Array<(value: string[]) => void> = [];

    const writer = createOptimisticWriter<string[]>({
      getState: () => state,
      setState: (next) => { state = next; },
      enqueue: (operation) => queue.enqueue(operation),
      onError: (error) => { errors.push(error); },
      reload: () =>
        new Promise<string[]>((resolve) => {
          reloadResolvers.push(resolve);
        }),
    });

    const first = writer.apply(["gagal"], async () => {
      throw new Error("gagal-1");
    });
    const firstResult = first.then(
      () => null,
      (error: unknown) => error
    );

    // Tunggu sampai rekonsiliasi mulai membaca repository.
    await tick();
    assert.strictEqual(reloadResolvers.length, 1);

    // Operasi baru diterapkan optimistik saat reload masih berjalan.
    const second = writer.apply(["gagal", "baru"], async () => {});
    await tick();

    // Reload pertama selesai dengan data lama → harus dibuang.
    reloadResolvers[0](["basi"]);
    await tick();
    assert.deepStrictEqual(state, ["gagal", "baru"]);

    // Operasi kedua selesai → rekonsiliasi ulang dengan data repository terbaru.
    await tick();
    assert.strictEqual(reloadResolvers.length, 2);
    reloadResolvers[1](["gagal", "baru"]);

    assert.ok((await firstResult) instanceof Error);
    await second;
    assert.deepStrictEqual(state, ["gagal", "baru"]);
    assert.strictEqual(errors.length, 1);
  });
});

describe("resolveToday", () => {
  it("mengembalikan format YYYY-MM-DD", () => {
    const today = resolveToday();
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(today));
  });

  it("berubah ketika hari berubah (simulasi)", () => {
    const today1 = resolveToday(new Date(2026, 9, 19, 23, 59));
    const today2 = resolveToday(new Date(2026, 9, 20, 0, 1));
    assert.strictEqual(today1, "2026-10-19");
    assert.strictEqual(today2, "2026-10-20");
  });
});
