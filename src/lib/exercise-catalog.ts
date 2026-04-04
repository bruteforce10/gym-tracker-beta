export type ExerciseDisplayCategory =
  | "chest"
  | "back"
  | "shoulder"
  | "arms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export type ExercisePlanBucket = "upper" | "lower";
export type ExerciseTrainingStyle = "compound" | "isolation";

export const CATEGORY_LABELS: Record<ExerciseDisplayCategory, string> = {
  chest: "Chest",
  back: "Back",
  shoulder: "Shoulder",
  arms: "Arms",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
};

export const CATEGORY_GRADIENTS: Record<ExerciseDisplayCategory, string> = {
  chest: "from-rose-500/30 to-orange-500/20",
  back: "from-blue-500/30 to-cyan-500/20",
  shoulder: "from-violet-500/30 to-fuchsia-500/20",
  arms: "from-amber-500/30 to-yellow-500/20",
  quads: "from-emerald-500/30 to-teal-500/20",
  hamstrings: "from-sky-500/30 to-indigo-500/20",
  glutes: "from-pink-500/30 to-fuchsia-500/20",
  calves: "from-lime-500/30 to-green-500/20",
};

export const UPPER_CATEGORIES: ExerciseDisplayCategory[] = [
  "chest",
  "back",
  "shoulder",
  "arms",
];

export const LOWER_CATEGORIES: ExerciseDisplayCategory[] = [
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

export interface ExerciseCatalogItem {
  id: string;
  externalId: string;
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
  category: ExerciseDisplayCategory | null;
  planBucket: ExercisePlanBucket | null;
  trainingStyle: ExerciseTrainingStyle;
  defaultSets: number;
  defaultReps: number;
  defaultRestTime: number;
  primaryLabel: string;
}

interface ExerciseCatalogRecord {
  id: string;
  externalId: string;
  slug: string;
  name: string;
  bodyParts: unknown;
  equipments: unknown;
  gender: string | null;
  exerciseType: string | null;
  targetMuscles: unknown;
  secondaryMuscles: unknown;
  imageUrl: string | null;
  videoUrl: string | null;
  trainingStyle?: ExerciseTrainingStyle | null;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function titleCaseToken(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function isJsonStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseStringArray(value: unknown): string[] {
  if (isJsonStringArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return [value.trim()].filter(Boolean);
  }

  return [];
}

export function buildExerciseSlug(name: string, externalId: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "exercise";

  return `${baseSlug}--${externalId}`;
}

export function parseExerciseIdFromSlug(slug: string): string | null {
  const parts = slug.split("--");
  const externalId = parts.at(-1)?.trim();
  return externalId || null;
}

export function resolveExerciseMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const baseUrl =
    process.env.NEXT_PUBLIC_GYMFIT_MEDIA_BASE_URL ??
    process.env.GYMFIT_MEDIA_BASE_URL;

  if (!baseUrl) return null;

  return `${baseUrl.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function hasAnyToken(tokens: string[], candidates: string[]): boolean {
  return candidates.some((candidate) => tokens.some((token) => token.includes(candidate)));
}

function deriveExerciseCategory(parts: string[], muscles: string[]): ExerciseDisplayCategory | null {
  const normalizedParts = parts.map(normalizeToken);
  const normalizedMuscles = muscles.map(normalizeToken);
  const tokens = [...normalizedParts, ...normalizedMuscles];

  if (hasAnyToken(tokens, ["chest", "pectoral"])) return "chest";
  if (hasAnyToken(tokens, ["upper back", "back", "lat", "rhomboid", "trap"])) return "back";
  if (hasAnyToken(tokens, ["shoulder", "deltoid"])) return "shoulder";
  if (hasAnyToken(tokens, ["upper arm", "lower arm", "bicep", "tricep", "forearm"])) return "arms";
  if (hasAnyToken(tokens, ["quadricep", "quad"])) return "quads";
  if (hasAnyToken(tokens, ["hamstring"])) return "hamstrings";
  if (hasAnyToken(tokens, ["glute"])) return "glutes";
  if (hasAnyToken(tokens, ["calf", "gastrocnemius", "soleus", "lower leg"])) return "calves";

  return null;
}

function derivePlanBucket(category: ExerciseDisplayCategory | null): ExercisePlanBucket | null {
  if (!category) return null;
  if (UPPER_CATEGORIES.includes(category)) return "upper";
  if (LOWER_CATEGORIES.includes(category)) return "lower";
  return null;
}

function deriveTrainingStyle(name: string, exerciseType: string | null): ExerciseTrainingStyle {
  const normalizedName = normalizeToken(name);
  const normalizedType = normalizeToken(exerciseType ?? "");

  const compoundHints = [
    "press",
    "row",
    "deadlift",
    "squat",
    "pull up",
    "pull-up",
    "pulldown",
    "dip",
    "lunge",
    "thrust",
    "clean",
    "snatch",
    "shrug",
  ];

  if (compoundHints.some((hint) => normalizedName.includes(hint))) {
    return "compound";
  }

  if (normalizedType.includes("strength")) {
    return normalizedName.includes("raise") ||
      normalizedName.includes("curl") ||
      normalizedName.includes("extension") ||
      normalizedName.includes("fly")
      ? "isolation"
      : "compound";
  }

  return "isolation";
}

function derivePrimaryLabel(parts: string[], muscles: string[]): string {
  return muscles[0] ?? parts[0] ?? "Full Body";
}

export function serializeExercise(record: ExerciseCatalogRecord): ExerciseCatalogItem {
  const bodyParts = parseStringArray(record.bodyParts).map(titleCaseToken);
  const equipments = parseStringArray(record.equipments).map(titleCaseToken);
  const targetMuscles = parseStringArray(record.targetMuscles).map(titleCaseToken);
  const secondaryMuscles = parseStringArray(record.secondaryMuscles).map(titleCaseToken);
  const category = deriveExerciseCategory(bodyParts, targetMuscles);
  const trainingStyle =
    record.trainingStyle ??
    deriveTrainingStyle(record.name, record.exerciseType);

  return {
    id: record.id,
    externalId: record.externalId,
    slug: record.slug,
    name: record.name,
    bodyParts,
    equipments,
    gender: record.gender,
    exerciseType: record.exerciseType,
    targetMuscles,
    secondaryMuscles,
    imageUrl: resolveExerciseMediaUrl(record.imageUrl),
    videoUrl: resolveExerciseMediaUrl(record.videoUrl),
    category,
    planBucket: derivePlanBucket(category),
    trainingStyle,
    defaultSets: trainingStyle === "compound" ? 4 : 3,
    defaultReps: trainingStyle === "compound" ? 8 : 12,
    defaultRestTime: trainingStyle === "compound" ? 90 : 60,
    primaryLabel: derivePrimaryLabel(bodyParts, targetMuscles),
  };
}

export function sortExercisesByPriority(items: ExerciseCatalogItem[]): ExerciseCatalogItem[] {
  return [...items].sort((left, right) => {
    const bucketDiff =
      (left.planBucket ? 0 : 1) - (right.planBucket ? 0 : 1);
    if (bucketDiff !== 0) return bucketDiff;

    const styleDiff =
      (left.trainingStyle === "compound" ? 0 : 1) -
      (right.trainingStyle === "compound" ? 0 : 1);
    if (styleDiff !== 0) return styleDiff;

    return left.name.localeCompare(right.name, "en", { sensitivity: "base" });
  });
}
