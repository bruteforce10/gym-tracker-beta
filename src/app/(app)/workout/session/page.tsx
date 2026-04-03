"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Zap, SkipForward, Timer, Check } from "lucide-react";
import { createWorkout } from "@/actions/workouts";
import { CATEGORY_GRADIENTS, type Category } from "@/data/exercises";

type SessionExercise = {
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup: string;
  type: "compound" | "isolation";
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

// ── Circular Rest Timer ──
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
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - seconds / total);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-text-muted text-sm font-medium uppercase tracking-widest">Istirahat</p>
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke="#10B981"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
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
          <Timer className="w-3.5 h-3.5" />
          +30s
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-2 rounded-xl border border-emerald/30 text-emerald text-sm font-semibold hover:bg-emerald/10 transition-colors flex items-center gap-1.5"
          id="rest-skip"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
      </div>
    </div>
  );
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [allSets, setAllSets] = useState<SetEntry[][]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [state, setState] = useState<WorkoutState>("input");
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gym-session");
    if (!raw) { router.replace("/workout/start"); return; }
    const data: SessionData = JSON.parse(raw);
    setSession(data);
    setAllSets(data.exercises.map((ex) => Array.from({ length: ex.defaultSets }, () => ({ weight: 0, reps: ex.defaultReps, done: false }))));
    setReps(String(data.exercises[0].defaultReps));
  }, [router]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startRest = useCallback((seconds: number) => {
    stopTimer();
    setRestLeft(seconds);
    setRestTotal(seconds);
    setState("resting");
    timerRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); timerRef.current = null; setState("input"); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  if (!session) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalEx = session.exercises.length;
  const currentEx = session.exercises[exIdx];
  const totalSets = currentEx.defaultSets;
  const progressPercent = ((exIdx * totalSets + setIdx) / (totalEx * totalSets)) * 100;
  const gradient = CATEGORY_GRADIENTS[currentEx.category as Category] || "from-emerald/20 to-teal-500/10";

  const handleDoneSet = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || currentEx.defaultReps;

    // Record this set
    setAllSets((prev) => {
      const next = prev.map((s) => [...s]);
      next[exIdx][setIdx] = { weight: w, reps: r, done: true };
      return next;
    });

    const isLastSet = setIdx >= totalSets - 1;
    const isLastEx = exIdx >= totalEx - 1;

    if (isLastSet && isLastEx) {
      setState("done");
      stopTimer();
      handleAutoSave(w, r);
    } else if (isLastSet) {
      const nextExIdx = exIdx + 1;
      setExIdx(nextExIdx);
      setSetIdx(0);
      setWeight("");
      setReps(String(session.exercises[nextExIdx]?.defaultReps ?? currentEx.defaultReps));
      startRest(currentEx.restTime);
    } else {
      setSetIdx((s) => s + 1);
      startRest(currentEx.restTime);
    }
  };

  const handleAutoSave = async (lastWeight: number, lastReps: number) => {
    setSaving(true);
    try {
      const exercises = session.exercises.map((ex, i) => {
        const sets = allSets[i];
        const doneSets = sets.filter((s) => s.done);
        const best = doneSets.reduce((b, s) => (s.weight > b.weight ? s : b), doneSets[0] ?? { weight: lastWeight, reps: lastReps });
        return {
          exercise: ex.name,
          weight: best.weight || lastWeight,
          reps: best.reps || lastReps,
          sets: doneSets.length || ex.defaultSets,
        };
      });
      await createWorkout(new Date().toISOString().split("T")[0], exercises);
      sessionStorage.removeItem("gym-session");
    } finally {
      setSaving(false);
    }
  };

  // Done state
  if (state === "done") {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-emerald/20 border border-emerald/30 flex items-center justify-center mx-auto">
            <Trophy className="w-12 h-12 text-emerald" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
            Sesi Selesai! 🎉
          </h1>
          <p className="text-text-muted text-sm">
            {session.exercises.length} exercise · {session.exercises.reduce((a, e) => a + e.defaultSets, 0)} set total
          </p>
          {saving && <p className="text-emerald text-sm animate-pulse">Menyimpan latihan...</p>}
        </div>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full h-14 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-bold text-base rounded-2xl transition-all"
            id="finish-session-btn"
          >
            Lihat Dashboard
          </button>
          <button
            onClick={() => router.push("/progress")}
            className="w-full h-12 border border-border-subtle text-text-muted text-sm rounded-2xl hover:border-emerald/30 hover:text-emerald transition-all"
          >
            Lihat Progres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      {/* Top progress bar */}
      <div className="w-full h-1 bg-surface-elevated">
        <div
          className="h-1 bg-emerald transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-5 flex flex-col gap-5">
        {/* Header */}
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
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <p className="text-xs text-text-muted">{session.planName}</p>
            <p className="text-sm font-semibold text-foreground">
              Exercise {exIdx + 1}/{totalEx} · Set {setIdx + 1}/{totalSets}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald" />
          </div>
        </div>

        {/* Exercise card */}
        <div className={`glass-card p-5 bg-linear-to-br ${gradient} space-y-3`}>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              {currentEx.muscleGroup}
            </span>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
              {currentEx.name}
            </h2>
          </div>

          <div className="flex gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border border-white/10 ${
              currentEx.type === "compound" ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-300"
            }`}>
              {currentEx.type === "compound" ? "Compound" : "Isolation"}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium border border-white/10 bg-emerald/10 text-emerald">
              Rest {currentEx.restTime}s
            </span>
          </div>

          {/* Set progress dots */}
          <div className="flex gap-2 pt-1">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all ${
                  i < setIdx
                    ? "bg-emerald"
                    : i === setIdx
                    ? "bg-emerald/50"
                    : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Rest timer */}
        {state === "resting" && (
          <div className="glass-card">
            <RestTimer
              seconds={restLeft}
              total={restTotal}
              onSkip={() => { stopTimer(); setState("input"); }}
              onAdd30={() => {
                setRestLeft((prev) => prev + 30);
                setRestTotal((prev) => prev + 30);
              }}
            />
          </div>
        )}

        {/* Input section */}
        {state === "input" && (
          <div className="glass-card p-4 space-y-4">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">
              Set {setIdx + 1} dari {totalSets}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted font-medium mb-1.5 block">
                  Berat (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="w-full h-14 px-3 rounded-xl bg-surface-elevated border border-border-subtle text-foreground text-2xl font-bold text-center focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-all"
                  id="set-weight-input"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium mb-1.5 block">
                  Reps
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={String(currentEx.defaultReps)}
                  className="w-full h-14 px-3 rounded-xl bg-surface-elevated border border-border-subtle text-foreground text-2xl font-bold text-center focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-all"
                  id="set-reps-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upcoming exercises */}
        {exIdx + 1 < totalEx && state !== "resting" && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Selanjutnya</p>
            <div className="space-y-1.5">
              {session.exercises.slice(exIdx + 1, exIdx + 3).map((ex, i) => (
                <div
                  key={ex.exerciseId}
                  className="glass-card px-4 py-2.5 flex items-center justify-between opacity-60"
                >
                  <div>
                    <p className="text-foreground text-xs font-semibold">{ex.name}</p>
                    <p className="text-text-muted text-[10px]">{ex.defaultSets}×{ex.defaultReps}</p>
                  </div>
                  <span className="text-text-muted text-[10px]">#{exIdx + i + 2}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Done CTA — fixed bottom */}
      {state === "input" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/6">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleDoneSet}
              className="w-full h-16 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-bold text-xl rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-3"
              id="done-set-btn"
            >
              <Check className="w-6 h-6" strokeWidth={3} />
              Set {setIdx + 1} — Done ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
