export const BODY_PART_FILTER_OPTIONS = [
  "Arms",
  "Back",
  "Chest",
  "Core",
  "Legs",
  "Shoulders",
] as const;

export const EQUIPMENT_FILTER_OPTIONS = [
  "Barbell",
  "Bodyweight",
  "Cable",
  "Dumbbell",
  "Machine",
  "Stepper",
] as const;

export const TRAINING_TYPE_FILTER_OPTIONS = [
  "Compound",
  "Isolation",
] as const;

export function normalizeExerciseFilterValue(
  value: string | undefined,
  options: readonly string[],
) {
  if (!value) return "";
  return options.includes(value) ? value : "";
}
