/**
 * Fungsi murni operasi kebiasaan JejakBaik.
 * Tanpa React, tanpa AsyncStorage — bisa diuji dengan `node --test`.
 * Semua fungsi operasi data imutabil: menerima state lama, mengembalikan state baru.
 */

/** Format tanggal lokal YYYY-MM-DD melalui utils/date.ts */
import { getTodayLocal } from "./date";

/**
 * Cek apakah habit sudah selesai pada tanggal tertentu.
 * @param habit - objek habit
 * @param date - tanggal lokal YYYY-MM-DD (default: hari ini) — bisa diinjeksi agar deterministik
 * @returns true jika completions menyertakan tanggal tersebut
 */
export function nextDone(
  habit: { completions: string[] },
  date: string = getTodayLocal()
): boolean {
  return habit.completions.includes(date);
}

/**
 * applyCompletion: update completions untuk habit tertentu.
 * Idempotent: done=true pastikan tanggal ada (tanpa duplikat),
 * done=false pastikan tanggal tidak ada.
 * Tidak boleh membuat duplikat tanggal.
 * @param habit - habit lama (tidak dimutasi)
 * @param done - true = tambahkan, false = hapus
 * @param date - tanggal lokal YYYY-MM-DD (default: hari ini) — bisa diinjeksi agar deterministik
 * @returns habit baru dengan completions yang diperbarui
 */
export function applyCompletion(
  habit: { completions: string[] },
  done: boolean,
  date: string = getTodayLocal()
): { completions: string[] } {
  // Hapus semua kemungkinan duplikat tanggal terlebih dahulu
  const withoutDate = habit.completions.filter((d) => d !== date);

  if (done) {
    // pastikan tanggal ada, tanpa duplikat
    return { completions: [...withoutDate, date] };
  }
  // hapus tanggal, tanpa menambah yang lain
  return { completions: withoutDate };
}

/**
 * removeHabit: hapus habit dari array habits berdasarkan id.
 * Imutabil: mengembalikan array baru tanpa habit yang dihapus.
 * @param habits - array habit lama
 * @param id - id habit yang dihapus
 * @returns array habit baru
 */
export function removeHabit<T extends { id: string }>(habits: T[], id: string): T[] {
  return habits.filter((h) => h.id !== id);
}

/** Antrean tulis serial. */
export type WriteQueue = {
  /**
   * Masukkan operasi ke antrean FIFO.
   * Promise yang dikembalikan resolve/reject mengikuti hasil operasi itu sendiri,
   * sehingga pemanggil bisa melakukan rollback saat gagal.
   */
  enqueue(operation: () => Promise<void>): Promise<void>;
};

/**
 * createWriteQueue: buat antrian serial untuk operasi tulis.
 * Jaminan:
 * - FIFO: operasi dijalankan sesuai urutan enqueue.
 * - Serial: operasi berikutnya tidak mulai sebelum operasi sebelumnya selesai.
 * - Satu operasi gagal tidak menghentikan antrian; promise operasi tersebut tetap reject.
 */
export function createWriteQueue(): WriteQueue {
  // tail tidak pernah reject: rantai berikutnya selalu bisa jalan.
  let tail: Promise<void> = Promise.resolve();

  const enqueue = (operation: () => Promise<void>): Promise<void> => {
    const run = tail.then(() => operation());
    tail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };

  return { enqueue };
}

export type OptimisticWriter<T> = {
  /**
   * Terapkan state baru secara optimistik lalu simpan.
   * Jika penyimpanan gagal: panggil onError, rollback ke snapshot SEBELUM operasi
   * (hanya jika tidak ada perubahan optimistik yang lebih baru), lalu reject.
   */
  apply(next: T, persist: () => Promise<void>): Promise<void>;
};

