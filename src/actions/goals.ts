"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  return goal;
}

export async function upsertGoal(data: {
  exercise: string;
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

  if (existing) {
    // Update existing
    const updated = await prisma.goal.update({
      where: { id: existing.id },
      data: {
        exercise: data.exercise,
        targetWeight: data.targetWeight,
        currentWeight: data.currentWeight ?? existing.currentWeight,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
    return updated;
  } else {
    // Create new
    const created = await prisma.goal.create({
      data: {
        userId,
        exercise: data.exercise,
        targetWeight: data.targetWeight,
        currentWeight: data.currentWeight ?? 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
    return created;
  }
}
