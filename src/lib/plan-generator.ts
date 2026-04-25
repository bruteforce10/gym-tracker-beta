import "server-only";

import {
  type ExerciseCatalogItem,
  type ExerciseDisplayCategory,
} from "@/lib/exercise-catalog";
import { parseDateInputValue } from "@/lib/date";
import { fetchExerciseById, fetchExerciseCatalog } from "@/lib/exercise-store";
import {
  ONBOARDING_PLAN_VERSION,
  getEquipmentMeta,
  getExperienceMeta,
  getGoalMeta,
  getLoadLevelMeta,
  type DraftGoal,
  type DraftPlanExercise,
  type DraftWorkoutPlan,
  type EquipmentAccess,
  type ExperienceLevel,
  type GeneratedOnboardingDraft,
  type OnboardingAnswers,
  type PrimaryGoal,
} from "@/lib/onboarding";

type DayTemplate = {
  name: string;
  type: string;
  focusLabel: string;
  description: string;
  categories: ExerciseDisplayCategory[];
  exerciseCount: number;
};

type ProgramTemplate = {
  key: string;
  label: string;
  description: string;
  days: DayTemplate[];
};

const BODYWEIGHT_HINTS = ["body weight", "bodyweight"];
const HOME_GYM_HINTS = [
  "body weight",
  "bodyweight",
  "dumbbell",
  "barbell",
  "bench",
  "kettlebell",
  "resistance band",
  "band",
];
const LIMITED_GYM_EXCLUDED = ["smith", "sled", "roller", "stationary bike"];

const CATEGORY_EXERCISE_COUNT: Record<ExperienceLevel, number> = {
  beginner: 5,
  intermediate: 6,
  advanced: 7,
};

function createFullBodyTemplate(trainingDaysPerWeek: number): ProgramTemplate {
  const variants: Array<Omit<DayTemplate, "exerciseCount">> = [
    {
      name: "Full Body A",
      type: "custom",
      focusLabel: "Full Body",
      description: "Campuran compound utama untuk memulai minggu dengan ritme stabil.",
      categories: ["chest", "back", "quads", "shoulder", "hamstrings"],
    },
    {
      name: "Full Body B",
      type: "custom",
      focusLabel: "Full Body",
      description: "Variasi kedua untuk menjaga progres tanpa pola yang monoton.",
      categories: ["back", "glutes", "chest", "arms", "quads"],
    },
    {
      name: "Full Body C",
      type: "custom",
      focusLabel: "Full Body",
      description: "Sesi ketiga dengan emphasis balance dan recovery yang tetap aman.",
      categories: ["shoulder", "back", "glutes", "arms", "hamstrings"],
    },
  ];

  return {
    key: "full_body_rotation",
    label: "Full Body Rotation",
    description: "Split fleksibel untuk frekuensi latihan rendah sampai menengah.",
    days: variants.slice(0, trainingDaysPerWeek).map((variant) => ({
      ...variant,
      exerciseCount: 0,
    })),
  };
}

