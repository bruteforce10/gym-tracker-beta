import { calculate1RM, calculateProgress, getDaysUntilDeadline } from "@/lib/calculations";
import { formatDateInputValue } from "@/lib/date";
import type { ExerciseCatalogItem } from "@/lib/exercise-catalog";
import { fetchExercisesByIds } from "@/lib/exercise-store";
import { prisma } from "@/lib/prisma";

export type GoalStatus = "active" | "completed" | "overdue";

type GoalRecord = {
  id: string;
  userId: string;
  exerciseId: string | null;
  status: string;
  targetWeight: number;
  currentWeight: number;
  deadline: Date | null;
  completedAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type WorkoutRecord = {
  id: string;
  date: Date;
  exercises: Array<{
    exerciseId: string | null;
    weight: number;
    reps: number;
    sets: number;
  }>;
};

export type GoalDisplayItem = {
  id: string;
  status: GoalStatus;
  targetWeight: number;
  currentWeight: number;
  current1RM: number;
  progress: number;
  deadline: string | null;
  daysLeft: number | null;
  completedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  exercise: ExerciseCatalogItem;
};

function buildBest1RMMap(workouts: WorkoutRecord[]) {
  const bestMap = new Map<string, number>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (!exercise.exerciseId) continue;

      const rm = calculate1RM(exercise.weight, exercise.reps);
      const currentBest = bestMap.get(exercise.exerciseId) ?? 0;

      if (rm > currentBest) {
        bestMap.set(exercise.exerciseId, rm);
      }
    }
  }

  return bestMap;
}

function sortActiveGoals(left: GoalDisplayItem, right: GoalDisplayItem) {
  if (left.deadline && right.deadline) {
    const byDeadline = left.deadline.localeCompare(right.deadline);
    if (byDeadline !== 0) return byDeadline;
  }

  return left.createdAt.localeCompare(right.createdAt);
}

function sortHistoryGoals(
  left: GoalDisplayItem,
  right: GoalDisplayItem,
  key: "completedAt" | "expiredAt",
) {
  const leftValue = left[key] ?? "";
  const rightValue = right[key] ?? "";
  return rightValue.localeCompare(leftValue);
}

async function updateGoalLifecycleState(goals: GoalRecord[], bestMap: Map<string, number>) {
  const todayKey = formatDateInputValue(new Date());
  const updates = goals.flatMap((goal) => {
    const current1RM = goal.exerciseId ? bestMap.get(goal.exerciseId) ?? 0 : 0;
    const shouldSyncCurrentWeight =
      goal.status === "active" &&
      Math.abs(current1RM - goal.currentWeight) > 0.001;

    if (goal.status === "active") {
      if (goal.exerciseId && current1RM >= goal.targetWeight) {
        return [
          prisma.goal.update({
            where: { id: goal.id },
            data: {
              status: "completed",
              currentWeight: current1RM,
              completedAt: goal.completedAt ?? new Date(),
              expiredAt: null,
            },
          }),
        ];
      }

      const deadlineKey = goal.deadline ? formatDateInputValue(goal.deadline) : null;
      if (deadlineKey && deadlineKey < todayKey) {
        return [
          prisma.goal.update({
            where: { id: goal.id },
            data: {
              status: "overdue",
              currentWeight: current1RM,
              expiredAt: goal.expiredAt ?? new Date(),
              completedAt: null,
            },
          }),
        ];
      }
    }

    if (shouldSyncCurrentWeight) {
      return [
        prisma.goal.update({
          where: { id: goal.id },
          data: {
            currentWeight: current1RM,
          },
        }),
      ];
    }

    return [];
  });

  if (updates.length === 0) {
    return goals;
  }

  await prisma.$transaction(updates);

  return prisma.goal.findMany({
    where: { userId: goals[0]?.userId },
    orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
  });
}

export async function getUserGoalCollections(
  userId: string,
  workoutsInput?: WorkoutRecord[],
) {
  const [goals, workouts] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    }),
    workoutsInput
      ? Promise.resolve(workoutsInput)
      : prisma.workout.findMany({
          where: { userId },
          orderBy: { date: "desc" },
          include: { exercises: true },
        }),
  ]);

  if (goals.length === 0) {
    return {
      activeGoals: [] as GoalDisplayItem[],
      completedGoals: [] as GoalDisplayItem[],
      overdueGoals: [] as GoalDisplayItem[],
      activeGoalCount: 0,
      workouts,
      best1RMMap: buildBest1RMMap(workouts),
    };
  }

  const best1RMMap = buildBest1RMMap(workouts);
  const syncedGoals = await updateGoalLifecycleState(goals, best1RMMap);
  const exerciseIds = Array.from(
    new Set(syncedGoals.map((goal) => goal.exerciseId).filter(Boolean)),
  ) as string[];
  const exercises = await fetchExercisesByIds(exerciseIds);
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const serializedGoals = syncedGoals
    .map((goal) => {
      if (!goal.exerciseId) return null;

      const exercise = exerciseMap.get(goal.exerciseId);
      if (!exercise) return null;

      const current1RM =
        goal.status === "active"
          ? best1RMMap.get(goal.exerciseId) ?? goal.currentWeight ?? 0
          : goal.currentWeight;
      const deadline = goal.deadline ? formatDateInputValue(goal.deadline) : null;

      return {
        id: goal.id,
        status: goal.status as GoalStatus,
        targetWeight: goal.targetWeight,
        currentWeight: goal.currentWeight,
        current1RM,
        progress: calculateProgress(current1RM, goal.targetWeight),
        deadline,
        daysLeft: goal.status === "active" && deadline ? getDaysUntilDeadline(deadline) : null,
        completedAt: goal.completedAt ? formatDateInputValue(goal.completedAt) : null,
        expiredAt: goal.expiredAt ? formatDateInputValue(goal.expiredAt) : null,
        createdAt: formatDateInputValue(goal.createdAt),
        exercise,
      } satisfies GoalDisplayItem;
    })
    .filter(Boolean) as GoalDisplayItem[];

  const activeGoals = serializedGoals
    .filter((goal) => goal.status === "active")
    .sort(sortActiveGoals);
  const completedGoals = serializedGoals
    .filter((goal) => goal.status === "completed")
    .sort((left, right) => sortHistoryGoals(left, right, "completedAt"));
  const overdueGoals = serializedGoals
    .filter((goal) => goal.status === "overdue")
    .sort((left, right) => sortHistoryGoals(left, right, "expiredAt"));

  return {
    activeGoals,
    completedGoals,
    overdueGoals,
    activeGoalCount: activeGoals.length,
    workouts,
    best1RMMap,
  };
}
