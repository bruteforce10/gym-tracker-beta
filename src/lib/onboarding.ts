import { parseDateInputValue } from "@/lib/date";

export type PrimaryGoal =
  | "muscle_gain"
  | "strength"
  | "fat_loss"
  | "general_fitness";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type LoadLevel = "very_light" | "light" | "moderate" | "heavy";
export type EquipmentAccess =
  | "full_gym"
  | "limited_gym"
  | "home_gym"
  | "bodyweight";
export type GenderPreference = "male" | "female" | "prefer_not_to_say";

export type OnboardingAnswers = {
  goalExerciseId: string;
  goalTargetWeight: number;
  goalDeadline: string;
  primaryGoal: PrimaryGoal;
  secondaryGoal: PrimaryGoal | null;
  trainingDaysPerWeek: number;
  experienceLevel: ExperienceLevel;
  loadLevel: LoadLevel;
  equipmentAccess: EquipmentAccess;
  gender: GenderPreference;
};

export type DraftPlanExercise = {
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  primaryLabel: string;
  trainingStyle: "compound" | "isolation";
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  rationale: string;
};

export type DraftWorkoutPlan = {
  name: string;
  type: string;
  description: string;
  focusLabel: string;
  exercises: DraftPlanExercise[];
};

export type DraftGoal = {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  currentWeight: number;
  deadline: string;
  rationale: string;
};

export type GeneratedOnboardingDraft = {
  version: number;
  generatedAt: string;
  templateKey: string;
  recommendationSummary: string;
  rationale: string[];
  answers: OnboardingAnswers;
  plans: DraftWorkoutPlan[];
  goal: DraftGoal;
};

export type OnboardingGateStatus =
  | "needs_onboarding"
  | "draft_generated"
  | "active"
  | "legacy_active";

export const ONBOARDING_PLAN_VERSION = 1;

export const GOAL_OPTIONS: Array<{
  value: PrimaryGoal;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "muscle_gain",
    label: "Muscle Gain",
    shortLabel: "Massa Otot",
    description: "Tambah volume latihan untuk membangun otot lebih cepat.",
  },
  {
    value: "strength",
    label: "Strength",
    shortLabel: "Kekuatan",
    description: "Fokus pada compound lift dan progres beban yang stabil.",
  },
  {
    value: "fat_loss",
    label: "Fat Loss",
    shortLabel: "Fat Loss",
    description: "Program lebih padat supaya latihan efisien dan konsisten.",
  },
  {
    value: "general_fitness",
    label: "General Fitness",
    shortLabel: "Kebugaran",
    description: "Latihan seimbang untuk stamina, kekuatan, dan rutinitas.",
  },
];

export const EXPERIENCE_OPTIONS: Array<{
  value: ExperienceLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Baru mulai atau masih butuh latihan yang lebih sederhana.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Sudah cukup rutin dan siap volume yang lebih serius.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Sudah nyaman dengan split padat dan variasi yang tinggi.",
  },
];

export const LOAD_LEVEL_OPTIONS: Array<{
  value: LoadLevel;
  label: string;
  description: string;
}> = [
  {
    value: "very_light",
    label: "Sangat Ringan",
    description: "Masih adaptasi, gerakan dasar terasa cukup menantang.",
  },
  {
    value: "light",
    label: "Ringan",
    description: "Sudah bisa latihan stabil, tapi beban belum terlalu tinggi.",
  },
  {
    value: "moderate",
    label: "Sedang",
    description: "Cukup nyaman memakai beban kerja reguler.",
  },
  {
    value: "heavy",
    label: "Berat",
    description: "Sudah terbiasa mendorong beban besar secara konsisten.",
  },
];

export const EQUIPMENT_OPTIONS: Array<{
  value: EquipmentAccess;
  label: string;
  description: string;
}> = [
  {
    value: "full_gym",
    label: "Gym Lengkap",
    description: "Akses machine, barbell, dumbbell, cable, dan bench.",
  },
  {
    value: "limited_gym",
    label: "Gym Terbatas",
    description: "Ada beberapa alat utama, tapi tidak selalu lengkap.",
  },
  {
    value: "home_gym",
    label: "Home Gym",
    description: "Latihan di rumah dengan alat yang lebih terbatas.",
  },
  {
    value: "bodyweight",
    label: "Bodyweight",
    description: "Mayoritas latihan tanpa alat atau dengan setup minimal.",
  },
];

