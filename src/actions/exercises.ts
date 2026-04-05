"use server";

import {
  parseExerciseIdFromSlug,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";
import {
  fetchExerciseById,
  fetchExerciseCatalog,
  fetchExercisesByIds,
} from "@/lib/exercise-store";

export async function getExerciseCatalog(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  limit?: number;
}) {
  return fetchExerciseCatalog(params);
}

export async function searchExercises(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  limit?: number;
}) {
  return fetchExerciseCatalog({
    query: params?.query,
    planBucket: params?.planBucket,
    bodyPart: params?.bodyPart,
    equipment: params?.equipment,
    type: params?.type,
    limit: params?.limit ?? 24,
  });
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