function createUpperLowerTemplate(): ProgramTemplate {
  return {
    key: "upper_lower_split",
    label: "Upper Lower Split",
    description: "Split klasik untuk progres yang rapi dengan frekuensi 4 hari.",
    days: [
      {
        name: "Upper A",
        type: "upper",
        focusLabel: "Upper Body",
        description: "Compound utama tubuh atas dengan aksesori seperlunya.",
        categories: ["chest", "back", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Lower A",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Lower session untuk quad, hamstring, dan glute foundation.",
        categories: ["quads", "hamstrings", "glutes", "calves"],
        exerciseCount: 0,
      },
      {
        name: "Upper B",
        type: "upper",
        focusLabel: "Upper Body",
        description: "Upper variation untuk volume tambahan dan keseimbangan otot.",
        categories: ["back", "chest", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Lower B",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Lower variation dengan emphasis posterior chain dan stabilitas.",
        categories: ["glutes", "hamstrings", "quads", "calves"],
        exerciseCount: 0,
      },
    ],
  };
}

function createFiveDayTemplate(): ProgramTemplate {
  return {
    key: "five_day_hybrid",
    label: "Five Day Hybrid",
    description: "Hybrid split untuk user yang siap volume lebih tinggi dengan ritme tetap terarah.",
    days: [
      {
        name: "Push",
        type: "custom",
        focusLabel: "Push",
        description: "Chest, shoulder, dan tricep untuk dorongan utama.",
        categories: ["chest", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Pull",
        type: "custom",
        focusLabel: "Pull",
        description: "Back, rear chain, dan grip support untuk tarikan utama.",
        categories: ["back", "arms", "shoulder"],
        exerciseCount: 0,
      },
      {
        name: "Legs",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Hari kaki dengan fondasi strength dan hypertrophy yang seimbang.",
        categories: ["quads", "hamstrings", "glutes", "calves"],
        exerciseCount: 0,
      },
      {
        name: "Upper Focus",
        type: "upper",
        focusLabel: "Upper Body",
        description: "Upper volume tambahan untuk progres mingguan yang lebih padat.",
        categories: ["chest", "back", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Lower Focus",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Lower variation untuk menutup minggu dengan workload efisien.",
        categories: ["glutes", "quads", "hamstrings", "calves"],
        exerciseCount: 0,
      },
    ],
  };
}

function createPushPullLegsTemplate(): ProgramTemplate {
  return {
    key: "push_pull_legs_x2",
    label: "Push Pull Legs",
    description: "Template frekuensi tinggi untuk user yang siap latihan hampir setiap hari.",
    days: [
      {
        name: "Push A",
        type: "custom",
        focusLabel: "Push",
        description: "Push session untuk kekuatan dan volume awal minggu.",
        categories: ["chest", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Pull A",
        type: "custom",
        focusLabel: "Pull",
        description: "Pull session untuk back thickness dan lat emphasis.",
        categories: ["back", "arms", "shoulder"],
        exerciseCount: 0,
      },
      {
        name: "Legs A",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Lower foundation untuk strength dan control.",
        categories: ["quads", "hamstrings", "glutes", "calves"],
        exerciseCount: 0,
      },
      {
        name: "Push B",
        type: "custom",
        focusLabel: "Push",
        description: "Push variation untuk volume tambahan tanpa mengulang pola sepenuhnya.",
        categories: ["shoulder", "chest", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Pull B",
        type: "custom",
        focusLabel: "Pull",
        description: "Pull variation dengan kombinasi rowing dan lat work.",
        categories: ["back", "shoulder", "arms"],
        exerciseCount: 0,
      },
      {
        name: "Legs B",
        type: "lower",
        focusLabel: "Lower Body",
        description: "Leg variation untuk posterior chain dan glute emphasis.",
        categories: ["glutes", "hamstrings", "quads", "calves"],
        exerciseCount: 0,
      },
    ],
  };
}

function normalizeEquipmentToken(value: string) {
  return value.trim().toLowerCase();
}

function matchesEquipmentHints(
  exercise: ExerciseCatalogItem,
  hints: string[],
  excludedHints: string[] = []
) {
  const equipmentTokens = exercise.equipments.map(normalizeEquipmentToken);

  if (excludedHints.some((hint) => equipmentTokens.some((token) => token.includes(hint)))) {
    return false;
  }

  return hints.some((hint) => equipmentTokens.some((token) => token.includes(hint)));
}

function filterByEquipment(
  exercises: ExerciseCatalogItem[],
  equipmentAccess: EquipmentAccess
) {
  if (equipmentAccess === "full_gym") return exercises;

  if (equipmentAccess === "bodyweight") {
    const matched = exercises.filter((exercise) =>
      matchesEquipmentHints(exercise, BODYWEIGHT_HINTS)
    );
    return matched.length > 0 ? matched : exercises;
  }

  if (equipmentAccess === "home_gym") {
    const matched = exercises.filter((exercise) =>
      matchesEquipmentHints(exercise, HOME_GYM_HINTS)
    );
    return matched.length > 0 ? matched : exercises;
  }

  const matched = exercises.filter(
    (exercise) =>
      !exercise.equipments.some((equipment) =>
        LIMITED_GYM_EXCLUDED.some((hint) =>
          normalizeEquipmentToken(equipment).includes(hint)
        )
      )
  );
  return matched.length > 0 ? matched : exercises;
}

function getExerciseCount(experienceLevel: ExperienceLevel, primaryGoal: PrimaryGoal) {
  const baseCount = CATEGORY_EXERCISE_COUNT[experienceLevel];
  if (primaryGoal === "fat_loss") return Math.max(4, baseCount - 1);
  if (primaryGoal === "muscle_gain" && experienceLevel !== "beginner") return baseCount + 1;
  return baseCount;
}

function getProgramTemplate(answers: OnboardingAnswers): ProgramTemplate {
  if (answers.trainingDaysPerWeek <= 3) {
    return createFullBodyTemplate(answers.trainingDaysPerWeek);
  }

  if (answers.trainingDaysPerWeek === 4) {
    return createUpperLowerTemplate();
  }

  if (answers.trainingDaysPerWeek === 5) {
    return createFiveDayTemplate();
  }

  return createPushPullLegsTemplate();
}

function getGoalExercisePriorityBoost(
  exercise: ExerciseCatalogItem,
  goalExercise: ExerciseCatalogItem,
  answers: OnboardingAnswers
) {
  let score = 0;

  if (exercise.id === goalExercise.id) {
    score += 12;
  }

  if (exercise.category && exercise.category === goalExercise.category) {
    score += 5;
  }

  if (exercise.planBucket && exercise.planBucket === goalExercise.planBucket) {
    score += 2;
  }

  if (answers.primaryGoal === "strength" && exercise.trainingStyle === "compound") {
    score += 2;
  }

  return score;
}

function scoreExercise(exercise: ExerciseCatalogItem, answers: OnboardingAnswers) {
  let score = 0;

  if (answers.primaryGoal === "strength") {
    score += exercise.trainingStyle === "compound" ? 5 : 1;
  }

  if (answers.primaryGoal === "muscle_gain") {
    score += exercise.trainingStyle === "compound" ? 4 : 3;
  }

  if (answers.primaryGoal === "fat_loss") {
    score += exercise.trainingStyle === "compound" ? 4 : 2;
  }

  if (answers.primaryGoal === "general_fitness") {
    score += exercise.trainingStyle === "compound" ? 4 : 2;
  }

  if (answers.secondaryGoal === "strength" && exercise.trainingStyle === "compound") {
    score += 2;
  }

  if (answers.secondaryGoal === "muscle_gain") {
    score += 1;
  }

  if (answers.experienceLevel === "beginner" && exercise.trainingStyle === "compound") {
    score += 1;
  }

  if (
    answers.equipmentAccess === "bodyweight" &&
    matchesEquipmentHints(exercise, BODYWEIGHT_HINTS)
  ) {
    score += 3;
  }

  if (
    answers.equipmentAccess === "home_gym" &&
    matchesEquipmentHints(exercise, HOME_GYM_HINTS)
  ) {
    score += 2;
  }

  return score;
}

function sortByGoalAwareScore(
  exercises: ExerciseCatalogItem[],
  answers: OnboardingAnswers,
  goalExercise: ExerciseCatalogItem
) {
  return [...exercises].sort((left, right) => {
    const rightScore =
      scoreExercise(right, answers) +
      getGoalExercisePriorityBoost(right, goalExercise, answers);
    const leftScore =
      scoreExercise(left, answers) +
      getGoalExercisePriorityBoost(left, goalExercise, answers);
    const diff = rightScore - leftScore;
    if (diff !== 0) return diff;
    return left.name.localeCompare(right.name, "en", { sensitivity: "base" });
  });
}

function chooseRestTime(
  trainingStyle: ExerciseCatalogItem["trainingStyle"],
  primaryGoal: PrimaryGoal
) {
  if (primaryGoal === "strength") {
    return trainingStyle === "compound" ? 120 : 75;
  }
  if (primaryGoal === "fat_loss") {
    return trainingStyle === "compound" ? 60 : 45;
  }
  if (primaryGoal === "muscle_gain") {
    return trainingStyle === "compound" ? 90 : 60;
  }
  return trainingStyle === "compound" ? 90 : 60;
}

function chooseSets(
  trainingStyle: ExerciseCatalogItem["trainingStyle"],
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel
) {
  if (primaryGoal === "strength") {
    return trainingStyle === "compound" ? 5 : 3;
  }
  if (primaryGoal === "fat_loss") {
    return trainingStyle === "compound" ? 3 : 3;
  }
  if (primaryGoal === "muscle_gain") {
    return trainingStyle === "compound" && experienceLevel !== "beginner" ? 4 : 3;
  }
  return trainingStyle === "compound" ? 4 : 3;
}

function chooseReps(
  trainingStyle: ExerciseCatalogItem["trainingStyle"],
  primaryGoal: PrimaryGoal
) {
  if (primaryGoal === "strength") {
    return trainingStyle === "compound" ? 5 : 8;
  }
  if (primaryGoal === "fat_loss") {
    return trainingStyle === "compound" ? 10 : 12;
  }
  if (primaryGoal === "muscle_gain") {
    return trainingStyle === "compound" ? 8 : 12;
  }
  return trainingStyle === "compound" ? 8 : 10;
}

function buildExerciseRationale(
  exercise: ExerciseCatalogItem,
  answers: OnboardingAnswers
) {
  if (answers.primaryGoal === "strength" && exercise.trainingStyle === "compound") {
    return "Dipilih sebagai anchor compound untuk progres kekuatan yang lebih jelas.";
  }
  if (answers.primaryGoal === "fat_loss") {
    return "Dipilih karena efisien untuk sesi yang padat dan mudah dijaga konsistensinya.";
  }
  if (answers.primaryGoal === "muscle_gain" && exercise.trainingStyle === "isolation") {
    return "Dipilih untuk menambah volume otot tanpa membebani struktur sesi terlalu berat.";
  }
  return "Dipilih agar sesi tetap seimbang dan sesuai dengan profil latihanmu.";
}

function toDraftExercise(
  exercise: ExerciseCatalogItem,
  answers: OnboardingAnswers
): DraftPlanExercise {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    category: exercise.category,
    primaryLabel: exercise.primaryLabel,
    trainingStyle: exercise.trainingStyle,
    defaultSets: chooseSets(
      exercise.trainingStyle,
      answers.primaryGoal,
      answers.experienceLevel
    ),
    defaultReps: chooseReps(exercise.trainingStyle, answers.primaryGoal),
    restTime: chooseRestTime(exercise.trainingStyle, answers.primaryGoal),
    rationale: buildExerciseRationale(exercise, answers),
  };
}

function pickCategoryExercise(
  exercises: ExerciseCatalogItem[],
  usedIds: Set<string>
) {
  const fresh = exercises.find((exercise) => !usedIds.has(exercise.id));
  return fresh ?? exercises[0] ?? null;
}

function buildPlanDraft(
  template: DayTemplate,
  answers: OnboardingAnswers,
  filteredCatalog: ExerciseCatalogItem[],
  usedIds: Set<string>,
  goalExercise: ExerciseCatalogItem
): DraftWorkoutPlan {
  const desiredCount = getExerciseCount(
    answers.experienceLevel,
    answers.primaryGoal
  );
  const goalExerciseInTemplate = template.categories.includes(
    goalExercise.category ?? "arms"
  );
  const selected: ExerciseCatalogItem[] = goalExerciseInTemplate
    ? [goalExercise]
    : [];

  const perCategoryPool = template.categories.flatMap((category) => {
    const categoryMatches = sortByGoalAwareScore(
      filteredCatalog.filter((exercise) => exercise.category === category),
      answers,
      goalExercise
    );
    const selected = pickCategoryExercise(categoryMatches, usedIds);
    return selected ? [selected] : [];
  });

  for (const exercise of perCategoryPool) {
    if (!selected.some((item) => item.id === exercise.id)) {
      selected.push(exercise);
    }
  }

  const fallbackPool = sortByGoalAwareScore(
    filteredCatalog.filter(
      (exercise) =>
        template.categories.includes(exercise.category ?? "arms") &&
        !selected.some((item) => item.id === exercise.id)
    ),
    answers,
    goalExercise
  );

  for (const exercise of fallbackPool) {
    if (selected.length >= desiredCount) break;
    selected.push(exercise);
  }

  while (selected.length < Math.max(4, desiredCount)) {
    const fallback = sortByGoalAwareScore(
      filteredCatalog.filter((exercise) => !selected.some((item) => item.id === exercise.id)),
      answers,
      goalExercise
    )[0];
    if (!fallback) break;
    selected.push(fallback);
  }

  selected.forEach((exercise) => usedIds.add(exercise.id));

  const draft = {
    name: template.name,
    type: template.type,
    focusLabel: template.focusLabel,
    description: template.description,
    exercises: selected.slice(0, desiredCount).map((exercise) => toDraftExercise(exercise, answers)),
  };
  if (
    goalExerciseInTemplate &&
    !draft.exercises.some((exercise) => exercise.exerciseId === goalExercise.id)
  ) {
    draft.exercises = [
      toDraftExercise(goalExercise, answers),
      ...draft.exercises.slice(0, Math.max(0, desiredCount - 1)),
    ];
  }

  return draft;
}

function buildGoalDraft(
  goalExercise: ExerciseCatalogItem,
  answers: OnboardingAnswers
): DraftGoal {
  return {
    exerciseId: goalExercise.id,
    exerciseName: goalExercise.name,
    targetWeight: answers.goalTargetWeight,
    currentWeight: 0,
    deadline: parseDateInputValue(answers.goalDeadline)?.toISOString() ?? new Date().toISOString(),
    rationale:
      answers.primaryGoal === "strength"
        ? "Goal ini kamu set langsung saat onboarding, lalu program disusun untuk membantu progres ke target tersebut."
        : "Goal ini jadi anchor utama onboarding, dan struktur plan dibuat mengikuti target yang kamu pilih.",
  };
}

function buildRecommendationSummary(
  template: ProgramTemplate,
  answers: OnboardingAnswers,
  goalExercise: ExerciseCatalogItem
) {
  return `${template.label} dipilih untuk membantu kamu mengejar ${goalExercise.name} sampai ${answers.goalTargetWeight.toFixed(
    1
  )} kg, dengan fokus program ${getGoalMeta(
    answers.primaryGoal
  ).shortLabel.toLowerCase()} dan frekuensi ${answers.trainingDaysPerWeek} hari per minggu.`;
}

function buildRationale(
  template: ProgramTemplate,
  answers: OnboardingAnswers,
  goalExercise: ExerciseCatalogItem
) {
  return [
    `${goalExercise.name} jadi anchor utama onboarding, jadi plan akan lebih sering menyentuh kategori ${goalExercise.primaryLabel.toLowerCase()} dan gerakan pendukungnya.`,
    `${template.label} paling cocok untuk frekuensi latihan ${answers.trainingDaysPerWeek} hari per minggu.`,
    `Level ${getExperienceMeta(answers.experienceLevel).label.toLowerCase()} membuat volume awal dijaga tetap realistis.`,
    `Setup ${getEquipmentMeta(answers.equipmentAccess).label.toLowerCase()} dipakai untuk menyaring exercise yang lebih masuk akal dikerjakan.`,
    `Kemampuan beban ${getLoadLevelMeta(answers.loadLevel).label.toLowerCase()} membuat target awal dibuat cukup menantang tanpa terlalu agresif.`,
  ];
}

export async function generateOnboardingDraft(
  answers: OnboardingAnswers
): Promise<GeneratedOnboardingDraft> {
  const catalog = await fetchExerciseCatalog({ limit: 240 });
  const goalExercise = await fetchExerciseById(answers.goalExerciseId);
  if (!goalExercise) {
    throw new Error("Exercise goal tidak ditemukan.");
  }
  const filteredCatalog = filterByEquipment(catalog, answers.equipmentAccess);
  const template = getProgramTemplate(answers);
  const usedIds = new Set<string>();
  const plans = template.days.map((day) =>
    buildPlanDraft(day, answers, filteredCatalog, usedIds, goalExercise)
  );
  const goal = buildGoalDraft(goalExercise, answers);

  return {
    version: ONBOARDING_PLAN_VERSION,
    generatedAt: new Date().toISOString(),
    templateKey: template.key,
    recommendationSummary: buildRecommendationSummary(template, answers, goalExercise),
    rationale: buildRationale(template, answers, goalExercise),
    answers,
    plans,
    goal,
  };
}
