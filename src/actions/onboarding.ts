"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { Prisma } from "@/generated/client/client";
import {
  getDefaultAnswersFromProfile,
  getUserFitnessProfile,
  parseDraftPlanPayload,
} from "@/lib/fitness-profile";
import { generateOnboardingDraft } from "@/lib/plan-generator";
import { parseOnboardingAnswers } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function getOnboardingPageData() {
  const userId = await getUserId();
  const profile = await getUserFitnessProfile(userId);

  return {
    defaultAnswers: getDefaultAnswersFromProfile(profile),
    hasDraft: profile?.planStatus === "draft_generated",
  };
}

export async function saveOnboardingDraft(
  rawAnswers: Record<string, unknown>
) {
  try {
    const userId = await getUserId();
    const answers = parseOnboardingAnswers(rawAnswers);
    const draft = await generateOnboardingDraft(answers);

    await prisma.userFitnessProfile.upsert({
      where: { userId },
      update: {
        primaryGoal: answers.primaryGoal,
        secondaryGoal: answers.secondaryGoal,
        experienceLevel: answers.experienceLevel,
        trainingDaysPerWeek: answers.trainingDaysPerWeek,
        loadLevel: answers.loadLevel,
        gender: answers.gender,
        equipmentAccess: answers.equipmentAccess,
        planStatus: "draft_generated",
        draftPlanPayload: draft,
        planVersion: draft.version,
        onboardingCompletedAt: new Date(),
      },
      create: {
        userId,
        primaryGoal: answers.primaryGoal,
        secondaryGoal: answers.secondaryGoal,
        experienceLevel: answers.experienceLevel,
        trainingDaysPerWeek: answers.trainingDaysPerWeek,
        loadLevel: answers.loadLevel,
        gender: answers.gender,
        equipmentAccess: answers.equipmentAccess,
        planStatus: "draft_generated",
        draftPlanPayload: draft,
        planVersion: draft.version,
        onboardingCompletedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    revalidatePath("/onboarding/review");
    revalidatePath("/dashboard");
    revalidatePath("/plan");

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Gagal membuat draft plan. Coba lagi.",
    };
  }
}

export async function getOnboardingReviewData() {
  const userId = await getUserId();
  const profile = await getUserFitnessProfile(userId);
  const draft = parseDraftPlanPayload(profile?.draftPlanPayload);

  return {
    profile,
    draft,
  };
}

export async function activateOnboardingDraft() {
  try {
    const userId = await getUserId();
    const profile = await prisma.userFitnessProfile.findUnique({
      where: { userId },
    });

    const draft = parseDraftPlanPayload(profile?.draftPlanPayload);
    if (!profile || !draft) {
      return {
        success: false as const,
        error: "Draft plan belum tersedia.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.workoutPlanExercise.deleteMany({
        where: {
          plan: {
            userId,
          },
        },
      });

      await tx.workoutPlan.deleteMany({
        where: { userId },
      });

      await tx.goal.deleteMany({
        where: {
          userId,
          status: "active",
        },
      });

      for (const plan of draft.plans) {
        await tx.workoutPlan.create({
          data: {
            userId,
            name: plan.name,
            type: plan.type,
            exercises: {
              create: plan.exercises.map((exercise, index) => ({
                exerciseId: exercise.exerciseId,
                defaultSets: exercise.defaultSets,
                defaultReps: exercise.defaultReps,
                restTime: exercise.restTime,
                supersetWithNext: false,
                order: index,
              })),
            },
          },
        });
      }

      await tx.goal.create({
        data: {
          userId,
          exerciseId: draft.goal.exerciseId,
          status: "active",
          targetWeight: draft.goal.targetWeight,
          currentWeight: draft.goal.currentWeight,
          deadline: new Date(draft.goal.deadline),
        },
      });

      await tx.userFitnessProfile.update({
        where: { userId },
        data: {
          planStatus: "active",
          draftPlanPayload: Prisma.JsonNull,
          planVersion: draft.version,
          onboardingCompletedAt: new Date(),
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/plan");
    revalidatePath("/goal");
    revalidatePath("/onboarding");
    revalidatePath("/onboarding/review");

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengaktifkan plan. Coba lagi.",
    };
  }
}
