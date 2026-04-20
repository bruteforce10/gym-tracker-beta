"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  HeartPulse,
  SkipForward,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { createWorkout } from "@/actions/workouts";
import SupersetPickerSheet from "@/components/superset-picker-sheet";
import ExerciseImage from "@/components/exercise-image";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_GRADIENTS,
  type ExerciseDisplayCategory,
} from "@/lib/exercise-catalog";
import {
  buildSessionExercise,
  buildStoredSessionSnapshot,
  createInitialSetEntries,
  getActivePairing,
  getCompletedSetCount,
  getCurrentPrimaryExercise,
  getExerciseBySessionId,
  getNextSetIndex,
  getPairingForPrimary,
  getSetsForExercise,
  getSupersetExercise,
  isExerciseComplete,
  isWorkoutComplete,
  type ActiveTurn,
  type SessionExercise,
  type WorkoutState,
  type WorkoutSessionSnapshot,
  WORKOUT_SESSION_STORAGE_KEY,
} from "@/lib/workout-session";

const REST_ALARM_STORAGE_KEY = "gym-rest-alarm-enabled";

function RestTimer({
  seconds,
  total,
  mode,
  targetExerciseName,
  onSkip,
  onAdd30,
}: {
  seconds: number;
  total: number;
  mode: "transition" | "normal";
  targetExerciseName?: string | null;
  onSkip: () => void;
  onAdd30: () => void;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - seconds / total);
  const accentClass =
    mode === "transition" ? "text-amber-300" : "text-emerald";
  const stroke = mode === "transition" ? "#F59E0B" : "#10B981";

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
          {mode === "transition" ? "Transisi Superset" : "Istirahat"}
        </p>
        <p className={`mt-2 text-sm font-medium ${accentClass}`}>
          {mode === "transition"
            ? `10 detik lalu pindah ke ${targetExerciseName ?? "pasangan superset"}`
            : "Ambil napas sebelum lanjut set berikutnya"}
        </p>
      </div>

      <div className="relative h-40 w-40">
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={stroke}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-bold text-foreground">{seconds}</span>
          <span className="text-xs text-text-muted">detik</span>
        </div>
      </div>

      <div className="flex gap-3">
        {mode === "normal" ? (
          <button
            onClick={onAdd30}
            className="flex items-center gap-1.5 rounded-xl border border-border-subtle px-4 py-2 text-sm text-text-muted transition-colors hover:border-emerald/30 hover:text-emerald"
            id="rest-add30"
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            +30s
          </button>
        ) : null}
        <button
          onClick={onSkip}
          className={`flex items-center gap-1.5 rounded-xl border px-6 py-2 text-sm font-semibold transition-colors ${
            mode === "transition"
              ? "border-amber-300/30 text-amber-300 hover:bg-amber-300/10"
              : "border-emerald/30 text-emerald hover:bg-emerald/10"
          }`}
          id="rest-skip"
        >
          <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  );
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<WorkoutSessionSnapshot | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmEnabledRef = useRef(true);

  useEffect(() => {
    const nextSnapshot = buildStoredSessionSnapshot(
      sessionStorage.getItem(WORKOUT_SESSION_STORAGE_KEY)
    );

    if (!nextSnapshot) {
      router.replace("/workout/start");
      return;
    }

    const startedAtValue = new Date(nextSnapshot.startedAt);
    if (Number.isNaN(startedAtValue.getTime())) {
      sessionStorage.removeItem(WORKOUT_SESSION_STORAGE_KEY);
      router.replace("/workout/start");
      return;
    }

    setSnapshot(nextSnapshot);
    setElapsedSeconds(
      Math.max(0, Math.floor((Date.now() - startedAtValue.getTime()) / 1000))
    );
  }, [router]);

  useEffect(() => {
    if (!snapshot) return;
    sessionStorage.setItem(WORKOUT_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  }, [snapshot]);

  const startedAt = snapshot?.startedAt;

  useEffect(() => {
    if (!startedAt) return;

    const startedAtValue = new Date(startedAt);
    if (Number.isNaN(startedAtValue.getTime())) return;

    const updateElapsed = () => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startedAtValue.getTime()) / 1000))
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    const alarm = new Audio("/alarms/alarm.mp3");
    alarm.preload = "auto";
    alarmRef.current = alarm;

    return () => {
      alarm.pause();
      alarmRef.current = null;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(REST_ALARM_STORAGE_KEY);
    if (saved === "0") {
      setAlarmEnabled(false);
      alarmEnabledRef.current = false;
      return;
    }
    if (saved === "1") {
      setAlarmEnabled(true);
      alarmEnabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    alarmEnabledRef.current = alarmEnabled;
    localStorage.setItem(REST_ALARM_STORAGE_KEY, alarmEnabled ? "1" : "0");
  }, [alarmEnabled]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const playRestFinishedAlarm = useCallback(() => {
    if (!alarmEnabledRef.current) return;

    const alarm = alarmRef.current;
    if (!alarm) return;

    alarm.currentTime = 0;
    void alarm.play().catch(() => {
      // Keep the workout flow running even if playback fails.
    });
  }, []);

  const activateQueuedTurn = useCallback(
    (current: WorkoutSessionSnapshot): WorkoutSessionSnapshot => {
      const queuedTurn = current.progress.queuedTurn ?? current.progress.activeTurn;
      const nextState: WorkoutState =
        queuedTurn.lane === "superset" ? "input-superset" : "input-primary";

      return {
        ...current,
        progress: {
          ...current.progress,
          activeTurn: queuedTurn,
          queuedTurn: null,
          restLeft: 0,
          restTotal: 0,
          restKind: null,
          state: nextState,
        },
      };
    },
    []
  );

  const beginRest = useCallback(
    (
      baseSnapshot: WorkoutSessionSnapshot,
      seconds: number,
      nextTurn: ActiveTurn,
      mode: "transition" | "normal"
    ) => {
      stopTimer();

      setSnapshot({
        ...baseSnapshot,
        progress: {
          ...baseSnapshot.progress,
          queuedTurn: nextTurn,
          restLeft: seconds,
          restTotal: seconds,
          restKind: mode,
          state:
            mode === "transition"
              ? ("rest-transition" as const)
              : ("rest-normal" as const),
        },
      });

      timerRef.current = setInterval(() => {
        let shouldPlay = false;

        setSnapshot((current) => {
          if (!current) return current;

          if (current.progress.restLeft <= 1) {
            stopTimer();
            shouldPlay = true;
            return activateQueuedTurn(current);
          }

          return {
            ...current,
            progress: {
              ...current.progress,
              restLeft: current.progress.restLeft - 1,
            },
          };
        });

        if (shouldPlay) {
          playRestFinishedAlarm();
        }
      }, 1000);
    },
    [activateQueuedTurn, playRestFinishedAlarm, stopTimer]
  );

  const formatElapsedTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hoursLabel = String(hours).padStart(2, "0");
    const minutesLabel = String(minutes).padStart(2, "0");
    const secondsLabel = String(seconds).padStart(2, "0");

    return hours > 0
      ? `${hoursLabel}:${minutesLabel}:${secondsLabel}`
      : `${minutesLabel}:${secondsLabel}`;
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    if (
      snapshot.progress.state !== "input-primary" &&
      snapshot.progress.state !== "input-superset"
    ) {
      return;
    }

    const currentExercise = getExerciseBySessionId(
      snapshot,
      snapshot.progress.activeTurn.sessionExerciseId
    );
    if (!currentExercise) return;

    const completedSets = getSetsForExercise(
      snapshot,
      currentExercise.sessionExerciseId
    ).filter((set) => set.done);
    const latestSet = completedSets.at(-1);

    setWeight(
      latestSet && latestSet.weight > 0 ? String(latestSet.weight) : ""
    );
    setReps(String(latestSet?.reps ?? currentExercise.defaultReps));
  }, [
    snapshot?.progress.activeTurn.sessionExerciseId,
    snapshot?.progress.state,
    snapshot,
  ]);

  const handleAutoSave = useCallback(
    async (finishedSnapshot: WorkoutSessionSnapshot) => {
      setSaving(true);
      setSaveError(null);

      try {
        const exercises = finishedSnapshot.exercises.flatMap((exercise) =>
          getSetsForExercise(finishedSnapshot, exercise.sessionExerciseId)
            .filter((item) => item.done)
            .map((item) => ({
              exerciseId: exercise.exerciseId,
              weight: item.weight,
              reps: item.reps,
              sets: 1,
            }))
        );

        if (exercises.length === 0) {
          throw new Error("Tidak ada set yang selesai untuk disimpan.");
        }

        await createWorkout(
          new Date(finishedSnapshot.startedAt).toISOString().split("T")[0],
          exercises,
          finishedSnapshot.startedAt,
          new Date().toISOString()
        );

        sessionStorage.removeItem(WORKOUT_SESSION_STORAGE_KEY);
      } catch {
        setSaveError("Sesi selesai, tapi penyimpanan workout gagal. Data sesi tetap disimpan.");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleConfirmSuperset = useCallback(
    (exercise: {
      id: string;
      name: string;
      imageUrl: string | null;
      category: ExerciseDisplayCategory | null;
      primaryLabel: string;
      trainingStyle: "compound" | "isolation";
      defaultSets: number;
      defaultReps: number;
      defaultRestTime: number;
    }) => {
      if (!snapshot) return;

      const primaryExercise = getCurrentPrimaryExercise(snapshot);
      if (!primaryExercise) return;

      if (exercise.id === primaryExercise.exerciseId) {
        return;
      }

      const existingPairing = getPairingForPrimary(
        snapshot,
        primaryExercise.sessionExerciseId
      );

      if (
        existingPairing &&
        existingPairing.status === "active" &&
        !confirm("Superset aktif akan diganti. Lanjutkan?")
      ) {
        return;
      }

      const supersetExercise = buildSessionExercise(exercise, {
        source: "dynamic-superset",
      });

      setSnapshot((current) => {
        if (!current) return current;

        const primaryId =
          getCurrentPrimaryExercise(current)?.sessionExerciseId ??
          primaryExercise.sessionExerciseId;
        const nextPairings = { ...current.progress.pairings };

        if (existingPairing?.status === "active") {
          nextPairings[primaryId] = {
            ...existingPairing,
            status: "cancelled",
          };
        }

        nextPairings[primaryId] = {
          primarySessionExerciseId: primaryId,
          supersetSessionExerciseId: supersetExercise.sessionExerciseId,
          transitionRestSeconds: 10,
          status: "active",
        };

        return {
          ...current,
          exercises: [...current.exercises, supersetExercise],
          progress: {
            ...current.progress,
            pairings: nextPairings,
            allSets: {
              ...current.progress.allSets,
              [supersetExercise.sessionExerciseId]:
                createInitialSetEntries(supersetExercise),
            },
          },
        };
      });

      setPickerOpen(false);
    },
    [snapshot]
  );

  const handleCancelSuperset = useCallback(() => {
    if (!snapshot) return;

    const primaryExercise = getCurrentPrimaryExercise(snapshot);
    const activePairing = getActivePairing(snapshot);
    if (!primaryExercise || !activePairing) return;

    stopTimer();

    setSnapshot((current) => {
      if (!current) return current;

      const latestPrimary =
        getCurrentPrimaryExercise(current)?.sessionExerciseId ??
        primaryExercise.sessionExerciseId;
      const pairing = current.progress.pairings[latestPrimary];
      if (!pairing || pairing.status !== "active") return current;

      return {
        ...current,
        progress: {
          ...current.progress,
          pairings: {
            ...current.progress.pairings,
            [latestPrimary]: {
              ...pairing,
              status: "cancelled",
            },
          },
          activeTurn: {
            sessionExerciseId: latestPrimary,
            lane: "primary",
          },
          queuedTurn: null,
          restLeft: 0,
          restTotal: 0,
          restKind: null,
          state: "input-primary" as const,
        },
      };
    });
  }, [snapshot, stopTimer]);

  const handleDoneSet = useCallback(() => {
    if (!snapshot) return;

    const currentExercise = getExerciseBySessionId(
      snapshot,
      snapshot.progress.activeTurn.sessionExerciseId
    );
    const primaryExercise = getCurrentPrimaryExercise(snapshot);

    if (!currentExercise || !primaryExercise) return;

    const currentSetIndex = getNextSetIndex(
      snapshot,
      currentExercise.sessionExerciseId
    );
    const nextWeight = parseFloat(weight) || 0;
    const nextReps = parseInt(reps, 10) || currentExercise.defaultReps;

    const nextSnapshot: WorkoutSessionSnapshot = {
      ...snapshot,
      progress: {
        ...snapshot.progress,
        allSets: {
          ...snapshot.progress.allSets,
          [currentExercise.sessionExerciseId]: snapshot.progress.allSets[
            currentExercise.sessionExerciseId
          ].map((set, index) =>
            index === currentSetIndex
              ? {
                  weight: nextWeight,
                  reps: nextReps,
                  done: true,
                }
              : set
          ),
        },
      },
    };

    const pairing = getPairingForPrimary(
      nextSnapshot,
      primaryExercise.sessionExerciseId
    );
    const supersetExercise =
      pairing && pairing.status === "active"
        ? getExerciseBySessionId(nextSnapshot, pairing.supersetSessionExerciseId)
        : null;
    const primaryComplete = isExerciseComplete(
      nextSnapshot,
      primaryExercise.sessionExerciseId
    );
    const supersetComplete = supersetExercise
      ? isExerciseComplete(nextSnapshot, supersetExercise.sessionExerciseId)
      : true;

    let resolvedSnapshot = nextSnapshot;

    if (pairing && pairing.status === "active" && supersetComplete) {
      resolvedSnapshot = {
        ...resolvedSnapshot,
        progress: {
          ...resolvedSnapshot.progress,
          pairings: {
            ...resolvedSnapshot.progress.pairings,
            [primaryExercise.sessionExerciseId]: {
              ...pairing,
              status: "completed",
            },
          },
        },
      };
    }

    const isOnPrimaryLane = snapshot.progress.activeTurn.lane === "primary";

    if (isOnPrimaryLane && pairing && pairing.status === "active" && !supersetComplete) {
      beginRest(
        resolvedSnapshot,
        pairing.transitionRestSeconds,
        {
          sessionExerciseId: pairing.supersetSessionExerciseId,
          lane: "superset",
        },
        "transition"
      );
      return;
    }

    if (!isOnPrimaryLane) {
      if (pairing && pairing.status === "active" && supersetComplete) {
        resolvedSnapshot = {
          ...resolvedSnapshot,
          progress: {
            ...resolvedSnapshot.progress,
            pairings: {
              ...resolvedSnapshot.progress.pairings,
              [primaryExercise.sessionExerciseId]: {
                ...pairing,
                status: "completed",
              },
            },
          },
        };
      }

      if (!supersetComplete) {
        beginRest(
          resolvedSnapshot,
          currentExercise.restTime,
          {
            sessionExerciseId: primaryComplete
              ? currentExercise.sessionExerciseId
              : primaryExercise.sessionExerciseId,
            lane: primaryComplete ? "superset" : "primary",
          },
          "normal"
        );
        return;
      }
    }

    if (!primaryComplete) {
      beginRest(
        resolvedSnapshot,
        currentExercise.restTime,
        {
          sessionExerciseId: primaryExercise.sessionExerciseId,
          lane: "primary",
        },
        "normal"
      );
      return;
    }

    const nextPrimaryIndex = snapshot.progress.primaryIndex + 1;
    const nextPrimaryId = snapshot.progress.planOrder[nextPrimaryIndex];

    if (!nextPrimaryId) {
      const finishedSnapshot = {
        ...resolvedSnapshot,
        progress: {
          ...resolvedSnapshot.progress,
          queuedTurn: null,
          restLeft: 0,
          restTotal: 0,
          restKind: null,
          state: "done" as const,
        },
      };

      stopTimer();
      setSnapshot(finishedSnapshot);
      void handleAutoSave(finishedSnapshot);
      return;
    }

    const advancedSnapshot = {
      ...resolvedSnapshot,
      progress: {
        ...resolvedSnapshot.progress,
        primaryIndex: nextPrimaryIndex,
      },
    };

    beginRest(
      advancedSnapshot,
      currentExercise.restTime,
      {
        sessionExerciseId: nextPrimaryId,
        lane: "primary",
      },
      "normal"
    );
  }, [beginRest, handleAutoSave, reps, snapshot, stopTimer, weight]);

  const currentExercise = snapshot
    ? getExerciseBySessionId(snapshot, snapshot.progress.activeTurn.sessionExerciseId)
    : null;
  const currentPrimaryExercise = snapshot ? getCurrentPrimaryExercise(snapshot) : null;
  const activePairing = snapshot ? getActivePairing(snapshot) : null;
  const activeSupersetExercise = snapshot ? getSupersetExercise(snapshot) : null;

  const progressPercent = useMemo(() => {
    if (!snapshot) return 0;

    const totalSets = snapshot.exercises.reduce(
      (total, exercise) => total + exercise.defaultSets,
      0
    );
    const completedSets = snapshot.exercises.reduce(
      (total, exercise) =>
        total + getCompletedSetCount(snapshot, exercise.sessionExerciseId),
      0
    );

    return totalSets === 0 ? 0 : (completedSets / totalSets) * 100;
  }, [snapshot]);

  const currentSetIndex =
    snapshot && currentExercise
      ? getNextSetIndex(snapshot, currentExercise.sessionExerciseId)
      : 0;
  const currentCompletedSets =
    snapshot && currentExercise
      ? getCompletedSetCount(snapshot, currentExercise.sessionExerciseId)
      : 0;
  const currentTotalSets = currentExercise?.defaultSets ?? 0;
  const currentGradient =
    (currentExercise?.category &&
      CATEGORY_GRADIENTS[currentExercise.category]) ||
    "from-emerald/20 to-teal-500/10";

  const nextPlanExercises =
    snapshot && currentPrimaryExercise
      ? snapshot.progress.planOrder
          .slice(snapshot.progress.primaryIndex + 1, snapshot.progress.primaryIndex + 3)
          .map((sessionExerciseId) =>
            getExerciseBySessionId(snapshot, sessionExerciseId)
          )
          .filter(Boolean) as SessionExercise[]
      : [];

  const canAddSuperset =
    snapshot?.progress.state === "input-primary" &&
    Boolean(currentPrimaryExercise);

  if (!snapshot || !currentExercise || !currentPrimaryExercise) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-mesh">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald border-t-transparent" />
      </div>
    );
  }

  if (snapshot.progress.state === "done") {
    return (
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center gap-8 px-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald/30 bg-emerald/20">
            <Trophy className="h-12 w-12 text-emerald" aria-hidden="true" />
          </div>
          <h1
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Sesi Selesai!
          </h1>
          <p className="text-sm text-text-muted">
            {snapshot.exercises.length} exercise ·{" "}
            {snapshot.exercises.reduce((total, exercise) => total + exercise.defaultSets, 0)} set
          </p>
          {saving ? (
            <p className="text-sm text-emerald animate-pulse">Menyimpan workout...</p>
          ) : null}
          {saveError ? (
            <p className="mx-auto max-w-sm rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {saveError}
            </p>
          ) : null}
        </div>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-14 w-full rounded-2xl bg-emerald text-base font-bold text-[#0A0A0F] transition-colors hover:bg-emerald-dark"
            id="finish-session-btn"
          >
            Lihat Dashboard
          </button>
          <button
            onClick={() => router.push("/progress")}
            className="h-12 w-full rounded-2xl border border-border-subtle text-sm text-text-muted transition-colors hover:border-emerald/30 hover:text-emerald"
          >
            Lihat Progres
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col gradient-mesh">
        <div className="h-1 w-full bg-surface-elevated">
          <div
            className="h-1 bg-emerald transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm("Keluar dari sesi ini?")) {
                  stopTimer();
                  sessionStorage.removeItem(WORKOUT_SESSION_STORAGE_KEY);
                  router.back();
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-elevated"
              id="exit-session-btn"
              aria-label="Keluar dari sesi latihan"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-xs text-text-muted">{snapshot.planName}</p>
              <p className="text-sm font-semibold text-foreground">
                Exercise {snapshot.progress.primaryIndex + 1}/{snapshot.progress.planOrder.length} ·
                Set {Math.min(currentCompletedSets + 1, currentTotalSets)}/{currentTotalSets}
              </p>
            </div>

            <div className="inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-surface-elevated px-3 py-2">
              <Timer className="h-4 w-4 text-emerald" aria-hidden="true" />
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatElapsedTime(elapsedSeconds)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAlarmEnabled((current) => !current)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                alarmEnabled
                  ? "border-emerald/30 bg-emerald/10 text-emerald"
                  : "border-border-subtle bg-surface-elevated text-text-muted"
              }`}
              id="toggle-session-alarm"
              aria-pressed={alarmEnabled}
              aria-label={alarmEnabled ? "Matikan suara alarm" : "Nyalakan suara alarm"}
              title={alarmEnabled ? "Suara alarm aktif" : "Suara alarm nonaktif"}
            >
              {alarmEnabled ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className={`glass-card space-y-4 bg-linear-to-br p-5 ${currentGradient}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {currentExercise.primaryLabel}
                </span>
                <h2
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {currentExercise.name}
                </h2>
              </div>
              <Badge
                variant="outline"
                className={
                  snapshot.progress.activeTurn.lane === "superset"
                    ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                    : "border-emerald/25 bg-emerald/10 text-emerald"
                }
              >
                {snapshot.progress.activeTurn.lane === "superset"
                  ? "Lane: Superset"
                  : "Lane: Primary"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  currentExercise.trainingStyle === "compound"
                    ? "border-blue-400/20 bg-blue-400/10 text-blue-200"
                    : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                }
              >
                {currentExercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-text-muted">
                Rest {currentExercise.restTime}s
              </Badge>
              {activePairing && activeSupersetExercise ? (
                <Badge variant="outline" className="border-amber-300/25 bg-amber-300/10 text-amber-200">
                  Pair: {currentPrimaryExercise.name} + {activeSupersetExercise.name}
                </Badge>
              ) : null}
            </div>

            {currentExercise.imageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/90">
                <ExerciseImage
                  src={currentExercise.imageUrl}
                  alt={currentExercise.name}
                  width={1200}
                  height={750}
                  className="h-44 w-full object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 420px"
                  fallback={null}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <p className="font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Progress Set
                </p>
                <p className="font-mono font-semibold text-foreground">
                  {currentCompletedSets}/{currentTotalSets}
                </p>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: currentTotalSets }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-3 flex-1 rounded-full transition-colors ${
                      index < currentCompletedSets
                        ? "bg-emerald"
                        : index === currentSetIndex
                          ? "bg-emerald/65"
                          : "bg-[#1B1E29]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {activePairing && activeSupersetExercise ? (
            <div className="glass-card space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    Superset Aktif
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Pindah bergantian sampai kedua lane selesai
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSuperset}
                  className="inline-flex items-center gap-1 rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-[11px] font-semibold text-danger transition-colors hover:bg-danger/15"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Batalkan
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  currentPrimaryExercise,
                  activeSupersetExercise,
                ].map((exercise, index) => {
                  const completed = getCompletedSetCount(
                    snapshot,
                    exercise.sessionExerciseId
                  );

                  return (
                    <div
                      key={exercise.sessionExerciseId}
                      className={`rounded-2xl border p-3 ${
                        snapshot.progress.activeTurn.sessionExerciseId ===
                        exercise.sessionExerciseId
                          ? "border-emerald/30 bg-emerald/10"
                          : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                        {index === 0 ? "Primary" : "Superset"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {exercise.name}
                      </p>
                      <p className="mt-2 text-[11px] text-text-muted">
                        Sisa {Math.max(exercise.defaultSets - completed, 0)} dari{" "}
                        {exercise.defaultSets} set
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(snapshot.progress.state === "rest-transition" ||
            snapshot.progress.state === "rest-normal") && (
            <div className="glass-card">
              <RestTimer
                seconds={snapshot.progress.restLeft}
                total={snapshot.progress.restTotal}
                mode={snapshot.progress.restKind ?? "normal"}
                targetExerciseName={
                  snapshot.progress.queuedTurn
                    ? getExerciseBySessionId(
                        snapshot,
                        snapshot.progress.queuedTurn.sessionExerciseId
                      )?.name
                    : null
                }
                onSkip={() => {
                  stopTimer();
                  setSnapshot((current) =>
                    current ? activateQueuedTurn(current) : current
                  );
                }}
                onAdd30={() => {
                  if (snapshot.progress.restKind !== "normal") return;

                  setSnapshot((current) =>
                    current
                      ? {
                          ...current,
                          progress: {
                            ...current.progress,
                            restLeft: current.progress.restLeft + 30,
                            restTotal: current.progress.restTotal + 30,
                          },
                        }
                      : current
                  );
                }}
              />
            </div>
          )}

          {(snapshot.progress.state === "input-primary" ||
            snapshot.progress.state === "input-superset") && (
            <div className="glass-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Set {Math.min(currentCompletedSets + 1, currentTotalSets)} dari {currentTotalSets}
                </p>
                {canAddSuperset ? (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-300/15"
                  >
                    <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
                    Tambah Superset
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="set-weight-input"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Berat (kg)
                  </label>
                  <input
                    id="set-weight-input"
                    name="set-weight-input"
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder="0"
                    className="h-14 w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 text-center text-2xl font-bold text-foreground transition-colors focus:border-emerald/50 focus:ring-2 focus:ring-emerald/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-reps-input"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Reps
                  </label>
                  <input
                    id="set-reps-input"
                    name="set-reps-input"
                    type="number"
                    inputMode="numeric"
                    value={reps}
                    onChange={(event) => setReps(event.target.value)}
                    placeholder={String(currentExercise.defaultReps)}
                    className="h-14 w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 text-center text-2xl font-bold text-foreground transition-colors focus:border-emerald/50 focus:ring-2 focus:ring-emerald/30"
                  />
                </div>
              </div>

              <button
                onClick={handleDoneSet}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-semibold text-[#0A0A0F] transition-[transform,background-color] hover:bg-emerald-dark active:scale-[0.98]"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Selesaikan Set
              </button>
            </div>
          )}

          {nextPlanExercises.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Setelah Itu
              </p>
              <div className="space-y-1.5">
                {nextPlanExercises.map((exercise, index) => (
                  <div
                    key={exercise.sessionExerciseId}
                    className="glass-card flex items-center justify-between px-4 py-2.5 opacity-70"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{exercise.name}</p>
                      <p className="text-[10px] text-text-muted">
                        {exercise.defaultSets}×{exercise.defaultReps}
                      </p>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      #{snapshot.progress.primaryIndex + index + 2}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isWorkoutComplete(snapshot) && saving ? (
            <div className="glass-card border border-emerald/20 bg-emerald/10 px-4 py-3 text-sm text-emerald">
              Menutup sesi dan menyimpan hasil workout...
            </div>
          ) : null}
        </div>
      </div>

      <SupersetPickerSheet
        open={pickerOpen}
        primaryExerciseName={currentPrimaryExercise.name}
        planBucket={currentPrimaryExercise.category === null ? "all" : undefined}
        onOpenChange={setPickerOpen}
        onConfirm={handleConfirmSuperset}
      />
    </>
  );
}
