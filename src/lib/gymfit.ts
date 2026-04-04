import "server-only";

import { cache } from "react";

import {
  buildExerciseSlug,
  serializeExercise,
  sortExercisesByPriority,
  type ExerciseCatalogItem,
  type ExercisePlanBucket,
  type ExerciseTrainingStyle,
} from "@/lib/exercise-catalog";

type GymFitSearchResult = {
  id?: string;
  name?: string;
  bodyPart?: string;
  image?: string;
};

type GymFitSearchResponse = {
  results?: GymFitSearchResult[];
  total?: number;
  count?: number;
};

type GymFitMuscle = {
  id?: string;
  name?: string;
  bodyPart?: string;
  group?: string | null;
};

type GymFitDetailResponse = {
  id?: string;
  name?: string;
  bodyPart?: string;
  equipment?: string;
  type?: string;
  image?: string;
  targetMuscles?: GymFitMuscle[];
  secondaryMuscles?: GymFitMuscle[];
};

type FetchCatalogParams = {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  limit?: number;
};

const DEFAULT_API_BASE_URL = "https://gym-fit.p.rapidapi.com";

function getGymFitBaseUrl() {
  return (process.env.GYMFIT_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function getGymFitHeaders() {
  const rawHeaders = process.env.GYMFIT_API_HEADERS;
  if (!rawHeaders) return undefined;
  return JSON.parse(rawHeaders) as Record<string, string>;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeTrainingStyle(value: string | null): ExerciseTrainingStyle | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "compound" || normalized === "isolation") {
    return normalized;
  }
  return null;
}

function muscleNames(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return asString((item as GymFitMuscle).name);
    })
    .filter(Boolean) as string[];
}

async function requestGymFit(pathname: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${getGymFitBaseUrl()}${pathname}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getGymFitHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gym Fit request failed: ${response.status} ${response.statusText} - ${details}`);
  }

  return response.json();
}

function normalizeGymFitExercise(
  record: unknown,
  fallbackId?: string,
  fallbackTrainingStyle?: ExerciseTrainingStyle | null
): ExerciseCatalogItem | null {
  if (!record || typeof record !== "object") return null;

  const exercise = record as GymFitDetailResponse;
  const externalId = asString(exercise.id) ?? fallbackId ?? null;
  const name = asString(exercise.name);

  if (!externalId || !name) return null;

  return serializeExercise({
    id: externalId,
    externalId,
    slug: buildExerciseSlug(name, externalId),
    name,
    bodyParts: asString(exercise.bodyPart) ?? [],
    equipments: asString(exercise.equipment) ?? [],
    gender: null,
    exerciseType: null,
    targetMuscles: muscleNames(exercise.targetMuscles),
    secondaryMuscles: muscleNames(exercise.secondaryMuscles),
    imageUrl: asString(exercise.image),
    videoUrl: null,
    trainingStyle: fallbackTrainingStyle ?? normalizeTrainingStyle(asString(exercise.type)),
  });
}

function filterByPlanBucket(
  items: ExerciseCatalogItem[],
  planBucket: ExercisePlanBucket | "all" = "all"
) {
  if (planBucket === "all") return items;
  return items.filter((item) => item.planBucket === planBucket);
}

const fetchExerciseByIdCached = cache(async (externalId: string) => {
  const payload = (await requestGymFit(
    `/v1/exercises/${encodeURIComponent(externalId)}`
  )) as GymFitDetailResponse;

  return normalizeGymFitExercise(payload, externalId);
});

export async function fetchExerciseById(externalId: string) {
  return fetchExerciseByIdCached(externalId);
}

export async function fetchExerciseCatalog(params?: FetchCatalogParams) {
  const query = params?.query?.trim() ?? "";
  const planBucket = params?.planBucket ?? "all";
  const requestedLimit = params?.limit ?? 24;
  const pageSize = Math.min(Math.max(requestedLimit, 25), 100);
  const collected = new Map<string, ExerciseCatalogItem>();
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (collected.size < requestedLimit && offset < total) {
    const payload = (await requestGymFit("/v1/exercises/search", {
      query: query || undefined,
      limit: pageSize,
      offset,
    })) as GymFitSearchResponse;

    const results = Array.isArray(payload.results) ? payload.results : [];
    total = typeof payload.total === "number" ? payload.total : results.length;

    const normalizedItems = results
      .map((item) =>
        normalizeGymFitExercise(item, asString(item.id) ?? undefined, null)
      )
      .filter(Boolean) as ExerciseCatalogItem[];

    for (const item of normalizedItems) {
      collected.set(item.id, item);
    }

    if (results.length === 0) break;
    offset += results.length;
  }

  const normalized = sortExercisesByPriority(Array.from(collected.values()));
  return filterByPlanBucket(normalized, planBucket).slice(0, requestedLimit);
}

export async function fetchExercisesByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const exercises = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await fetchExerciseById(id);
      } catch {
        return null;
      }
    })
  );

  const map = new Map(
    exercises.filter(Boolean).map((exercise) => [exercise!.id, exercise!])
  );

  return ids.map((id) => map.get(id)).filter(Boolean) as ExerciseCatalogItem[];
}