/**
 * createOptimisticWriter: satukan optimistic update + rollback + antrean serial.
 *
 * Alur satu operasi:
 * 1. Snapshot state sebelum operasi (`before`) lalu terapkan state baru secara optimistik.
 * 2. Simpan lewat antrean serial, sehingga urutan tulis sama dengan urutan aksi user.
 * 3. Sukses → selesai. Gagal → laporkan error, lalu pulihkan state:
 *    - Jika belum ada operasi yang lebih baru: kembalikan `before` (cepat, tanpa I/O).
 *    - Jika sudah ada operasi lebih baru: JANGAN restore `before`, karena `before` tidak
 *      memuat perubahan baru dan akan menghapusnya. Tandai perlu rekonsiliasi.
 * 4. Saat antrean kosong (tidak ada operasi optimistik yang belum tersimpan), state
 *      disamakan dengan isi repository (`reload`). Repository adalah sumber kebenaran:
 *      perubahan dari operasi yang GAGAL hilang dari state, perubahan dari operasi yang
 *      BERHASIL tetap ada. Ini juga menutup kasus dua kegagalan berurutan, di mana
 *      rollback snapshot operasi kedua masih memuat perubahan optimistik operasi pertama.
 *
 * Rekonsiliasi hanya berjalan di dalam operasi antrean (serial), jadi tidak bisa
 * bertabrakan dengan penulisan lain. Bila ada operasi baru masuk selama reload,
 * hasil reload dibuang dan rekonsiliasi diulang setelah operasi baru itu selesai.
 *
 * @param options.getState - baca state terkini
 * @param options.setState - tulis state (optimistic update, rollback, rekonsiliasi)
 * @param options.enqueue - antrean serial (biasanya createWriteQueue().enqueue)
 * @param options.onError - pelaporan error (mis. setError pada context)
 * @param options.reload - baca ulang data dari repository (sumber kebenaran).
 *   Tanpa `reload`, hanya rollback snapshot yang tersedia.
 */
export function createOptimisticWriter<T>(options: {
  getState: () => T;
  setState: (state: T) => void;
  enqueue: (operation: () => Promise<void>) => Promise<void>;
  onError: (error: unknown) => void;
  reload?: () => Promise<T>;
}): OptimisticWriter<T> {
  // revision: jumlah operasi yang pernah diterapkan (deteksi perubahan lebih baru).
  let revision = 0;
  // pending: operasi optimistik yang belum selesai disimpan.
  let pending = 0;
  // needsReconcile: ada perubahan memori yang belum pasti tersimpan.
  let needsReconcile = false;

  /**
   * Samakan state dengan isi repository, hanya ketika antrean idle.
   * Tidak pernah melempar: kegagalan reload dilaporkan lewat onError dan state
   * dibiarkan apa adanya (bukan diubah menjadi data kosong).
   */
  const reconcileIfIdle = async (): Promise<void> => {
    const reload = options.reload;
    if (!reload || !needsReconcile || pending > 0) return;

    needsReconcile = false;
    const startedAtRevision = revision;

    let persisted: T;
    try {
      persisted = await reload();
    } catch (error) {
      options.onError(error);
      // Coba lagi setelah operasi berikutnya selesai.
      needsReconcile = true;
      return;
    }

    if (revision !== startedAtRevision) {
      // Operasi baru diterapkan selama reload; hasilnya sudah basi.
      needsReconcile = true;
      return;
    }

    options.setState(persisted);
  };

  const apply = (next: T, persist: () => Promise<void>): Promise<void> => {
    const before = options.getState();
    const appliedAtRevision = ++revision;
    pending += 1;

    options.setState(next);

    return options.enqueue(async () => {
      try {
        await persist();
      } catch (error) {
        options.onError(error);
        if (revision === appliedAtRevision) {
          // Tidak ada perubahan yang lebih baru: rollback snapshot aman dan instan.
          options.setState(before);
        }
        // Ada atau tidak ada perubahan lebih baru, pastikan state akhir benar-benar
        // sama dengan isi repository (bukan sekadar snapshot di memori).
        needsReconcile = true;
        throw error;
      } finally {
        pending -= 1;
        await reconcileIfIdle();
      }
    });
  };

  return { apply };
}

/**
 * resolveToday: kembalikan string tanggal lokal YYYY-MM-DD
 * berdasarkan waktu sekarang.
 * @param now - opsional, jika tidak diberikan gunakan Date sekarang
 * @returns string tanggal lokal
 */
export function resolveToday(now: Date = new Date()): string {
  return getTodayLocal(now);
}
