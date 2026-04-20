import type {
  ExerciseCatalogItem,
  ExerciseDisplayCategory,
  ExerciseTrainingStyle,
} from "@/lib/exercise-catalog";

export const WORKOUT_SESSION_STORAGE_KEY = "gym-session";

export type SessionExerciseSource = "plan" | "dynamic-superset";
export type SessionTurnLane = "primary" | "superset";
export type WorkoutState =
  | "input-primary"
  | "input-superset"
  | "rest-transition"
  | "rest-normal"
  | "done";

export type SetEntry = {
  weight: number;
  reps: number;
  done: boolean;
};

export type SessionExercise = {
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  imageUrl?: string | null;
  category: ExerciseDisplayCategory | null;
  primaryLabel: string;
  trainingStyle: ExerciseTrainingStyle;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  source: SessionExerciseSource;
};

export type SessionData = {
  planId: string;
  planName: string;
  startedAt: string;
  exercises: SessionExercise[];
};

export type SessionPairing = {
  primarySessionExerciseId: string;
  supersetSessionExerciseId: string;
  transitionRestSeconds: number;
  status: "active" | "cancelled" | "completed";
};

export type ActiveTurn = {
  sessionExerciseId: string;
  lane: SessionTurnLane;
};

export type SessionProgress = {
  allSets: Record<string, SetEntry[]>;
  planOrder: string[];
  primaryIndex: number;
  activeTurn: ActiveTurn;
  queuedTurn: ActiveTurn | null;
  pairings: Record<string, SessionPairing>;
  state: WorkoutState;
  restLeft: number;
  restTotal: number;
  restKind: "transition" | "normal" | null;
};

export type WorkoutSessionSnapshot = SessionData & {
  progress: SessionProgress;
};

type StoredSessionLike =
  | SessionData
  | WorkoutSessionSnapshot
  | {
      planId?: unknown;
      planName?: unknown;
      startedAt?: unknown;
      exercises?: unknown;
      progress?: unknown;
    };

export function buildSessionExercise(
  exercise: Pick<
    ExerciseCatalogItem,
    | "id"
    | "name"
    | "imageUrl"
    | "category"
    | "primaryLabel"
    | "trainingStyle"
    | "defaultSets"
    | "defaultReps"
    | "defaultRestTime"
  >,
  options?: {
    source?: SessionExerciseSource;
    sessionExerciseId?: string;
  }
): SessionExercise {
  return {
    sessionExerciseId:
      options?.sessionExerciseId ?? createSessionExerciseId(exercise.id),
    exerciseId: exercise.id,
    name: exercise.name,
    imageUrl: exercise.imageUrl,
    category: exercise.category,
    primaryLabel: exercise.primaryLabel,
    trainingStyle: exercise.trainingStyle,
    defaultSets: exercise.defaultSets,
    defaultReps: exercise.defaultReps,
    restTime: exercise.defaultRestTime,
    source: options?.source ?? "plan",
  };
}

