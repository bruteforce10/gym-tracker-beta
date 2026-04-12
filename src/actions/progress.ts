"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { calculate1RM } from "@/lib/calculations";
import { fetchExercisesByIds } from "@/lib/exercise-store";
import {
  addDays,
  getMonthKey,
  getWeekStartDate,
  parseDateKey,
  toDateKey,
} from "@/lib/progress";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export interface WeeklyExerciseSummaryResult {
  exerciseId: string;
  exercise: string;
  peak1RM: number;
  delta: number;
}

export interface ProgressExerciseEntry {
  exerciseId: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
  estimated1RM: number;
}

export interface ProgressWorkoutRecord {
  id: string;
  title: string;
  date: string;
  monthKey: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  exercises: ProgressExerciseEntry[];
}

export interface ProgressDashboardData {
  totals: {
    totalWorkouts: number;
    totalMinutes: number;
    totalVolume: number;
  };
  frequency: Array<{
    weekStart: string;
    label: string;
    workouts: number;
  }>;
  thisWeek: {
    days: Array<{
      date: string;
      label: string;
      shortLabel: string;
      workouts: number;
      durationMinutes: number;
      isToday: boolean;
    }>;
    todayMinutes: number;
    averageMinutes: number;
  };
  weeklySummary: WeeklyExerciseSummaryResult[];
  historyPreview: ProgressWorkoutRecord[];
  weight: {
    currentKg: number | null;
    changeKg: number | null;
    latestLoggedOn: string | null;
    points: Array<{
      date: string;
      valueKg: number;
    }>;
  };
}

export interface ProgressHistoryData {
  availableMonths: string[];
  defaultMonthKey: string;
  workouts: ProgressWorkoutRecord[];
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getDurationMinutes(startedAt: Date, endedAt: Date | null): number {
  if (!endedAt) return 0;
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
}

function buildWorkoutTitle(exercises: ProgressExerciseEntry[]): string {
  const exerciseNames = Array.from(new Set(exercises.map((entry) => entry.exercise)));
  if (exerciseNames.length === 0) return "Workout";
  if (exerciseNames.length === 1) return exerciseNames[0];
  return `${exerciseNames[0]} + ${exerciseNames.length - 1} lagi`;
}

async function getSerializedWorkouts(userId: string): Promise<ProgressWorkoutRecord[]> {
  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { exercises: true },
  });

  const exerciseIds = Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises.map((entry) => entry.exerciseId).filter(Boolean),
      ),
    ),
  ) as string[];
  const catalogItems = await fetchExercisesByIds(exerciseIds);
  const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));

  return workouts.map((workout) => {
    const exercises = workout.exercises
      .filter((entry) => Boolean(entry.exerciseId && catalogMap.has(entry.exerciseId)))
      .map((entry) => {
        const exercise = catalogMap.get(entry.exerciseId!);
        const volume = entry.weight * entry.reps * entry.sets;

        return {
          exerciseId: entry.exerciseId!,
          exercise: exercise?.name ?? "Unknown Exercise",
          weight: entry.weight,
          reps: entry.reps,
          sets: entry.sets,
          volume: roundToSingleDecimal(volume),
          estimated1RM: calculate1RM(entry.weight, entry.reps),
        };
      });

    const totalVolume = exercises.reduce((sum, entry) => sum + entry.volume, 0);

    return {
      id: workout.id,
      title: buildWorkoutTitle(exercises),
      date: toDateKey(workout.date),
      monthKey: getMonthKey(workout.date),
      startedAt: workout.startedAt.toISOString(),
      endedAt: workout.endedAt?.toISOString() ?? null,
      durationMinutes: getDurationMinutes(workout.startedAt, workout.endedAt),
      totalVolume: roundToSingleDecimal(totalVolume),
      exerciseCount: exercises.length,
      exercises,
    };
  });
}

