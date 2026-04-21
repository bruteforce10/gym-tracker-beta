"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  buildExerciseSlug,
  parseExerciseIdFromSlug,
  type ExerciseCatalogItem,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";
import {
  getViewerContext,
  requireAdmin,
  requireUserId,
} from "@/lib/auth-guards";
import {
  normalizeCustomExerciseInput,
  normalizeTrainingTypeToStyle,
  validateCustomExerciseInput,
  type CustomExerciseInput,
} from "@/lib/custom-exercise";
import {
  fetchExerciseById,
  fetchExerciseCatalog,
  fetchExercisesByIds,
} from "@/lib/exercise-store";
import { deleteUploadThingFileByUrl } from "@/lib/uploadthing-server";

export async function getExerciseCatalog(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  ownership?: "all" | "mine";
  limit?: number;
}) {
  const viewer = await getViewerContext();
  return fetchExerciseCatalog({
    ...params,
    viewer,
  });
}

export async function searchExercises(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  bodyPart?: string;
  equipment?: string;
  type?: string;
  ownership?: "all" | "mine";
  limit?: number;
}) {
  const viewer = await getViewerContext();
  return fetchExerciseCatalog({
    query: params?.query,
    planBucket: params?.planBucket,
    bodyPart: params?.bodyPart,
    equipment: params?.equipment,
    type: params?.type,
    ownership: params?.ownership,
    limit: params?.limit ?? 24,
    viewer,
  });
}

export async function getExerciseBySlug(slug: string) {
  const viewer = await getViewerContext();
  const exerciseId = parseExerciseIdFromSlug(slug);
  if (!exerciseId) return null;
  return fetchExerciseById(exerciseId, viewer);
}

export async function getExerciseById(id: string) {
  const viewer = await getViewerContext();
  return fetchExerciseById(id, viewer);
}

export async function getExerciseOptionsByIds(ids: string[]) {
  const viewer = await getViewerContext();
  return fetchExercisesByIds(ids, viewer);
}

export type FavoriteAwareExerciseItem = ExerciseCatalogItem & {
  isFavorite: boolean;
};

export async function getExerciseQuickPickerData(params?: {
  query?: string;
  planBucket?: ExercisePlanBucket | "all";
  limitFavorites?: number;
  limitRecent?: number;
  limitResults?: number;
}) {
  const userId = await requireUserId();
  const viewer = await getViewerContext();
  const limitFavorites = params?.limitFavorites ?? 8;
  const limitRecent = params?.limitRecent ?? 8;
  const limitResults = params?.limitResults ?? 18;
  const planBucket = params?.planBucket ?? "all";
  const query = params?.query?.trim() ?? "";

  const favoriteRows = await prisma.favoriteExercise.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limitFavorites,
  });

  const favoriteIds = favoriteRows.map((entry) => entry.exerciseId);
  const favoriteIdSet = new Set(favoriteIds);
  const favorites = withFavoriteState(
    await fetchExercisesByIds(favoriteIds, viewer),
    favoriteIdSet
  );

  const recentWorkoutIds = collectUniqueIds(
    (
      await prisma.workout.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 12,
        include: {
          exercises: {
            where: {
              exerciseId: {
                not: null,
              },
            },
          },
        },
      })
    ).flatMap((workout) =>
      workout.exercises
        .map((exercise) => exercise.exerciseId)
        .filter(Boolean)
    ) as string[],
    limitRecent,
    favoriteIdSet
  );

  let recentIds = recentWorkoutIds;

  if (recentIds.length < limitRecent) {
    const recentPlanIds = collectUniqueIds(
      (
        await prisma.workoutPlan.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 8,
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
        })
      ).flatMap((plan) => plan.exercises.map((exercise) => exercise.exerciseId)),
      limitRecent - recentIds.length,
      new Set([...favoriteIdSet, ...recentIds])
    );

    recentIds = [...recentIds, ...recentPlanIds];
  }

  const recent = withFavoriteState(
    await fetchExercisesByIds(recentIds, viewer),
    favoriteIdSet
  );

  const excludedIds = new Set([...favoriteIds, ...recentIds]);
  const results = withFavoriteState(
    (
      await fetchExerciseCatalog({
        query,
        planBucket,
        limit: limitResults + excludedIds.size,
        viewer,
      })
    )
      .filter((exercise) => !excludedIds.has(exercise.id))
      .slice(0, limitResults),
    favoriteIdSet
  );

  return {
    favorites,
    recent,
    results,
  };
}

