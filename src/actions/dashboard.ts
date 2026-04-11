"use server";

import { auth } from "@/lib/auth";
import { calculate1RM } from "@/lib/calculations";
import { fetchExercisesByIds } from "@/lib/exercise-store";
import { getUserGoalCollections } from "@/lib/goal-state";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getDashboardData() {
  const userId = await getUserId();

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { exercises: true },
  });

  const recentWorkouts = workouts.slice(0, 3);
  const exerciseIds = Array.from(
    new Set(
      workouts.flatMap((workout) =>
        workout.exercises.map((exercise) => exercise.exerciseId).filter(Boolean)
      )
    )
  ) as string[];
  const catalogItems = await fetchExercisesByIds(exerciseIds);
  const exerciseMap = new Map(catalogItems.map((item) => [item.id, item]));
  const { activeGoals } = await getUserGoalCollections(userId, workouts);

  let best1RM = 0;
  let best1RMExercise = "";
  for (const workout of workouts) {
    for (const log of workout.exercises) {
      if (!log.exerciseId) continue;
      const rm = calculate1RM(log.weight, log.reps);
      if (rm > best1RM) {
        best1RM = rm;
        best1RMExercise = exerciseMap.get(log.exerciseId)?.name ?? "Unknown Exercise";
      }
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const workoutDays = new Set(
    workouts
      .filter((workout) => workout.date >= sevenDaysAgo)
      .map((workout) => workout.date.toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (workoutDays.has(date.toISOString().split("T")[0])) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    goals: activeGoals,
    stats: {
      totalWorkouts: workouts.length,
      totalExercises: workouts.reduce((total, workout) => total + workout.exercises.length, 0),
      best1RM,
      best1RMExercise,
      streak,
    },
    recentWorkouts: recentWorkouts.map((workout) => ({
      id: workout.id,
      date: workout.date.toISOString().split("T")[0],
      exercises: workout.exercises
        .filter((exercise) => Boolean(exercise.exerciseId && exerciseMap.has(exercise.exerciseId)))
        .map((exercise) => ({
          exercise: exerciseMap.get(exercise.exerciseId!)?.name ?? "Unknown Exercise",
          weight: exercise.weight,
          reps: exercise.reps,
          sets: exercise.sets,
        })),
    })),
  };
}
