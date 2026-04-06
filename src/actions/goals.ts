"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fetchExerciseById } from "@/lib/exercise-store";
import { calculate1RM } from "@/lib/calculations";
import { parseDateInputValue } from "@/lib/date";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getActiveGoal() {
  const userId = await getUserId();
  const goal = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!goal?.exerciseId) return null;

  const exercise = await fetchExerciseById(goal.exerciseId);
  if (!exercise) return null;

  return {
    ...goal,
    exercise,
  };
}

export async function getGoalPageData() {
  const userId = await getUserId();
  const [goal, workouts] = await Promise.all([
    prisma.goal.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { exercises: true },
    }),
  ]);

  if (!goal?.exerciseId) {
    return {
      goal: null,
      current1RM: 0,
    };
  }

  const exercise = await fetchExerciseById(goal.exerciseId);
  if (!exercise) {
    return {
      goal: null,
      current1RM: 0,
    };
  }

  let current1RM = 0;
  for (const workout of workouts) {
    for (const entry of workout.exercises) {
      if (entry.exerciseId !== goal.exerciseId) continue;
      const rm = calculate1RM(entry.weight, entry.reps);
      if (rm > current1RM) current1RM = rm;
    }
  }

  return {
    goal: {
      ...goal,
      exercise,
    },
    current1RM,
  };
}

export async function upsertGoal(data: {
  exerciseId: string;
  targetWeight: number;
  currentWeight?: number;
  deadline?: string | null;
}) {
  const userId = await getUserId();

  // Check if user already has a goal
  const existing = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const normalizedDeadline = parseDateInputValue(data.deadline ?? null);

  if (existing) {
    // Update existing
    const updated = await prisma.goal.update({
      where: { id: existing.id },
      data: {
        exerciseId: data.exerciseId,
        targetWeight: data.targetWeight,
        currentWeight: data.currentWeight ?? existing.currentWeight,
        deadline: normalizedDeadline,
      },
    });

    const exercise = await fetchExerciseById(updated.exerciseId ?? data.exerciseId);
    if (!exercise) throw new Error("Exercise not found in local catalog");

    return {
      ...updated,
      exercise,
    };
  } else {
    // Create new
    const created = await prisma.goal.create({
      data: {
        userId,
        exerciseId: data.exerciseId,
        targetWeight: data.targetWeight,
        currentWeight: data.currentWeight ?? 0,
        deadline: normalizedDeadline,
      },
    });

    const exercise = await fetchExerciseById(created.exerciseId ?? data.exerciseId);
    if (!exercise) throw new Error("Exercise not found in local catalog");

    return {
      ...created,
      exercise,
    };
  }
}