export const GENDER_OPTIONS: Array<{
  value: GenderPreference;
  label: string;
}> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const TRAINING_DAY_OPTIONS = [2, 3, 4, 5, 6];

export function getGoalMeta(value: PrimaryGoal) {
  return GOAL_OPTIONS.find((option) => option.value === value) ?? GOAL_OPTIONS[0];
}

export function getExperienceMeta(value: ExperienceLevel) {
  return (
    EXPERIENCE_OPTIONS.find((option) => option.value === value) ??
    EXPERIENCE_OPTIONS[0]
  );
}

export function getLoadLevelMeta(value: LoadLevel) {
  return (
    LOAD_LEVEL_OPTIONS.find((option) => option.value === value) ??
    LOAD_LEVEL_OPTIONS[0]
  );
}

export function getEquipmentMeta(value: EquipmentAccess) {
  return (
    EQUIPMENT_OPTIONS.find((option) => option.value === value) ??
    EQUIPMENT_OPTIONS[0]
  );
}

export function getGenderMeta(value: GenderPreference) {
  return GENDER_OPTIONS.find((option) => option.value === value) ?? GENDER_OPTIONS[0];
}

export function isPrimaryGoal(value: string): value is PrimaryGoal {
  return GOAL_OPTIONS.some((option) => option.value === value);
}

export function isExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_OPTIONS.some((option) => option.value === value);
}

export function isLoadLevel(value: string): value is LoadLevel {
  return LOAD_LEVEL_OPTIONS.some((option) => option.value === value);
}

export function isEquipmentAccess(value: string): value is EquipmentAccess {
  return EQUIPMENT_OPTIONS.some((option) => option.value === value);
}

export function isGenderPreference(value: string): value is GenderPreference {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

export function parseOnboardingAnswers(raw: Record<string, unknown>): OnboardingAnswers {
  const goalExerciseId = String(raw.goalExerciseId ?? "").trim();
  const goalTargetWeight = Number(raw.goalTargetWeight ?? 0);
  const goalDeadline = String(raw.goalDeadline ?? "").trim();
  const primaryGoal = String(raw.primaryGoal ?? "");
  const secondaryGoalValue = String(raw.secondaryGoal ?? "");
  const trainingDaysPerWeek = Number(raw.trainingDaysPerWeek ?? 0);
  const experienceLevel = String(raw.experienceLevel ?? "");
  const loadLevel = String(raw.loadLevel ?? "");
  const equipmentAccess = String(raw.equipmentAccess ?? "");
  const gender = String(raw.gender ?? "");

  if (!goalExerciseId) {
    throw new Error("Pilih exercise goal terlebih dahulu.");
  }

  if (!Number.isFinite(goalTargetWeight) || goalTargetWeight <= 0) {
    throw new Error("Target weight goal harus lebih besar dari 0.");
  }

  if (!parseDateInputValue(goalDeadline)) {
    throw new Error("Deadline goal belum valid.");
  }

  if (!isPrimaryGoal(primaryGoal)) {
    throw new Error("Primary goal tidak valid.");
  }

  const secondaryGoal =
    secondaryGoalValue && secondaryGoalValue !== "none" ? secondaryGoalValue : null;

  if (secondaryGoal !== null && !isPrimaryGoal(secondaryGoal)) {
    throw new Error("Secondary goal tidak valid.");
  }

  if (secondaryGoal !== null && secondaryGoal === primaryGoal) {
    throw new Error("Secondary goal harus berbeda dari primary goal.");
  }

  if (!Number.isInteger(trainingDaysPerWeek) || trainingDaysPerWeek < 2 || trainingDaysPerWeek > 6) {
    throw new Error("Jumlah hari latihan harus antara 2 sampai 6.");
  }

  if (!isExperienceLevel(experienceLevel)) {
    throw new Error("Experience level tidak valid.");
  }

  if (!isLoadLevel(loadLevel)) {
    throw new Error("Load level tidak valid.");
  }

  if (!isEquipmentAccess(equipmentAccess)) {
    throw new Error("Pilihan equipment tidak valid.");
  }

  if (!isGenderPreference(gender)) {
    throw new Error("Gender tidak valid.");
  }

  return {
    goalExerciseId,
    goalTargetWeight,
    goalDeadline,
    primaryGoal,
    secondaryGoal,
    trainingDaysPerWeek,
    experienceLevel,
    loadLevel,
    equipmentAccess,
    gender,
  };
}
