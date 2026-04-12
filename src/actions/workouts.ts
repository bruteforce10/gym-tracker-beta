"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fetchExercisesByIds } from "@/lib/exercise-store";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createWorkout(
  date: string,
  exercises: { exerciseId: string; weight: number; reps: number; sets: number }[],
  startedAt: string,
  endedAt?: string
) {
  const userId = await getUserId();
  const normalizedStartedAt = new Date(startedAt);
  const normalizedEndedAt = endedAt ? new Date(endedAt) : new Date();

  if (Number.isNaN(normalizedStartedAt.getTime())) {
    throw new Error("Invalid workout start timestamp");
  }

  if (Number.isNaN(normalizedEndedAt.getTime())) {
    throw new Error("Invalid workout end timestamp");
  }

  const workout = await prisma.workout.create({
    data: {
      userId,
      date: new Date(date),
      startedAt: normalizedStartedAt,
      endedAt: normalizedEndedAt,
      exercises: {
        create: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          weight: ex.weight,
          reps: ex.reps,
          sets: ex.sets,
        })),
      },
    },
    include: { exercises: true },
  });

  const [serialized] = await serializeWorkoutCollection([workout]);
  return serialized;
}

export async function getRecentWorkouts(limit: number = 3) {
  const userId = await getUserId();

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: { exercises: true },
  });

  return serializeWorkoutCollection(workouts);
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

  return serializeWorkoutCollection(workouts);
}

export async function getAllWorkouts() {
  const userId = await getUserId();

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  return serializeWorkoutCollection(workouts);
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
  await prisma.weightLog.deleteMany({ where: { userId } });

  return { ok: true };
}

type WorkoutWithExercises = {
  id: string;
  userId: string;
  date: Date;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  exercises: Array<{
    id: string;
    workoutId: string;
    exerciseId: string | null;
    weight: number;
    reps: number;
    sets: number;
  }>;
};

async function serializeWorkoutCollection(workouts: WorkoutWithExercises[]) {
  const exerciseIds = Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises.map((entry) => entry.exerciseId).filter(Boolean)
      )
    )
  ) as string[];
  const catalogItems = await fetchExercisesByIds(exerciseIds);
  const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));

  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises
      .filter((entry) => Boolean(entry.exerciseId && catalogMap.has(entry.exerciseId)))
      .map((entry) => ({
        ...entry,
        exercise: catalogMap.get(entry.exerciseId!),
      })),
  }));
}
