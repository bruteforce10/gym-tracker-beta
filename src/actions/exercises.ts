"use server";

import {
  parseExerciseIdFromSlug,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";
import {
  fetchExerciseById,
  fetchExerciseCatalog,
  fetchExercisesByIds,
} from "@/lib/gymfit";

export async function getExerciseCatalog(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  limit?: number;
}) {
  return fetchExerciseCatalog(params);
}

export async function searchExercises(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  limit?: number;
}) {
  return fetchExerciseCatalog({
    query: params?.query,
    planBucket: params?.planBucket,
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