export async function getWeeklySummary(weekStart: string) {
  const userId = await getUserId();
  const currentStart = parseDateKey(weekStart);
  const currentEnd = addDays(currentStart, 7);
  const prevStart = addDays(currentStart, -7);

  const [currentWorkouts, prevWorkouts] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, date: { gte: currentStart, lt: currentEnd } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: { exercises: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: prevStart, lt: currentStart } },
      include: { exercises: true },
    }),
  ]);

  const currentIds = Array.from(
    new Set(
      currentWorkouts.flatMap((workout) =>
        workout.exercises.map((exercise) => exercise.exerciseId).filter(Boolean),
      ),
    ),
  ) as string[];
  const currentExercises = await fetchExercisesByIds(currentIds);
  const exerciseNames = new Map(currentExercises.map((exercise) => [exercise.id, exercise.name]));

  const currentPeaks = new Map<string, number>();
  const currentWeekFirstRm = new Map<string, number>();
  for (const workout of currentWorkouts) {
    for (const exercise of workout.exercises) {
      if (!exercise.exerciseId) continue;
      const oneRm = calculate1RM(exercise.weight, exercise.reps);
      if (!currentWeekFirstRm.has(exercise.exerciseId)) {
        currentWeekFirstRm.set(exercise.exerciseId, oneRm);
      }

      const peak = currentPeaks.get(exercise.exerciseId) ?? 0;
      if (oneRm > peak) currentPeaks.set(exercise.exerciseId, oneRm);
    }
  }

  const previousPeaks = new Map<string, number>();
  for (const workout of prevWorkouts) {
    for (const exercise of workout.exercises) {
      if (!exercise.exerciseId) continue;
      const peak = previousPeaks.get(exercise.exerciseId) ?? 0;
      const oneRm = calculate1RM(exercise.weight, exercise.reps);
      if (oneRm > peak) previousPeaks.set(exercise.exerciseId, oneRm);
    }
  }

  const summaries: WeeklyExerciseSummaryResult[] = [];
  currentPeaks.forEach((peak, exerciseId) => {
    const previousPeak = previousPeaks.get(exerciseId) ?? 0;
    const firstRmThisWeek = currentWeekFirstRm.get(exerciseId) ?? peak;
    const deltaBase =
      previousPeak > 0 ? peak - previousPeak : peak - firstRmThisWeek;
    summaries.push({
      exerciseId,
      exercise: exerciseNames.get(exerciseId) ?? "Unknown Exercise",
      peak1RM: peak,
      delta: roundToSingleDecimal(deltaBase),
    });
  });

  return summaries.sort((left, right) => right.peak1RM - left.peak1RM);
}

export async function getCurrentStats() {
  const userId = await getUserId();
  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  const allLogs = workouts.flatMap((workout) => workout.exercises);
  const catalogItems = await fetchExercisesByIds(
    Array.from(new Set(allLogs.map((log) => log.exerciseId).filter(Boolean))) as string[],
  );
  const catalogMap = new Map(catalogItems.map((item) => [item.id, item.name]));

  let best1RM = 0;
  let best1RMExercise = "";
  for (const log of allLogs) {
    if (!log.exerciseId) continue;
    const oneRm = calculate1RM(log.weight, log.reps);
    if (oneRm > best1RM) {
      best1RM = oneRm;
      best1RMExercise = catalogMap.get(log.exerciseId) ?? "Unknown Exercise";
    }
  }

  const sevenDaysAgo = addDays(new Date(), -7);
  const workoutDays = new Set(
    workouts
      .filter((workout) => workout.date >= sevenDaysAgo)
      .map((workout) => toDateKey(workout.date)),
  );

  let streak = 0;
  const today = new Date();
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(today, -index);
    if (workoutDays.has(toDateKey(date))) {
      streak += 1;
    } else if (index > 0) {
      break;
    }
  }

  return {
    totalWorkouts: workouts.length,
    totalExercises: allLogs.length,
    best1RM,
    best1RMExercise,
    streak,
  };
}