export async function toggleFavoriteExercise(exerciseId: string) {
  const userId = await requireUserId();
  const viewer = await getViewerContext();
  const exercise = await fetchExerciseById(exerciseId, viewer);

  if (!exercise) {
    return {
      success: false,
      error: "Exercise tidak ditemukan.",
      favorited: false,
    };
  }

  const existing = await prisma.favoriteExercise.findUnique({
    where: {
      userId_exerciseId: {
        userId,
        exerciseId,
      },
    },
  });

  if (existing) {
    await prisma.favoriteExercise.delete({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId,
        },
      },
    });
  } else {
    await prisma.favoriteExercise.create({
      data: {
        userId,
        exerciseId,
      },
    });
  }

  revalidatePath("/exercises");
  revalidatePath("/goal");
  revalidatePath("/plan");
  revalidatePath("/workout/start");
  revalidatePath("/workout/session");

  return {
    success: true,
    error: null,
    favorited: !existing,
  };
}

export async function createCustomExercise(input: CustomExerciseInput) {
  const userId = await requireUserId();
  const normalized = normalizeCustomExerciseInput(input);
  const validationError = validateCustomExerciseInput(normalized);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const recentCount = await prisma.exercise.count({
    where: {
      createdByUserId: userId,
      source: "user",
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000),
      },
    },
  });

  if (recentCount >= 5) {
    return {
      success: false,
      error: "Terlalu banyak submit dalam waktu singkat. Coba lagi sebentar lagi.",
    };
  }

  const duplicate = await prisma.exercise.findFirst({
    where: {
      createdByUserId: userId,
      source: "user",
      status: {
        not: "archived",
      },
      name: {
        equals: normalized.name,
        mode: "insensitive",
      },
      bodyParts: {
        has: normalized.bodyPart,
      },
    },
  });

  if (duplicate) {
    return {
      success: false,
      error: "Exercise serupa sudah pernah kamu buat.",
    };
  }

  const id = randomUUID();

  await prisma.exercise.create({
    data: {
      id,
      slug: buildExerciseSlug(normalized.name, id),
      name: normalized.name,
      bodyParts: [normalized.bodyPart],
      equipments: [normalized.equipment],
      gender: null,
      exerciseType: normalized.type,
      targetMuscles: normalized.targetMuscles,
      secondaryMuscles: normalized.secondaryMuscles,
      imageUrl: normalized.imageUrl,
      videoUrl: null,
      notes: normalized.notes,
      trainingStyle: normalizeTrainingTypeToStyle(normalized.type),
      source: "user",
      visibility: "private",
      status: "published",
      createdByUserId: userId,
    },
  });

  revalidatePath("/exercises");
  revalidatePath("/plan");
  revalidatePath("/goal");

  return {
    success: true,
    error: null,
  };
}

