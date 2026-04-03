// ── Static Exercise Library ──

export type Category =
  | "chest"
  | "back"
  | "shoulder"
  | "arms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export type ExerciseType = "compound" | "isolation";

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroup: string;
  type: ExerciseType;
  defaultRestTime: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  chest: "Chest",
  back: "Back",
  shoulder: "Shoulder",
  arms: "Arms",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
};

export const CATEGORY_GRADIENTS: Record<Category, string> = {
  chest: "from-rose-500/30 to-orange-500/20",
  back: "from-blue-500/30 to-cyan-500/20",
  shoulder: "from-violet-500/30 to-purple-500/20",
  arms: "from-amber-500/30 to-yellow-500/20",
  quads: "from-emerald-500/30 to-teal-500/20",
  hamstrings: "from-sky-500/30 to-indigo-500/20",
  glutes: "from-pink-500/30 to-fuchsia-500/20",
  calves: "from-lime-500/30 to-green-500/20",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  chest: "💪",
  back: "🔙",
  shoulder: "🏋️",
  arms: "💪",
  quads: "🦵",
  hamstrings: "🦵",
  glutes: "🍑",
  calves: "🦶",
};

export const UPPER_CATEGORIES: Category[] = ["chest", "back", "shoulder", "arms"];
export const LOWER_CATEGORIES: Category[] = ["quads", "hamstrings", "glutes", "calves"];

export const exercises: Exercise[] = [
  // ── Chest ──
  { id: "bench-press", name: "Bench Press", category: "chest", muscleGroup: "Pectoralis Major", type: "compound", defaultRestTime: 90 },
  { id: "incline-db-press", name: "Incline Dumbbell Press", category: "chest", muscleGroup: "Upper Pectoralis", type: "compound", defaultRestTime: 90 },
  { id: "chest-fly", name: "Chest Fly", category: "chest", muscleGroup: "Pectoralis Major", type: "isolation", defaultRestTime: 60 },
  { id: "push-up", name: "Push Up", category: "chest", muscleGroup: "Pectoralis Major", type: "compound", defaultRestTime: 60 },
  { id: "cable-crossover", name: "Cable Crossover", category: "chest", muscleGroup: "Pectoralis Major", type: "isolation", defaultRestTime: 60 },

  // ── Back ──
  { id: "lat-pulldown", name: "Lat Pulldown", category: "back", muscleGroup: "Latissimus Dorsi", type: "compound", defaultRestTime: 90 },
  { id: "barbell-row", name: "Barbell Row", category: "back", muscleGroup: "Rhomboids & Lats", type: "compound", defaultRestTime: 90 },
  { id: "seated-cable-row", name: "Seated Cable Row", category: "back", muscleGroup: "Mid Back", type: "compound", defaultRestTime: 90 },
  { id: "pull-up", name: "Pull Up", category: "back", muscleGroup: "Latissimus Dorsi", type: "compound", defaultRestTime: 90 },
  { id: "deadlift", name: "Deadlift", category: "back", muscleGroup: "Posterior Chain", type: "compound", defaultRestTime: 120 },

  // ── Shoulder ──
  { id: "overhead-press", name: "Overhead Press", category: "shoulder", muscleGroup: "Anterior Deltoid", type: "compound", defaultRestTime: 90 },
  { id: "lateral-raise", name: "Lateral Raise", category: "shoulder", muscleGroup: "Lateral Deltoid", type: "isolation", defaultRestTime: 60 },
  { id: "face-pull", name: "Face Pull", category: "shoulder", muscleGroup: "Rear Deltoid", type: "isolation", defaultRestTime: 60 },
  { id: "arnold-press", name: "Arnold Press", category: "shoulder", muscleGroup: "All Deltoids", type: "compound", defaultRestTime: 90 },
  { id: "front-raise", name: "Front Raise", category: "shoulder", muscleGroup: "Anterior Deltoid", type: "isolation", defaultRestTime: 60 },

  // ── Arms ──
  { id: "bicep-curl", name: "Bicep Curl", category: "arms", muscleGroup: "Biceps Brachii", type: "isolation", defaultRestTime: 60 },
  { id: "hammer-curl", name: "Hammer Curl", category: "arms", muscleGroup: "Brachialis", type: "isolation", defaultRestTime: 60 },
  { id: "tricep-dips", name: "Tricep Dips", category: "arms", muscleGroup: "Triceps", type: "compound", defaultRestTime: 90 },
  { id: "skull-crusher", name: "Skull Crusher", category: "arms", muscleGroup: "Triceps", type: "isolation", defaultRestTime: 60 },
  { id: "cable-pushdown", name: "Cable Pushdown", category: "arms", muscleGroup: "Triceps", type: "isolation", defaultRestTime: 60 },

  // ── Quads ──
  { id: "squat", name: "Squat", category: "quads", muscleGroup: "Quadriceps", type: "compound", defaultRestTime: 120 },
  { id: "leg-press", name: "Leg Press", category: "quads", muscleGroup: "Quadriceps", type: "compound", defaultRestTime: 90 },
  { id: "leg-extension", name: "Leg Extension", category: "quads", muscleGroup: "Quadriceps", type: "isolation", defaultRestTime: 60 },
  { id: "hack-squat", name: "Hack Squat", category: "quads", muscleGroup: "Quadriceps", type: "compound", defaultRestTime: 90 },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", category: "quads", muscleGroup: "Quadriceps & Glutes", type: "compound", defaultRestTime: 90 },

  // ── Hamstrings ──
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "hamstrings", muscleGroup: "Hamstrings", type: "compound", defaultRestTime: 90 },
  { id: "leg-curl", name: "Leg Curl", category: "hamstrings", muscleGroup: "Hamstrings", type: "isolation", defaultRestTime: 60 },
  { id: "nordic-curl", name: "Nordic Curl", category: "hamstrings", muscleGroup: "Hamstrings", type: "compound", defaultRestTime: 90 },
  { id: "good-morning", name: "Good Morning", category: "hamstrings", muscleGroup: "Hamstrings & Lower Back", type: "compound", defaultRestTime: 90 },

  // ── Glutes ──
  { id: "hip-thrust", name: "Hip Thrust", category: "glutes", muscleGroup: "Gluteus Maximus", type: "compound", defaultRestTime: 90 },
  { id: "glute-bridge", name: "Glute Bridge", category: "glutes", muscleGroup: "Gluteus Maximus", type: "isolation", defaultRestTime: 60 },
  { id: "cable-kickback", name: "Cable Kickback", category: "glutes", muscleGroup: "Gluteus Maximus", type: "isolation", defaultRestTime: 60 },

  // ── Calves ──
  { id: "calf-raise", name: "Calf Raise", category: "calves", muscleGroup: "Gastrocnemius", type: "isolation", defaultRestTime: 45 },
  { id: "seated-calf-raise", name: "Seated Calf Raise", category: "calves", muscleGroup: "Soleus", type: "isolation", defaultRestTime: 45 },
];

// ── Helpers ──
export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getExercisesByCategory(category: Category): Exercise[] {
  return exercises.filter((e) => e.category === category);
}

export function getUpperExercises(): Exercise[] {
  return exercises.filter((e) => UPPER_CATEGORIES.includes(e.category));
}

export function getLowerExercises(): Exercise[] {
  return exercises.filter((e) => LOWER_CATEGORIES.includes(e.category));
}
