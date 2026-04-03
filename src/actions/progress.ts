"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculate1RM, getWeekBounds } from "@/lib/calculations";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export interface WeeklyExerciseSummaryResult {
  exercise: string;
  peak1RM: number;
  delta: number;
}

export async function getWeeklySummary(weekStart: string) {
  const userId = await getUserId();
  const currentStart = new Date(weekStart);
  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 7);

  // Previous week
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - 7);

  // Fetch current and previous week workouts
  const [currentWorkouts, prevWorkouts] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, date: { gte: currentStart, lt: currentEnd } },
      include: { exercises: true },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: prevStart, lt: currentStart } },
      include: { exercises: true },
    }),
  ]);

  // Calculate current week peaks
  const currentPeaks = new Map<string, number>();
  for (const w of currentWorkouts) {
    for (const ex of w.exercises) {
      const rm = calculate1RM(ex.weight, ex.reps);
      const current = currentPeaks.get(ex.exercise) || 0;
      if (rm > current) currentPeaks.set(ex.exercise, rm);
    }
  }

  // Calculate previous week peaks
  const prevPeaks = new Map<string, number>();
  for (const w of prevWorkouts) {
    for (const ex of w.exercises) {
      const rm = calculate1RM(ex.weight, ex.reps);
      const current = prevPeaks.get(ex.exercise) || 0;
      if (rm > current) prevPeaks.set(ex.exercise, rm);
    }
  }

  // Build summaries
  const summaries: WeeklyExerciseSummaryResult[] = [];
  currentPeaks.forEach((peak, exercise) => {
    const prev = prevPeaks.get(exercise) || 0;
    summaries.push({
      exercise,
      peak1RM: peak,
      delta: prev > 0 ? Math.round((peak - prev) * 10) / 10 : 0,
    });
  });

  return summaries.sort((a, b) => b.peak1RM - a.peak1RM);
}

export async function getCurrentStats() {
  const userId = await getUserId();

  // Total workouts
  const totalWorkouts = await prisma.workout.count({
    where: { userId },
  });

  // Total exercises logged
  const totalExercises = await prisma.exerciseLog.count({
    where: { workout: { userId } },
  });

  // Best 1RM across all exercises
  const allLogs = await prisma.exerciseLog.findMany({
    where: { workout: { userId } },
  });

  let best1RM = 0;
  let best1RMExercise = "";
  for (const log of allLogs) {
    const rm = calculate1RM(log.weight, log.reps);
    if (rm > best1RM) {
      best1RM = rm;
      best1RMExercise = log.exercise;
    }
  }

  // Streak: consecutive days with workouts (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentWorkouts = await prisma.workout.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const workoutDays = new Set(
    recentWorkouts.map((w) => w.date.toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (workoutDays.has(d.toISOString().split("T")[0])) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    totalWorkouts,
    totalExercises,
    best1RM,
    best1RMExercise,
    streak,
  };
}
