"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUpperExercises, getLowerExercises } from "@/data/exercises";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getWorkoutPlans() {
  const userId = await getUserId();
  return prisma.workoutPlan.findMany({
    where: { userId },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createDefaultPlans() {
  const userId = await getUserId();

  const existing = await prisma.workoutPlan.findMany({ where: { userId } });
  if (existing.length > 0) return existing;

  const upperExercises = getUpperExercises().slice(0, 8);
  const lowerExercises = getLowerExercises().slice(0, 8);

  const upper = await prisma.workoutPlan.create({
    data: {
      userId,
      name: "Upper Body",
      type: "upper",
      exercises: {
        create: upperExercises.map((ex, i) => ({
          exerciseId: ex.id,
          defaultSets: ex.type === "compound" ? 4 : 3,
          defaultReps: ex.type === "compound" ? 8 : 12,
          restTime: ex.defaultRestTime,
          order: i,
        })),
      },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  const lower = await prisma.workoutPlan.create({
    data: {
      userId,
      name: "Lower Body",
      type: "lower",
      exercises: {
        create: lowerExercises.map((ex, i) => ({
          exerciseId: ex.id,
          defaultSets: ex.type === "compound" ? 4 : 3,
          defaultReps: ex.type === "compound" ? 8 : 12,
          restTime: ex.defaultRestTime,
          order: i,
        })),
      },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  return [upper, lower];
}

export async function createWorkoutPlan(
  name: string,
  type: string,
  exerciseItems: { exerciseId: string; defaultSets: number; defaultReps: number; restTime: number; order: number }[]
) {
  const userId = await getUserId();
  return prisma.workoutPlan.create({
    data: {
      userId,
      name,
      type,
      exercises: { create: exerciseItems },
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
}

export async function updateWorkoutPlanExercises(
  planId: string,
  exerciseItems: { exerciseId: string; defaultSets: number; defaultReps: number; restTime: number; order: number }[]
) {
  const userId = await getUserId();
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");

  // Delete existing and recreate
  await prisma.workoutPlanExercise.deleteMany({ where: { planId } });
  await prisma.workoutPlanExercise.createMany({
    data: exerciseItems.map((ex) => ({ ...ex, planId })),
  });

  return prisma.workoutPlan.findUnique({
    where: { id: planId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
}

export async function deleteWorkoutPlan(planId: string) {
  const userId = await getUserId();
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");
  await prisma.workoutPlan.delete({ where: { id: planId } });
}
