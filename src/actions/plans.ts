"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  type ExercisePlanBucket,
  type ExerciseCatalogItem,
} from "@/lib/exercise-catalog";
import {
  fetchExerciseCatalog,
  fetchExercisesByIds,
  isGymFitQuotaExceededError,
} from "@/lib/gymfit";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getWorkoutPlans() {
  const userId = await getUserId();
  const plans = await prisma.workoutPlan.findMany({
    where: { userId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return serializePlanCollection(plans);
}

export async function createDefaultPlans() {
  const userId = await getUserId();

  const existing = await prisma.workoutPlan.findMany({
    where: { userId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });
  if (existing.length > 0) return serializePlanCollection(existing);

  let serialized: ExerciseCatalogItem[] = [];
  try {
    serialized = await fetchExerciseCatalog({
      limit: 120,
    });
  } catch (error) {
    if (!isGymFitQuotaExceededError(error)) {
      throw error;
    }
  }
  const upperExercises = pickDefaultExercises(serialized, "upper").slice(0, 8);
  const lowerExercises = pickDefaultExercises(serialized, "lower").slice(0, 8);

  if (upperExercises.length === 0 && lowerExercises.length === 0) {
    return [];
  }

  const upper = await prisma.workoutPlan.create({
    data: {
      userId,
      name: "Upper Body",
      type: "upper",
      exercises: {
        create: upperExercises.map((ex, i) => ({
          exerciseId: ex.id,
          defaultSets: ex.defaultSets,
          defaultReps: ex.defaultReps,
          restTime: ex.defaultRestTime,
          order: i,
        })),
      },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  const lower = await prisma.workoutPlan.create({
    data: {
      userId,
      name: "Lower Body",
      type: "lower",
      exercises: {
        create: lowerExercises.map((ex, i) => ({
          exerciseId: ex.id,
          defaultSets: ex.defaultSets,
          defaultReps: ex.defaultReps,
          restTime: ex.defaultRestTime,
          order: i,
        })),
      },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  return serializePlanCollection([upper, lower]);
}

export async function createWorkoutPlan(
  name: string,
  type: string,
  exerciseItems: { exerciseId: string; defaultSets: number; defaultReps: number; restTime: number; order: number }[]
) {
  const userId = await getUserId();
  const plan = await prisma.workoutPlan.create({
    data: {
      userId,
      name,
      type,
      exercises: { create: exerciseItems },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  const [serialized] = await serializePlanCollection([plan]);
  return serialized;
}

export async function updateWorkoutPlanExercises(
  planId: string,
  name: string,
  exerciseItems: { exerciseId: string; defaultSets: number; defaultReps: number; restTime: number; order: number }[]
) {
  const userId = await getUserId();
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");

  await prisma.$transaction(async (tx) => {
    await tx.workoutPlan.update({
      where: { id: planId },
      data: { name },
    });
    await tx.workoutPlanExercise.deleteMany({ where: { planId } });
    await tx.workoutPlanExercise.createMany({
      data: exerciseItems.map((ex) => ({ ...ex, planId })),
    });
  });

  const updatedPlan = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!updatedPlan) return null;

  const [serialized] = await serializePlanCollection([updatedPlan]);
  return serialized;
}

export async function deleteWorkoutPlan(planId: string) {
  const userId = await getUserId();
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");
  await prisma.workoutPlan.delete({ where: { id: planId } });
}

type PlanWithExercises = {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  exercises: Array<{
    id: string;
    planId: string;
    exerciseId: string;
    defaultSets: number;
    defaultReps: number;
    restTime: number;
    order: number;
  }>;
};

async function serializePlanCollection(plans: PlanWithExercises[]) {
  const catalogItems = await fetchExercisesByIds(
    Array.from(
      new Set(plans.flatMap((plan) => plan.exercises.map((entry) => entry.exerciseId)))
    )
  );
  const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));

  return plans.map((plan) => ({
    ...plan,
    exercises: plan.exercises
      .filter((entry) => catalogMap.has(entry.exerciseId))
      .map((entry) => ({
        ...entry,
        exercise: catalogMap.get(entry.exerciseId)!,
      })),
  }));
}

function pickDefaultExercises(
  exercises: ExerciseCatalogItem[],
  bucket: ExercisePlanBucket
) {
  return exercises.filter((exercise) => exercise.planBucket === bucket);
}
