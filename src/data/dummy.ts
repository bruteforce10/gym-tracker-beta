// ── Dummy Data for Gym Progress Tracker MVP ──

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface Goal {
  id: string;
  userId: string;
  exercise: string;
  targetWeight: number;
  currentWeight: number;
  deadline: string | null;
  createdAt: string;
}

export interface ExerciseLog {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
  createdAt: string;
  exercises: ExerciseLog[];
}

// ── User ──
export const dummyUser: User = {
  id: "usr_1",
  name: "Ahmad",
  email: "ahmad@example.com",
  createdAt: "2025-01-15T00:00:00Z",
};

// ── Active Goal ──
export const dummyGoal: Goal = {
  id: "goal_1",
  userId: "usr_1",
  exercise: "Bench Press",
  targetWeight: 100,
  currentWeight: 72.5,
  deadline: "2026-06-30",
  createdAt: "2025-02-01T00:00:00Z",
};

// ── Workout History (4 weeks) ──
export const dummyWorkouts: Workout[] = [
  // ── Week 4 (current week) ──
  {
    id: "w_12",
    userId: "usr_1",
    date: "2026-03-28",
    createdAt: "2026-03-28T08:00:00Z",
    exercises: [
      { exercise: "Bench Press", weight: 67.5, reps: 5, sets: 4 },
      { exercise: "Incline Dumbbell Press", weight: 27.5, reps: 8, sets: 3 },
      { exercise: "Cable Fly", weight: 15, reps: 12, sets: 3 },
    ],
  },
  {
    id: "w_11",
    userId: "usr_1",
    date: "2026-03-26",
    createdAt: "2026-03-26T08:00:00Z",
    exercises: [
      { exercise: "Squat", weight: 80, reps: 5, sets: 4 },
      { exercise: "Leg Press", weight: 120, reps: 10, sets: 3 },
      { exercise: "Romanian Deadlift", weight: 60, reps: 8, sets: 3 },
    ],
  },
  {
    id: "w_10",
    userId: "usr_1",
    date: "2026-03-24",
    createdAt: "2026-03-24T08:00:00Z",
    exercises: [
      { exercise: "Overhead Press", weight: 42.5, reps: 6, sets: 4 },
      { exercise: "Lateral Raise", weight: 10, reps: 12, sets: 3 },
      { exercise: "Face Pull", weight: 20, reps: 15, sets: 3 },
    ],
  },
  // ── Week 3 ──
  {
    id: "w_9",
    userId: "usr_1",
    date: "2026-03-21",
    createdAt: "2026-03-21T08:00:00Z",
    exercises: [
      { exercise: "Bench Press", weight: 65, reps: 5, sets: 4 },
      { exercise: "Incline Dumbbell Press", weight: 25, reps: 8, sets: 3 },
      { exercise: "Tricep Dips", weight: 0, reps: 12, sets: 3 },
    ],
  },
  {
    id: "w_8",
    userId: "usr_1",
    date: "2026-03-19",
    createdAt: "2026-03-19T08:00:00Z",
    exercises: [
      { exercise: "Squat", weight: 77.5, reps: 5, sets: 4 },
      { exercise: "Leg Press", weight: 115, reps: 10, sets: 3 },
      { exercise: "Leg Curl", weight: 40, reps: 10, sets: 3 },
    ],
  },
  {
    id: "w_7",
    userId: "usr_1",
    date: "2026-03-17",
    createdAt: "2026-03-17T08:00:00Z",
    exercises: [
      { exercise: "Overhead Press", weight: 40, reps: 6, sets: 4 },
      { exercise: "Lateral Raise", weight: 10, reps: 12, sets: 3 },
      { exercise: "Bench Press", weight: 62.5, reps: 8, sets: 3 },
    ],
  },
  // ── Week 2 ──
  {
    id: "w_6",
    userId: "usr_1",
    date: "2026-03-14",
    createdAt: "2026-03-14T08:00:00Z",
    exercises: [
      { exercise: "Bench Press", weight: 62.5, reps: 5, sets: 4 },
      { exercise: "Incline Dumbbell Press", weight: 22.5, reps: 8, sets: 3 },
      { exercise: "Cable Fly", weight: 12.5, reps: 12, sets: 3 },
    ],
  },
  {
    id: "w_5",
    userId: "usr_1",
    date: "2026-03-12",
    createdAt: "2026-03-12T08:00:00Z",
    exercises: [
      { exercise: "Squat", weight: 75, reps: 5, sets: 4 },
      { exercise: "Leg Press", weight: 110, reps: 10, sets: 3 },
      { exercise: "Romanian Deadlift", weight: 55, reps: 8, sets: 3 },
    ],
  },
  // ── Week 1 ──
  {
    id: "w_4",
    userId: "usr_1",
    date: "2026-03-07",
    createdAt: "2026-03-07T08:00:00Z",
    exercises: [
      { exercise: "Bench Press", weight: 60, reps: 5, sets: 4 },
      { exercise: "Incline Dumbbell Press", weight: 20, reps: 8, sets: 3 },
      { exercise: "Tricep Dips", weight: 0, reps: 12, sets: 3 },
    ],
  },
  {
    id: "w_3",
    userId: "usr_1",
    date: "2026-03-05",
    createdAt: "2026-03-05T08:00:00Z",
    exercises: [
      { exercise: "Squat", weight: 72.5, reps: 5, sets: 4 },
      { exercise: "Leg Press", weight: 105, reps: 10, sets: 3 },
    ],
  },
  {
    id: "w_2",
    userId: "usr_1",
    date: "2026-03-03",
    createdAt: "2026-03-03T08:00:00Z",
    exercises: [
      { exercise: "Overhead Press", weight: 37.5, reps: 6, sets: 4 },
      { exercise: "Lateral Raise", weight: 8, reps: 12, sets: 3 },
      { exercise: "Face Pull", weight: 17.5, reps: 15, sets: 3 },
    ],
  },
];

// ── Exercises list ──
export const exercisesList = [
  "Bench Press",
  "Incline Dumbbell Press",
  "Cable Fly",
  "Squat",
  "Leg Press",
  "Romanian Deadlift",
  "Leg Curl",
  "Overhead Press",
  "Lateral Raise",
  "Face Pull",
  "Tricep Dips",
  "Barbell Row",
  "Lat Pulldown",
  "Deadlift",
  "Bicep Curl",
];
