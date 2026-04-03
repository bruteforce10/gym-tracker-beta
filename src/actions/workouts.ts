"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createWorkout(
  date: string,
  exercises: { exercise: string; weight: number; reps: number; sets: number }[]
) {
  const userId = await getUserId();

  const workout = await prisma.workout.create({
    data: {
      userId,
      date: new Date(date),
      exercises: {
        create: exercises.map((ex) => ({
          exercise: ex.exercise,
          weight: ex.weight,
          reps: ex.reps,
          sets: ex.sets,
        })),
      },
    },
    include: { exercises: true },
  });

  return workout;
}

export async function getRecentWorkouts(limit: number = 3) {
  const userId = await getUserId();

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: { exercises: true },
  });

  return workouts;
}

export async function getWorkoutsByWeek(weekStart: string) {
  const userId = await getUserId();
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
    },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  return workouts;
}

export async function getAllWorkouts() {
  const userId = await getUserId();

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  return workouts;
}

export async function clearUserData() {
  const userId = await getUserId();

  // Delete child → parent to avoid FK constraint errors
  await prisma.workoutPlanExercise.deleteMany({
    where: { plan: { userId } },
  });
  await prisma.workoutPlan.deleteMany({ where: { userId } });
  await prisma.exerciseLog.deleteMany({
    where: { workout: { userId } },
  });
  await prisma.workout.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });

  return { ok: true };
}
