// ── Core Calculations for Gym Progress Tracker ──

export interface ExerciseLogLike {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface WorkoutLike<TExercise extends ExerciseLogLike = ExerciseLogLike> {
  id: string;
  date: string;
  exercises: TExercise[];
}

/**
 * Epley formula: 1RM = weight × (1 + reps / 30)
 * For 1 rep, return the weight directly.
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate progress percentage towards goal
 */
export function calculateProgress(current1RM: number, targetWeight: number): number {
  if (targetWeight <= 0) return 0;
  return Math.min(Math.round((current1RM / targetWeight) * 100), 100);
}

/**
 * Get the peak 1RM for a specific exercise from a list of workouts
 */
export function getPeak1RM(workouts: WorkoutLike[], exercise: string): number {
  let peak = 0;
  for (const workout of workouts) {
    for (const log of workout.exercises) {
      if (log.exercise === exercise) {
        const rm = calculate1RM(log.weight, log.reps);
        if (rm > peak) peak = rm;
      }
    }
  }
  return peak;
}

/**
 * Get the best set (highest 1RM) from an exercise log
 */
export function getBest1RMFromLog(log: ExerciseLogLike): number {
  return calculate1RM(log.weight, log.reps);
}

/**
 * Get week boundaries (Monday-Sunday) for a given date
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Group workouts by calendar week
 */
export function groupWorkoutsByWeek(workouts: WorkoutLike[]): Map<string, WorkoutLike[]> {
  const weeks = new Map<string, WorkoutLike[]>();
  for (const workout of workouts) {
    const { start } = getWeekBounds(new Date(workout.date));
    const key = start.toISOString().split("T")[0];
    const existing = weeks.get(key) || [];
    existing.push(workout);
    weeks.set(key, existing);
  }
  return weeks;
}

/**
 * Get weekly exercise summary with peak 1RM and delta from previous week
 */
export interface WeeklyExerciseSummary {
  exercise: string;
  peak1RM: number;
  delta: number; // change from previous week
}

export function getWeeklySummary(
  currentWeekWorkouts: WorkoutLike[],
  previousWeekWorkouts: WorkoutLike[]
): WeeklyExerciseSummary[] {
  // Collect all exercises in current week
  const exerciseMap = new Map<string, number>();
  for (const workout of currentWeekWorkouts) {
    for (const log of workout.exercises) {
      const rm = calculate1RM(log.weight, log.reps);
      const current = exerciseMap.get(log.exercise) || 0;
      if (rm > current) exerciseMap.set(log.exercise, rm);
    }
  }

  // Collect previous week peaks
  const prevMap = new Map<string, number>();
  for (const workout of previousWeekWorkouts) {
    for (const log of workout.exercises) {
      const rm = calculate1RM(log.weight, log.reps);
      const current = prevMap.get(log.exercise) || 0;
      if (rm > current) prevMap.set(log.exercise, rm);
    }
  }

  const summaries: WeeklyExerciseSummary[] = [];
  exerciseMap.forEach((peak, exercise) => {
    const prevPeak = prevMap.get(exercise) || 0;
    summaries.push({
      exercise,
      peak1RM: peak,
      delta: prevPeak > 0 ? Math.round((peak - prevPeak) * 10) / 10 : 0,
    });
  });

  return summaries.sort((a, b) => b.peak1RM - a.peak1RM);
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date to short string
 */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Get days until deadline
 */
export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
