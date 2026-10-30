import { HabitRepository } from "../types/repository";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLocalHabitRepository } from "../services/LocalHabitRepository";

// Single point: memilih implementasi repository.
// Di production: gunakan AsyncStorage asli. Di test: bisa diganti dengan mock storage.
const storageAdapter = {
  getItem: (key: string) =>
    AsyncStorage.getItem(key).catch(() => null),
  setItem: (key: string, value: string) =>
    AsyncStorage.setItem(key, value),
};

export const habitRepository: HabitRepository = createLocalHabitRepository(
  storageAdapter
);