"use server";

import {
  parseExerciseIdFromSlug,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";
import {
  fetchExerciseById,
  fetchExerciseCatalog,
  fetchExercisesByIds,
  getGymFitQuotaExceededMessage,
  isGymFitQuotaExceededError,
} from "@/lib/gymfit";

export async function getExerciseCatalog(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  limit?: number;
}) {
  try {
    return {
      exercises: await fetchExerciseCatalog(params),
      providerWarning: null as string | null,
    };
  } catch (error) {
    if (isGymFitQuotaExceededError(error)) {
      return {
        exercises: [],
        providerWarning: getGymFitQuotaExceededMessage(),
      };
    }

    throw error;
  }
}

export async function searchExercises(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  limit?: number;
}) {
  try {
    return await fetchExerciseCatalog({
      query: params?.query,
      planBucket: params?.planBucket,
      bodyPart: params?.bodyPart,
      equipment: params?.equipment,
      type: params?.type,
      limit: params?.limit ?? 24,
    });
  } catch (error) {
    if (isGymFitQuotaExceededError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getExerciseBySlug(slug: string) {
  const exerciseId = parseExerciseIdFromSlug(slug);
  if (!exerciseId) return null;
  return fetchExerciseById(exerciseId);
}

export async function getExerciseById(id: string) {
  return fetchExerciseById(id);
}

export async function getExerciseOptionsByIds(ids: string[]) {
  return fetchExercisesByIds(ids);
}