export function createSessionExerciseId(exerciseId: string) {
  return `${exerciseId}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildStoredSessionSnapshot(
  rawValue: string | null
): WorkoutSessionSnapshot | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as StoredSessionLike;

    if (
      parsed &&
      typeof parsed === "object" &&
      "progress" in parsed &&
      parsed.progress
    ) {
      return normalizeSnapshot(parsed as WorkoutSessionSnapshot);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.planId === "string" &&
      typeof parsed.planName === "string" &&
      typeof parsed.startedAt === "string" &&
      Array.isArray(parsed.exercises)
    ) {
      return createInitialSnapshot({
        planId: parsed.planId,
        planName: parsed.planName,
        startedAt: parsed.startedAt,
        exercises: parsed.exercises as SessionExercise[],
      });
    }
  } catch {
    return null;
  }

  return null;
}

export function createInitialSnapshot(session: SessionData): WorkoutSessionSnapshot {
  const normalizedExercises = session.exercises.map((exercise) =>
    normalizeSessionExercise(exercise)
  );
  const planOrder = normalizedExercises
    .filter((exercise) => exercise.source === "plan")
    .map((exercise) => exercise.sessionExerciseId);
  const firstPrimaryId = planOrder[0] ?? normalizedExercises[0]?.sessionExerciseId ?? "";

  return {
    ...session,
    exercises: normalizedExercises,
    progress: {
      allSets: Object.fromEntries(
        normalizedExercises.map((exercise) => [
          exercise.sessionExerciseId,
          createInitialSetEntries(exercise),
        ])
      ),
      planOrder,
      primaryIndex: 0,
      activeTurn: {
        sessionExerciseId: firstPrimaryId,
        lane: "primary",
      },
      queuedTurn: null,
      pairings: {},
      state: "input-primary",
      restLeft: 0,
      restTotal: 0,
      restKind: null,
    },
  };
}

export function normalizeSnapshot(
  snapshot: WorkoutSessionSnapshot
): WorkoutSessionSnapshot {
  const baseSnapshot = createInitialSnapshot(snapshot);
  const incomingExercises = snapshot.exercises.map((exercise) =>
    normalizeSessionExercise(exercise)
  );
  const incomingExerciseIds = new Set(
    incomingExercises.map((exercise) => exercise.sessionExerciseId)
  );

  return {
    ...snapshot,
    exercises: incomingExercises,
    progress: {
      ...baseSnapshot.progress,
      ...snapshot.progress,
      planOrder: snapshot.progress.planOrder.filter((id) =>
        incomingExerciseIds.has(id)
      ),
      activeTurn: incomingExerciseIds.has(snapshot.progress.activeTurn.sessionExerciseId)
        ? snapshot.progress.activeTurn
        : baseSnapshot.progress.activeTurn,
      queuedTurn:
        snapshot.progress.queuedTurn &&
        incomingExerciseIds.has(snapshot.progress.queuedTurn.sessionExerciseId)
          ? snapshot.progress.queuedTurn
          : null,
      pairings: Object.fromEntries(
        Object.entries(snapshot.progress.pairings).filter(
          ([primaryId, pairing]) =>
            incomingExerciseIds.has(primaryId) &&
            incomingExerciseIds.has(pairing.supersetSessionExerciseId)
        )
      ),
      allSets: Object.fromEntries(
        incomingExercises.map((exercise) => [
          exercise.sessionExerciseId,
          normalizeSetEntries(
            snapshot.progress.allSets[exercise.sessionExerciseId],
            exercise
          ),
        ])
      ),
    },
  };
}

export function normalizeSessionExercise(
  exercise: SessionExercise
): SessionExercise {
  return {
    ...exercise,
    sessionExerciseId:
      exercise.sessionExerciseId ?? createSessionExerciseId(exercise.exerciseId),
    source: exercise.source === "dynamic-superset" ? "dynamic-superset" : "plan",
  };
}

export function createInitialSetEntries(exercise: SessionExercise): SetEntry[] {
  return Array.from({ length: exercise.defaultSets }, () => ({
    weight: 0,
    reps: exercise.defaultReps,
    done: false,
  }));
}

export function normalizeSetEntries(
  entries: SetEntry[] | undefined,
  exercise: SessionExercise
): SetEntry[] {
  const safeEntries = Array.isArray(entries) ? entries : [];

  return Array.from({ length: exercise.defaultSets }, (_, index) => {
    const entry = safeEntries[index];
    return {
      weight: entry?.weight ?? 0,
      reps: entry?.reps ?? exercise.defaultReps,
      done: Boolean(entry?.done),
    };
  });
}

export function getExerciseBySessionId(
  snapshot: WorkoutSessionSnapshot,
  sessionExerciseId: string
) {
  return snapshot.exercises.find(
    (exercise) => exercise.sessionExerciseId === sessionExerciseId
  );
}

export function getSetsForExercise(
  snapshot: WorkoutSessionSnapshot,
  sessionExerciseId: string
) {
  return snapshot.progress.allSets[sessionExerciseId] ?? [];
}

export function getCompletedSetCount(
  snapshot: WorkoutSessionSnapshot,
  sessionExerciseId: string
) {
  return getSetsForExercise(snapshot, sessionExerciseId).filter((set) => set.done)
    .length;
}

export function getNextSetIndex(
  snapshot: WorkoutSessionSnapshot,
  sessionExerciseId: string
) {
  const nextIndex = getSetsForExercise(snapshot, sessionExerciseId).findIndex(
    (set) => !set.done
  );

  return nextIndex === -1 ? 0 : nextIndex;
}

export function isExerciseComplete(
  snapshot: WorkoutSessionSnapshot,
  sessionExerciseId: string
) {
  const sets = getSetsForExercise(snapshot, sessionExerciseId);
  return sets.length > 0 && sets.every((set) => set.done);
}

export function getCurrentPrimaryExercise(snapshot: WorkoutSessionSnapshot) {
  const currentPrimaryId =
    snapshot.progress.planOrder[snapshot.progress.primaryIndex] ?? "";
  return currentPrimaryId
    ? getExerciseBySessionId(snapshot, currentPrimaryId) ?? null
    : null;
}

export function getPairingForPrimary(
  snapshot: WorkoutSessionSnapshot,
  primarySessionExerciseId: string
) {
  return snapshot.progress.pairings[primarySessionExerciseId] ?? null;
}

export function getActivePairing(snapshot: WorkoutSessionSnapshot) {
  const primaryExercise = getCurrentPrimaryExercise(snapshot);
  if (!primaryExercise) return null;

  const pairing = getPairingForPrimary(
    snapshot,
    primaryExercise.sessionExerciseId
  );
  if (!pairing || pairing.status !== "active") return null;
  return pairing;
}

export function getSupersetExercise(snapshot: WorkoutSessionSnapshot) {
  const pairing = getActivePairing(snapshot);
  if (!pairing) return null;
  return getExerciseBySessionId(snapshot, pairing.supersetSessionExerciseId) ?? null;
}

export function isWorkoutComplete(snapshot: WorkoutSessionSnapshot) {
  return snapshot.progress.planOrder.every((sessionExerciseId) => {
    const pairing = snapshot.progress.pairings[sessionExerciseId];

    if (!isExerciseComplete(snapshot, sessionExerciseId)) {
      return false;
    }

    if (
      pairing &&
      pairing.status === "active" &&
      !isExerciseComplete(snapshot, pairing.supersetSessionExerciseId)
    ) {
      return false;
    }

    return true;
  });
}
