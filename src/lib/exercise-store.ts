import "server-only";

import { prisma } from "@/lib/prisma";
import {
  serializeExercise,
  sortExercisesByPriority,
  type ExerciseCatalogItem,
  type ExercisePlanBucket,
  type ExerciseTrainingStyle,
} from "@/lib/exercise-catalog";

type FetchCatalogParams = {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  limit?: number;
};

type StoredExerciseRecord = {
  id: string;
  slug: string;
  name: string;
  bodyParts: string[];
  equipments: string[];
  gender: string | null;
  exerciseType: string | null;
  targetMuscles: string[];
  secondaryMuscles: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  trainingStyle: string;
};

function normalizeTrainingStyle(value: string): ExerciseTrainingStyle {
  return value === "compound" ? "compound" : "isolation";
}

function serializeStoredExercise(record: StoredExerciseRecord): ExerciseCatalogItem {
  return serializeExercise({
    id: record.id,
    externalId: record.id,
    slug: record.slug,
    name: record.name,
    bodyParts: record.bodyParts,
    equipments: record.equipments,
    gender: record.gender,
    exerciseType: record.exerciseType,
    targetMuscles: record.targetMuscles,
    secondaryMuscles: record.secondaryMuscles,
    imageUrl: record.imageUrl,
    videoUrl: record.videoUrl,
    trainingStyle: normalizeTrainingStyle(record.trainingStyle),
  });
}

function filterByPlanBucket(
  items: ExerciseCatalogItem[],
  planBucket: ExercisePlanBucket | "all" = "all"
) {
  if (planBucket === "all") return items;
  return items.filter((item) => item.planBucket === planBucket);
}

export async function fetchExerciseById(externalId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: externalId },
  });

  return exercise ? serializeStoredExercise(exercise) : null;
}

export async function fetchExercisesByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const exercises = await prisma.exercise.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
    },
  });

  const map = new Map(exercises.map((exercise) => [exercise.id, serializeStoredExercise(exercise)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as ExerciseCatalogItem[];
}

export async function fetchExerciseCatalog(params?: FetchCatalogParams) {
  const query = params?.query?.trim() ?? "";
  const bodyPart = params?.bodyPart?.trim() ?? "";
  const equipment = params?.equipment?.trim() ?? "";
  const type = params?.type?.trim().toLowerCase() ?? "";
  const planBucket = params?.planBucket ?? "all";
  const requestedLimit = params?.limit ?? 24;

  const exercises = await prisma.exercise.findMany({
    where: {
      ...(query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : {}),
      ...(bodyPart
        ? {
            bodyParts: {
              has: bodyPart,
            },
          }
        : {}),
      ...(equipment
        ? {
            equipments: {
              has: equipment,
            },
          }
        : {}),
      ...(type
        ? {
            trainingStyle: type,
          }
        : {}),
    },
  });

  const serialized = sortExercisesByPriority(exercises.map(serializeStoredExercise));
  return filterByPlanBucket(serialized, planBucket).slice(0, requestedLimit);
}
