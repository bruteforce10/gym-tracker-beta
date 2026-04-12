"use server";

import { auth } from "@/lib/auth";
import { calculate1RM } from "@/lib/calculations";
import { fetchExercisesByIds } from "@/lib/exercise-store";
import { getUserGoalCollections } from "@/lib/goal-state";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectionError } from "@/lib/prisma-errors";

type DashboardData = {
  goals: Awaited<ReturnType<typeof getUserGoalCollections>>["activeGoals"];
  stats: {
    totalWorkouts: number;
    totalExercises: number;
    best1RM: number;
    best1RMExercise: string;
    streak: number;
  };
  recentWorkouts: Array<{
    id: string;
    date: string;
    title: string;
    duration: string;
    exercises: Array<{
      exercise: string;
      weight: number;
      reps: number;
      sets: number;
      setDetails: Array<{
        setNumber: number;
        weight: number;
        reps: number;
      }>;
    }>;
  }>;
  databaseUnavailable: boolean;
};

function createEmptyDashboardData(): DashboardData {
  return {
    goals: [],
    stats: {
      totalWorkouts: 0,
      totalExercises: 0,
      best1RM: 0,
      best1RMExercise: "",
      streak: 0,
    },
    recentWorkouts: [],
    databaseUnavailable: false,
  };
}

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function formatWorkoutDuration(startedAt: Date, endedAt: Date | null): string {
  if (!endedAt) return "00:00";

  const diffSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
  );

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildWorkoutTitle(exerciseNames: string[]): string {
  const uniqueNames = Array.from(new Set(exerciseNames));
  if (uniqueNames.length === 0) return "Workout";
  if (uniqueNames.length === 1) return uniqueNames[0];
  return `${uniqueNames[0]} + ${uniqueNames.length - 1} lainnya`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const userId = await getUserId();

  try {
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
      recentWorkouts: recentWorkouts.map((workout) => {
        const validLogs = workout.exercises.filter(
          (exercise) => Boolean(exercise.exerciseId && exerciseMap.has(exercise.exerciseId))
        );

        const groupedByExercise = new Map<
          string,
          {
            exercise: string;
            logs: typeof validLogs;
          }
        >();

        validLogs.forEach((exercise) => {
          const exerciseId = exercise.exerciseId!;
          const exerciseName = exerciseMap.get(exerciseId)?.name ?? "Unknown Exercise";
          const existing = groupedByExercise.get(exerciseId);
          if (existing) {
            existing.logs.push(exercise);
            return;
          }

          groupedByExercise.set(exerciseId, {
            exercise: exerciseName,
            logs: [exercise],
          });
        });

        const groupedExercises = Array.from(groupedByExercise.values()).map((group) => {
          const setDetails = group.logs.flatMap((log) => {
            const count = Math.max(1, log.sets);
            return Array.from({ length: count }, () => ({
              weight: log.weight,
              reps: log.reps,
            }));
          });

          const bestSet = group.logs.reduce((currentBest, log) => {
            return calculate1RM(log.weight, log.reps) >
              calculate1RM(currentBest.weight, currentBest.reps)
              ? log
              : currentBest;
          });

          return {
            exercise: group.exercise,
            weight: bestSet.weight,
            reps: bestSet.reps,
            sets: setDetails.length,
            setDetails: setDetails.map((set, index) => ({
              setNumber: index + 1,
              weight: set.weight,
              reps: set.reps,
            })),
          };
        });

        return {
          id: workout.id,
          date: workout.date.toISOString().split("T")[0],
          title: buildWorkoutTitle(groupedExercises.map((exercise) => exercise.exercise)),
          duration: formatWorkoutDuration(
            workout.startedAt,
            workout.endedAt ?? workout.createdAt
          ),
          exercises: groupedExercises,
        };
      }),
      databaseUnavailable: false,
    };
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Dashboard data could not be loaded because the database is unreachable.", error);

      return {
        ...createEmptyDashboardData(),
        databaseUnavailable: true,
      };
    }

    throw error;
  }
}
