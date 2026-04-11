"use server";

import { auth } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/date";
import { getUserGoalCollections } from "@/lib/goal-state";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getActiveGoal() {
  const userId = await getUserId();
  const { activeGoals } = await getUserGoalCollections(userId);
  return activeGoals[0] ?? null;
}

export async function getGoalPageData() {
  const userId = await getUserId();
  const { activeGoals, completedGoals, overdueGoals } =
    await getUserGoalCollections(userId);

  return {
    activeGoals,
    completedGoals,
    overdueGoals,
    activeGoalCount: activeGoals.length,
  };
}

export async function upsertGoal(data: {
  goalId?: string | null;
  exerciseId: string;
  targetWeight: number;
  currentWeight?: number;
  deadline?: string | null;
}) {
  const userId = await getUserId();
  const goalId = data.goalId?.trim() || null;
  const normalizedDeadline = parseDateInputValue(data.deadline ?? null);

  if (!data.exerciseId) {
    return {
      success: false,
      code: "missing_exercise" as const,
      error: "Pilih exercise terlebih dahulu.",
    };
  }

  if (!Number.isFinite(data.targetWeight) || data.targetWeight <= 0) {
    return {
      success: false,
      code: "invalid_target" as const,
      error: "Target weight harus lebih besar dari 0.",
    };
  }

  if (!normalizedDeadline) {
    return {
      success: false,
      code: "missing_deadline" as const,
      error: "Deadline wajib diisi untuk setiap goal.",
    };
  }

  const { activeGoals, best1RMMap } = await getUserGoalCollections(userId);
  const duplicateGoal = activeGoals.find(
    (goal) => goal.exercise.id === data.exerciseId && goal.id !== goalId,
  );

  if (duplicateGoal) {
    return {
      success: false,
      code: "duplicate_active" as const,
      goalId: duplicateGoal.id,
      error: "Goal untuk exercise ini sudah ada. Kami buka mode edit.",
    };
  }

  const currentWeight = best1RMMap.get(data.exerciseId) ?? data.currentWeight ?? 0;

  if (goalId) {
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
        status: "active",
      },
    });

    if (!existingGoal) {
      return {
        success: false,
        code: "not_found" as const,
        error: "Goal aktif tidak ditemukan.",
      };
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        exerciseId: data.exerciseId,
        targetWeight: data.targetWeight,
        currentWeight,
        deadline: normalizedDeadline,
      },
    });

    return {
      success: true,
      code: "updated" as const,
      goalId: updated.id,
    };
  }

  if (activeGoals.length >= 3) {
    return {
      success: false,
      code: "goal_limit" as const,
      error: "Maksimal 3 goal aktif. Selesaikan atau tunggu salah satu selesai terlebih dahulu.",
    };
  }

  const created = await prisma.goal.create({
    data: {
      userId,
      exerciseId: data.exerciseId,
      status: "active",
      targetWeight: data.targetWeight,
      currentWeight,
      deadline: normalizedDeadline,
    },
  });

  return {
    success: true,
    code: "created" as const,
    goalId: created.id,
  };
}

export async function deleteGoal(goalId: string) {
  const userId = await getUserId();
  const normalizedGoalId = goalId.trim();

  if (!normalizedGoalId) {
    return {
      success: false,
      code: "missing_goal_id" as const,
      error: "Goal yang ingin dihapus tidak valid.",
    };
  }

  const existingGoal = await prisma.goal.findFirst({
    where: {
      id: normalizedGoalId,
      userId,
      status: "active",
    },
  });

  if (!existingGoal) {
    return {
      success: false,
      code: "not_found" as const,
      error: "Goal aktif tidak ditemukan.",
    };
  }

  await prisma.goal.delete({
    where: { id: normalizedGoalId },
  });

  return {
    success: true,
    code: "deleted" as const,
    goalId: normalizedGoalId,
  };
}
