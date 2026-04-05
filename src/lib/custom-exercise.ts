import "server-only";

import {
  BODY_PART_FILTER_OPTIONS,
  EQUIPMENT_FILTER_OPTIONS,
  TRAINING_TYPE_FILTER_OPTIONS,
  normalizeExerciseFilterValue,
} from "@/lib/exercise-filters";

export type CustomExerciseInput = {
  name: string;
  bodyPart: string;
  equipment: string;
  type: string;
  targetMuscles: string;
  secondaryMuscles: string;
  imageUrl?: string;
  notes?: string;
};

export function normalizeCustomExerciseInput(input: CustomExerciseInput) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const bodyPart = normalizeExerciseFilterValue(
    input.bodyPart,
    BODY_PART_FILTER_OPTIONS,
  );
  const equipment = normalizeExerciseFilterValue(
    input.equipment,
    EQUIPMENT_FILTER_OPTIONS,
  );
  const type = normalizeExerciseFilterValue(
    input.type,
    TRAINING_TYPE_FILTER_OPTIONS,
  );
  const imageUrl = normalizeOptionalUrl(input.imageUrl);
  const notes = input.notes?.trim() ? input.notes.trim().slice(0, 600) : null;

  return {
    name,
    bodyPart,
    equipment,
    type,
    targetMuscles: normalizeStringList(input.targetMuscles),
    secondaryMuscles: normalizeStringList(input.secondaryMuscles),
    imageUrl,
    notes,
  };
}

export function validateCustomExerciseInput(
  input: ReturnType<typeof normalizeCustomExerciseInput>,
) {
  if (!input.name || input.name.length < 3) {
    return "Nama exercise minimal 3 karakter.";
  }

  if (input.name.length > 80) {
    return "Nama exercise terlalu panjang.";
  }

  if (!input.bodyPart) {
    return "Body part wajib dipilih.";
  }

  if (!input.equipment) {
    return "Equipment wajib dipilih.";
  }

  if (!input.type) {
    return "Type latihan wajib dipilih.";
  }

  if (input.targetMuscles.length === 0) {
    return "Target muscle minimal satu.";
  }

  if (input.targetMuscles.length > 6 || input.secondaryMuscles.length > 8) {
    return "Terlalu banyak muscle tag untuk satu exercise.";
  }

  return null;
}

export function normalizeTrainingTypeToStyle(value: string) {
  return value.toLowerCase() === "compound" ? "compound" : "isolation";
}

function normalizeStringList(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) =>
          item
            .split(/\s+/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(" "),
        ),
    ),
  ).slice(0, 8);
}

function normalizeOptionalUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
