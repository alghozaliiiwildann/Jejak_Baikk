import type { Habit } from "./habit";

export interface HabitRepository {
  loadHabits(): Promise<Habit[]>;
  addHabit(h: Habit): Promise<void>;
  setCompletion(habitId: string, date: string, done: boolean): Promise<void>;
  deleteHabit(habitId: string): Promise<void>;
  saveHabits(habits: Habit[]): Promise<void>;
}