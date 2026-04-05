"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  buildExerciseSlug,
  parseExerciseIdFromSlug,
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
  limit?: number;
}) {
  const viewer = await getViewerContext();
  return fetchExerciseCatalog({
    query: params?.query,
    planBucket: params?.planBucket,
    bodyPart: params?.bodyPart,
    equipment: params?.equipment,
    type: params?.type,
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
