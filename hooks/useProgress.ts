import { useMemo } from "react";

import {
  calcDailyPercent,
  calcLast7Days,
  calcWeeklyAverage,
} from "../utils/progress";
import { useHabits } from "./useHabits";

/** Kontrak: { total, doneToday, todayPercent, last7Days, weeklyAverage } */
export function useProgress() {
  // habits & today dari sumber yang sama (HabitsContext) agar Home dan Progress konsisten.
  const { habits, today } = useHabits();

  return useMemo(() => {
    const doneToday = habits.filter((habit) =>
      habit.completions.includes(today)
    ).length;

    return {
      total: habits.length,
      doneToday,
      todayPercent: calcDailyPercent(habits, today),
      last7Days: calcLast7Days(habits),
      weeklyAverage: calcWeeklyAverage(habits),
    };
  }, [habits, today]);
}