export async function getProgressDashboardData(): Promise<ProgressDashboardData> {
  const userId = await getUserId();
  const [workouts, weightLogs] = await Promise.all([
    getSerializedWorkouts(userId),
    prisma.weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: "asc" },
    }),
  ]);

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const totalVolume = roundToSingleDecimal(
    workouts.reduce((sum, workout) => sum + workout.totalVolume, 0),
  );

  const today = new Date();
  const currentWeekStart = getWeekStartDate(today);
  const weeklySummary = await getWeeklySummary(toDateKey(currentWeekStart));

  const workoutCountsByWeek = new Map<string, number>();
  const workoutCountsByDay = new Map<string, number>();
  const durationByDay = new Map<string, number>();

  for (const workout of workouts) {
    const workoutDate = parseDateKey(workout.date);
    const weekKey = toDateKey(getWeekStartDate(workoutDate));
    workoutCountsByWeek.set(weekKey, (workoutCountsByWeek.get(weekKey) ?? 0) + 1);
    workoutCountsByDay.set(workout.date, (workoutCountsByDay.get(workout.date) ?? 0) + 1);
    durationByDay.set(
      workout.date,
      (durationByDay.get(workout.date) ?? 0) + workout.durationMinutes,
    );
  }

  const weekLabelFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  });
  const frequency = Array.from({ length: 8 }, (_, index) => {
    const weekStart = addDays(currentWeekStart, (index - 7) * 7);
    const weekKey = toDateKey(weekStart);
    return {
      weekStart: weekKey,
      label: weekLabelFormatter.format(weekStart),
      workouts: workoutCountsByWeek.get(weekKey) ?? 0,
    };
  });

  const dayLabelFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const thisWeekDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(currentWeekStart, index);
    const dateKey = toDateKey(date);
    return {
      date: dateKey,
      label: dayLabelFormatter.format(date),
      shortLabel: dayLabelFormatter.format(date).slice(0, 1),
      workouts: workoutCountsByDay.get(dateKey) ?? 0,
      durationMinutes: durationByDay.get(dateKey) ?? 0,
      isToday: dateKey === toDateKey(today),
    };
  });
  const totalWeekMinutes = thisWeekDays.reduce((sum, day) => sum + day.durationMinutes, 0);
  const todayMinutes = thisWeekDays.find((day) => day.isToday)?.durationMinutes ?? 0;

  const latestWeight = weightLogs.at(-1) ?? null;
  const weightWindowStart = addDays(today, -29);
  const recentWeightPoints = weightLogs
    .filter((log) => log.loggedAt >= weightWindowStart)
    .map((log) => ({
      date: log.loggedOn,
      valueKg: roundToSingleDecimal(log.valueKg),
    }));
  const weightChangeKg =
    recentWeightPoints.length >= 2 && latestWeight
      ? roundToSingleDecimal(
          latestWeight.valueKg - recentWeightPoints[0].valueKg,
        )
      : null;

  return {
    totals: {
      totalWorkouts,
      totalMinutes,
      totalVolume,
    },
    frequency,
    thisWeek: {
      days: thisWeekDays,
      todayMinutes,
      averageMinutes: roundToSingleDecimal(totalWeekMinutes / 7),
    },
    weeklySummary: weeklySummary.slice(0, 4),
    historyPreview: workouts.slice(0, 3),
    weight: {
      currentKg: latestWeight ? roundToSingleDecimal(latestWeight.valueKg) : null,
      changeKg: weightChangeKg,
      latestLoggedOn: latestWeight?.loggedOn ?? null,
      points: recentWeightPoints,
    },
  };
}

export async function getProgressHistoryData(): Promise<ProgressHistoryData> {
  const userId = await getUserId();
  const workouts = await getSerializedWorkouts(userId);
  const monthKeys = Array.from(new Set(workouts.map((workout) => workout.monthKey)));
  const fallbackMonth = getMonthKey(new Date());

  return {
    availableMonths: monthKeys.length > 0 ? monthKeys : [fallbackMonth],
    defaultMonthKey: monthKeys[0] ?? fallbackMonth,
    workouts,
  };
}

export async function upsertWeightLog(input: { valueKg: number; loggedOn?: string }) {
  const userId = await getUserId();
  const valueKg = Number(input.valueKg);

  if (!Number.isFinite(valueKg) || valueKg <= 0) {
    throw new Error("Berat badan tidak valid");
  }

  const date = input.loggedOn ? parseDateKey(input.loggedOn) : new Date();
  const loggedOn = toDateKey(date);
  const loggedAt = parseDateKey(loggedOn);

  const weightLog = await prisma.weightLog.upsert({
    where: {
      userId_loggedOn: {
        userId,
        loggedOn,
      },
    },
    update: {
      valueKg,
      loggedAt,
    },
    create: {
      userId,
      valueKg,
      loggedOn,
      loggedAt,
    },
  });

  revalidatePath("/progress");
  revalidatePath("/progress/history");

  return {
    id: weightLog.id,
    valueKg: roundToSingleDecimal(weightLog.valueKg),
    loggedOn: weightLog.loggedOn,
  };
}
