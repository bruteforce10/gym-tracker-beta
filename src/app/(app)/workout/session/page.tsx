"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  SkipForward,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";

import { createWorkout } from "@/actions/workouts";
import ExerciseImage from "@/components/exercise-image";
import { CATEGORY_GRADIENTS, type ExerciseDisplayCategory } from "@/lib/exercise-catalog";

type SessionExercise = {
  exerciseId: string;
  name: string;
  imageUrl?: string | null;
  category: ExerciseDisplayCategory | null;
  primaryLabel: string;
  trainingStyle: "compound" | "isolation";
  defaultSets: number;
  defaultReps: number;
  restTime: number;
};

type SessionData = {
  planId: string;
  planName: string;
  exercises: SessionExercise[];
};

type SetEntry = { weight: number; reps: number; done: boolean };
type WorkoutState = "input" | "resting" | "done";
const REST_ALARM_STORAGE_KEY = "gym-rest-alarm-enabled";

function RestTimer({
  seconds,
  total,
  onSkip,
  onAdd30,
}: {
  seconds: number;
  total: number;
  onSkip: () => void;
  onAdd30: () => void;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - seconds / total);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-text-muted text-sm font-medium uppercase tracking-widest">Istirahat</p>
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#10B981"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-mono text-foreground">{seconds}</span>
          <span className="text-xs text-text-muted">detik</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAdd30}
          className="px-4 py-2 rounded-xl border border-border-subtle text-text-muted text-sm hover:border-emerald/30 hover:text-emerald transition-colors flex items-center gap-1.5"
          id="rest-add30"
        >
          <Timer className="w-3.5 h-3.5" aria-hidden="true" />
          +30s
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-2 rounded-xl border border-emerald/30 text-emerald text-sm font-semibold hover:bg-emerald/10 transition-colors flex items-center gap-1.5"
          id="rest-skip"
        >
          <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
          Skip
        </button>
      </div>
    </div>
  );
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [allSets, setAllSets] = useState<SetEntry[][]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [state, setState] = useState<WorkoutState>("input");
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmEnabledRef = useRef(true);

  useEffect(() => {
    const rawSession = sessionStorage.getItem("gym-session");
    if (!rawSession) {
      router.replace("/workout/start");
      return;
    }

    const nextSession: SessionData = JSON.parse(rawSession);
    setSession(nextSession);
    setAllSets(
      nextSession.exercises.map((exercise) =>
        Array.from({ length: exercise.defaultSets }, () => ({
          weight: 0,
          reps: exercise.defaultReps,
          done: false,
        }))
      )
    );
    setReps(String(nextSession.exercises[0]?.defaultReps ?? 0));
  }, [router]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playRestFinishedAlarm = useCallback(() => {
    if (!alarmEnabledRef.current) return;

    const alarm = alarmRef.current;
    if (!alarm) return;

    alarm.currentTime = 0;
    void alarm.play().catch(() => {
      // Ignore autoplay/playback errors to keep workout flow uninterrupted.
    });
  }, []);

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

  const startRest = useCallback(
    (seconds: number) => {
      stopTimer();
      setRestLeft(seconds);
      setRestTotal(seconds);
      setState("resting");
      timerRef.current = setInterval(() => {
        setRestLeft((current) => {
          if (current <= 1) {
            stopTimer();
            setState("input");
            playRestFinishedAlarm();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    },
    [playRestFinishedAlarm, stopTimer]
  );

  useEffect(() => () => stopTimer(), [stopTimer]);

  if (!session) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalExercises = session.exercises.length;
  const currentExercise = session.exercises[exerciseIndex];
  const totalSets = currentExercise.defaultSets;
  const progressPercent =
    ((exerciseIndex * totalSets + setIndex) / (totalExercises * totalSets)) * 100;
  const gradient =
    (currentExercise.category && CATEGORY_GRADIENTS[currentExercise.category]) ||
    "from-emerald/20 to-teal-500/10";

  const handleAutoSave = async (
    nextAllSets: SetEntry[][],
    lastWeight: number,
    lastReps: number
  ) => {
    setSaving(true);
    try {
      const exercises = session.exercises.map((exercise, index) => {
        const sets = nextAllSets[index] ?? [];
        const doneSets = sets.filter((item) => item.done);
        const fallback = doneSets[0] ?? { weight: lastWeight, reps: lastReps, done: true };
        const best = doneSets.reduce(
          (currentBest, item) =>
            item.weight > currentBest.weight ? item : currentBest,
          fallback
        );

        return {
          exerciseId: exercise.exerciseId,
          weight: best.weight || lastWeight,
          reps: best.reps || lastReps,
          sets: doneSets.length || exercise.defaultSets,
        };
      });

      await createWorkout(new Date().toISOString().split("T")[0], exercises);
      sessionStorage.removeItem("gym-session");
    } finally {
      setSaving(false);
    }
  };

  const handleDoneSet = () => {
    const nextWeight = parseFloat(weight) || 0;
    const nextReps = parseInt(reps, 10) || currentExercise.defaultReps;

    const nextAllSets = allSets.map((sets) => [...sets]);
    nextAllSets[exerciseIndex][setIndex] = {
      weight: nextWeight,
      reps: nextReps,
      done: true,
    };
    setAllSets(nextAllSets);

    const isLastSet = setIndex >= totalSets - 1;
    const isLastExercise = exerciseIndex >= totalExercises - 1;

    if (isLastSet && isLastExercise) {
      setState("done");
      stopTimer();
      void handleAutoSave(nextAllSets, nextWeight, nextReps);
      return;
    }

    if (isLastSet) {
      const nextExerciseIndex = exerciseIndex + 1;
      setExerciseIndex(nextExerciseIndex);
      setSetIndex(0);
      setWeight("");
      setReps(String(session.exercises[nextExerciseIndex]?.defaultReps ?? currentExercise.defaultReps));
      startRest(currentExercise.restTime);
      return;
    }

    setSetIndex((current) => current + 1);
    startRest(currentExercise.restTime);
  };

  if (state === "done") {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-emerald/20 border border-emerald/30 flex items-center justify-center mx-auto">
            <Trophy className="w-12 h-12 text-emerald" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
            Sesi Selesai! 🎉
          </h1>
          <p className="text-text-muted text-sm">
            {session.exercises.length} exercise · {session.exercises.reduce((total, exercise) => total + exercise.defaultSets, 0)} set total
          </p>
          {saving && <p className="text-emerald text-sm animate-pulse">Menyimpan latihan…</p>}
        </div>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full h-14 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-bold text-base rounded-2xl transition-colors"
            id="finish-session-btn"
          >
            Lihat Dashboard
          </button>
          <button
            onClick={() => router.push("/progress")}
            className="w-full h-12 border border-border-subtle text-text-muted text-sm rounded-2xl hover:border-emerald/30 hover:text-emerald transition-colors"
          >
            Lihat Progres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <div className="w-full h-1 bg-surface-elevated">
        <div
          className="h-1 bg-emerald transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Keluar dari sesi ini?")) {
                stopTimer();
                sessionStorage.removeItem("gym-session");
                router.back();
              }
            }}
            className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center"
            id="exit-session-btn"
            aria-label="Keluar dari sesi latihan"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>
          <div className="text-center">
            <p className="text-xs text-text-muted">{session.planName}</p>
            <p className="text-sm font-semibold text-foreground">
              Exercise {exerciseIndex + 1}/{totalExercises} · Set {setIndex + 1}/{totalSets}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAlarmEnabled((current) => !current)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
              alarmEnabled
                ? "bg-emerald/10 border-emerald/30 text-emerald"
                : "bg-surface-elevated border-border-subtle text-text-muted"
            }`}
            id="toggle-session-alarm"
            aria-pressed={alarmEnabled}
            aria-label={alarmEnabled ? "Matikan suara alarm" : "Nyalakan suara alarm"}
            title={alarmEnabled ? "Suara alarm aktif" : "Suara alarm nonaktif"}
          >
            {alarmEnabled ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className={`glass-card p-5 bg-linear-to-br ${gradient} space-y-3`}>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              {currentExercise.primaryLabel}
            </span>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
              {currentExercise.name}
            </h2>
          </div>

          <div className="flex gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium border border-white/10 ${
                currentExercise.trainingStyle === "compound"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {currentExercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium border border-white/10 bg-emerald/10 text-emerald">
              Rest {currentExercise.restTime}s
            </span>
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

          <div className="flex gap-2 pt-1">
            {Array.from({ length: totalSets }).map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index < setIndex
                    ? "bg-emerald"
                    : index === setIndex
                    ? "bg-emerald/50"
                    : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>
        </div>

        {state === "resting" && (
          <div className="glass-card">
            <RestTimer
              seconds={restLeft}
              total={restTotal}
              onSkip={() => {
                stopTimer();
                setState("input");
              }}
              onAdd30={() => {
                setRestLeft((current) => current + 30);
                setRestTotal((current) => current + 30);
              }}
            />
          </div>
        )}

        {state === "input" && (
          <div className="glass-card p-4 space-y-4">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">
              Set {setIndex + 1} dari {totalSets}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="set-weight-input" className="text-xs text-text-muted font-medium mb-1.5 block">
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
                  className="w-full h-14 px-3 rounded-xl bg-surface-elevated border border-border-subtle text-foreground text-2xl font-bold text-center focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="set-reps-input" className="text-xs text-text-muted font-medium mb-1.5 block">
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
                  className="w-full h-14 px-3 rounded-xl bg-surface-elevated border border-border-subtle text-foreground text-2xl font-bold text-center focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleDoneSet}
              className="w-full h-12 rounded-xl bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold transition-[transform,background-color] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Selesaikan Set
            </button>
          </div>
        )}

        {exerciseIndex + 1 < totalExercises && state !== "resting" && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Selanjutnya</p>
            <div className="space-y-1.5">
              {session.exercises.slice(exerciseIndex + 1, exerciseIndex + 3).map((exercise, index) => (
                <div
                  key={exercise.exerciseId}
                  className="glass-card px-4 py-2.5 flex items-center justify-between opacity-60"
                >
                  <div>
                    <p className="text-foreground text-xs font-semibold">{exercise.name}</p>
                    <p className="text-text-muted text-[10px]">
                      {exercise.defaultSets}×{exercise.defaultReps}
                    </p>
                  </div>
                  <span className="text-text-muted text-[10px]">#{exerciseIndex + index + 2}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
