import { HabitRepository } from "../types/repository";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLocalHabitRepository } from "../services/LocalHabitRepository";

// Single point: memilih implementasi repository.
// Gagal baca TIDAK boleh diubah menjadi null: error harus diteruskan ke pemanggil
// supaya loadHabits gagal secara eksplisit dan data lama tidak dianggap data kosong.
const storageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    AsyncStorage.setItem(key, value),
};

export const habitRepository: HabitRepository = createLocalHabitRepository(
  storageAdapter
);