export async function getAdminCustomExercises() {
  await requireAdmin();

  return prisma.exercise.findMany({
    where: {
      source: "user",
    },
    include: {
      createdByUser: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getAdminExercises() {
  await requireAdmin();

  return prisma.exercise.findMany({
    include: {
      createdByUser: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getAdminExerciseById(id: string) {
  await requireAdmin();

  return prisma.exercise.findUnique({
    where: { id },
    include: {
      createdByUser: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });
}

type AdminExerciseUpdateInput = CustomExerciseInput & {
  visibility: "private" | "global";
  status: "published" | "flagged" | "archived";
};

export async function updateExerciseAdmin(
  id: string,
  input: AdminExerciseUpdateInput,
) {
  await requireAdmin();

  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      source: true,
      visibility: true,
      imageUrl: true,
    },
  });

  if (!existingExercise) {
    return {
      success: false,
      error: "Exercise tidak ditemukan.",
    };
  }

  const normalized = normalizeCustomExerciseInput(input);
  const validationError = validateCustomExerciseInput(normalized);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  await prisma.exercise.update({
    where: { id },
    data: {
      slug: buildExerciseSlug(normalized.name, id),
      name: normalized.name,
      bodyParts: [normalized.bodyPart],
      equipments: [normalized.equipment],
      exerciseType: normalized.type,
      targetMuscles: normalized.targetMuscles,
      secondaryMuscles: normalized.secondaryMuscles,
      imageUrl: normalized.imageUrl,
      notes: normalized.notes,
      trainingStyle: normalizeTrainingTypeToStyle(normalized.type),
      visibility:
        existingExercise.source === "system"
          ? existingExercise.visibility
          : input.visibility,
      status: input.status,
    },
  });

  if (
    existingExercise.imageUrl &&
    existingExercise.imageUrl !== normalized.imageUrl
  ) {
    await deleteUploadThingFileByUrl(existingExercise.imageUrl);
  }

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${id}/edit`);
  revalidatePath("/exercises");

  return {
    success: true,
    error: null,
    slug: buildExerciseSlug(normalized.name, id),
  };
}

export async function updateCustomExerciseByOwner(
  id: string,
  input: CustomExerciseInput,
) {
  const userId = await requireUserId();

  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      source: true,
      imageUrl: true,
      createdByUserId: true,
      status: true,
    },
  });

  if (!existingExercise) {
    return {
      success: false,
      error: "Exercise tidak ditemukan.",
    };
  }

  if (
    existingExercise.source !== "user" ||
    existingExercise.createdByUserId !== userId
  ) {
    return {
      success: false,
      error: "Kamu tidak punya akses untuk mengubah exercise ini.",
    };
  }

  if (existingExercise.status === "archived") {
    return {
      success: false,
      error: "Exercise yang sudah dihapus tidak bisa diedit lagi.",
    };
  }

  const normalized = normalizeCustomExerciseInput(input);
  const validationError = validateCustomExerciseInput(normalized);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  const duplicate = await prisma.exercise.findFirst({
    where: {
      id: {
        not: id,
      },
      createdByUserId: userId,
      source: "user",
      status: {
        not: "archived",
      },
      name: {
        equals: normalized.name,
        mode: "insensitive",
      },
      bodyParts: {
        has: normalized.bodyPart,
      },
    },
  });

  if (duplicate) {
    return {
      success: false,
      error: "Exercise serupa sudah pernah kamu buat.",
    };
  }

  const nextSlug = buildExerciseSlug(normalized.name, id);

  await prisma.exercise.update({
    where: { id },
    data: {
      slug: nextSlug,
      name: normalized.name,
      bodyParts: [normalized.bodyPart],
      equipments: [normalized.equipment],
      exerciseType: normalized.type,
      targetMuscles: normalized.targetMuscles,
      secondaryMuscles: normalized.secondaryMuscles,
      imageUrl: normalized.imageUrl,
      notes: normalized.notes,
      trainingStyle: normalizeTrainingTypeToStyle(normalized.type),
    },
  });

  if (
    existingExercise.imageUrl &&
    existingExercise.imageUrl !== normalized.imageUrl
  ) {
    await deleteUploadThingFileByUrl(existingExercise.imageUrl);
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${existingExercise.slug}`);
  revalidatePath(`/exercises/${nextSlug}`);
  revalidatePath("/goal");
  revalidatePath("/plan");
  revalidatePath("/workout/start");
  revalidatePath("/workout/session");

  return {
    success: true,
    error: null,
    slug: nextSlug,
  };
}

export async function archiveExerciseAdmin(id: string) {
  await requireAdmin();

  await prisma.exercise.update({
    where: { id },
    data: {
      status: "archived",
    },
  });

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${id}/edit`);
  revalidatePath("/exercises");

  return {
    success: true,
  };
}

export async function deleteCustomExerciseAdmin(id: string) {
  await requireAdmin();

  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      source: true,
      imageUrl: true,
    },
  });

  if (!existingExercise) {
    return {
      success: false,
      error: "Exercise tidak ditemukan.",
    };
  }

  if (existingExercise.source !== "user") {
    return {
      success: false,
      error: "Hanya custom exercise yang bisa dihapus permanen.",
    };
  }

  const [goalCount, workoutLogCount, planCount] = await Promise.all([
    prisma.goal.count({
      where: {
        exerciseId: id,
      },
    }),
    prisma.exerciseLog.count({
      where: {
        exerciseId: id,
      },
    }),
    prisma.workoutPlanExercise.count({
      where: {
        exerciseId: id,
      },
    }),
  ]);

  if (goalCount > 0 || workoutLogCount > 0 || planCount > 0) {
    const usageLabels = [
      goalCount > 0 ? `${goalCount} goal` : null,
      planCount > 0 ? `${planCount} plan item` : null,
      workoutLogCount > 0 ? `${workoutLogCount} workout log` : null,
    ].filter(Boolean);

    return {
      success: false,
      error: `Exercise ini masih dipakai di ${usageLabels.join(", ")}. Archive saja kalau ingin menyembunyikannya.`,
    };
  }

  await prisma.exercise.delete({
    where: { id },
  });

  if (existingExercise?.imageUrl) {
    await deleteUploadThingFileByUrl(existingExercise.imageUrl);
  }

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${id}/edit`);
  revalidatePath("/exercises");

  return {
    success: true,
    error: null,
  };
}

export async function promoteCustomExerciseAdmin(id: string) {
  await requireAdmin();

  await prisma.exercise.update({
    where: { id },
    data: {
      visibility: "global",
      status: "published",
    },
  });

  revalidatePath("/admin/exercises");
  revalidatePath("/exercises");

  return {
    success: true,
  };
}

export async function archiveCustomExerciseByOwner(id: string) {
  const userId = await requireUserId();

  const existingExercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      slug: true,
      source: true,
      createdByUserId: true,
      status: true,
    },
  });

  if (!existingExercise) {
    return {
      success: false,
      error: "Exercise tidak ditemukan.",
    };
  }

  if (
    existingExercise.source !== "user" ||
    existingExercise.createdByUserId !== userId
  ) {
    return {
      success: false,
      error: "Kamu tidak punya akses untuk menghapus exercise ini.",
    };
  }

  if (existingExercise.status === "archived") {
    return {
      success: true,
      error: null,
    };
  }

  await prisma.exercise.update({
    where: { id },
    data: {
      status: "archived",
    },
  });

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${existingExercise.slug}`);
  revalidatePath("/goal");
  revalidatePath("/plan");
  revalidatePath("/workout/start");
  revalidatePath("/workout/session");

  return {
    success: true,
    error: null,
  };
}

function collectUniqueIds(
  ids: string[],
  limit: number,
  excludedIds: Set<string> = new Set()
) {
  const collected: string[] = [];
  const seen = new Set(excludedIds);

  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    collected.push(id);
    seen.add(id);

    if (collected.length >= limit) break;
  }

  return collected;
}

function withFavoriteState(
  items: ExerciseCatalogItem[],
  favoriteIds: Set<string>
): FavoriteAwareExerciseItem[] {
  return items.map((item) => ({
    ...item,
    isFavorite: favoriteIds.has(item.id),
  }));
}
