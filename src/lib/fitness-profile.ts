import "server-only";

import { prisma } from "@/lib/prisma";
import {
  type GeneratedOnboardingDraft,
  type OnboardingAnswers,
  type OnboardingGateStatus,
} from "@/lib/onboarding";

type StoredFitnessProfile = Awaited<
  ReturnType<typeof prisma.userFitnessProfile.findUnique>
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDraftPlanPayload(
  value: unknown
): GeneratedOnboardingDraft | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.plans) || !isRecord(value.goal) || !isRecord(value.answers)) {
    return null;
  }
  return value as unknown as GeneratedOnboardingDraft;
}

export function parseStoredAnswers(value: unknown): OnboardingAnswers | null {
  if (!isRecord(value)) return null;
  const answers = value as Partial<OnboardingAnswers>;
  if (
    typeof answers.primaryGoal !== "string" ||
    typeof answers.trainingDaysPerWeek !== "number" ||
    typeof answers.experienceLevel !== "string" ||
    typeof answers.loadLevel !== "string" ||
    typeof answers.equipmentAccess !== "string" ||
    typeof answers.gender !== "string"
  ) {
    return null;
  }
  return answers as OnboardingAnswers;
}

export async function getUserFitnessProfile(userId: string) {
  return prisma.userFitnessProfile.findUnique({
    where: { userId },
  });
}

export async function hasLegacyWorkoutSetup(userId: string) {
  const [planCount, goalCount, workoutCount, weightLogCount] = await prisma.$transaction([
    prisma.workoutPlan.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.workout.count({ where: { userId } }),
    prisma.weightLog.count({ where: { userId } }),
  ]);

  return planCount + goalCount + workoutCount + weightLogCount > 0;
}

export async function getUserOnboardingGate(
  userId: string
): Promise<OnboardingGateStatus> {
  const profile = await getUserFitnessProfile(userId);
  if (profile?.planStatus === "draft_generated") return "draft_generated";
  if (profile?.planStatus === "active") return "active";
  if (profile) return "needs_onboarding";

  const hasLegacySetup = await hasLegacyWorkoutSetup(userId);
  return hasLegacySetup ? "legacy_active" : "needs_onboarding";
}

export function getDefaultAnswersFromProfile(profile: StoredFitnessProfile) {
  if (!profile) return null;

  const draft = parseDraftPlanPayload(profile.draftPlanPayload);
  if (draft?.answers) return draft.answers;
  return null;
}
