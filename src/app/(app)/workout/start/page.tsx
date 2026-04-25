"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Layers2,
  Search,
  Settings2,
} from "lucide-react";

import type { FavoriteAwareExerciseItem } from "@/actions/exercises";
import { getWorkoutPlans } from "@/actions/plans";
import FreeWorkoutExerciseBrowser from "@/components/free-workout-exercise-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
  type ExerciseDisplayCategory,
} from "@/lib/exercise-catalog";
import { buildSessionExercise, WORKOUT_SESSION_STORAGE_KEY } from "@/lib/workout-session";

type PlanExercise = {
  id: string;
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  supersetWithNext: boolean;
  order: number;
  exercise: ExerciseCatalogItem;
};

type Plan = {
  id: string;
  name: string;
  type: string;
  exercises: PlanExercise[];
};

type StartMode = "plan" | "free";
type Step = "choose-mode" | "choose-plan" | "choose-plan-exercises" | "choose-free-exercises";
type EditableFreeExercise = FavoriteAwareExerciseItem & {
  defaultSets: number;
  defaultReps: number;
  defaultRestTime: number;
};

export default function WorkoutStartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [mode, setMode] = useState<StartMode>(preselectedPlanId ? "plan" : "plan");
  const [step, setStep] = useState<Step>(preselectedPlanId ? "choose-plan-exercises" : "choose-mode");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPlanExerciseIds, setSelectedPlanExerciseIds] = useState<Set<string>>(new Set());
  const [selectedFreeExercises, setSelectedFreeExercises] = useState<EditableFreeExercise[]>([]);
  const [editingFreeExerciseId, setEditingFreeExerciseId] = useState<string | null>(null);
  const [editorSets, setEditorSets] = useState("");
  const [editorReps, setEditorReps] = useState("");
  const [editorRest, setEditorRest] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getWorkoutPlans();
      if (cancelled) return;

      setPlans(data);

      if (preselectedPlanId) {
        const plan = data.find((item) => item.id === preselectedPlanId);
        if (plan) {
          setSelectedPlan(plan);
          setSelectedPlanExerciseIds(
            new Set(plan.exercises.map((exercise) => exercise.exerciseId))
          );
        }
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [preselectedPlanId]);

  const togglePlanExercise = (id: string) => {
    setSelectedPlanExerciseIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const freeSelectedIds = new Set(selectedFreeExercises.map((exercise) => exercise.id));

  const toggleFreeExercise = (exercise: FavoriteAwareExerciseItem) => {
    setSelectedFreeExercises((current) => {
      const exists = current.some((item) => item.id === exercise.id);
      if (exists) {
        return current.filter((item) => item.id !== exercise.id);
      }

      return [
        ...current,
        {
          ...exercise,
          defaultSets: exercise.defaultSets,
          defaultReps: exercise.defaultReps,
          defaultRestTime: exercise.defaultRestTime,
        },
      ];
    });
  };

  const editingFreeExercise =
    selectedFreeExercises.find((exercise) => exercise.id === editingFreeExerciseId) ?? null;

  const handleOpenFreeEditor = (exerciseId: string) => {
    const item = selectedFreeExercises.find((exercise) => exercise.id === exerciseId);
    if (!item) return;

    setEditingFreeExerciseId(exerciseId);
    setEditorSets(String(item.defaultSets));
    setEditorReps(String(item.defaultReps));
    setEditorRest(String(item.defaultRestTime));
  };

  const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    return parsed;
  };

  const handleSaveFreeEditor = () => {
    if (!editingFreeExercise) return;

    setSelectedFreeExercises((current) =>
      current.map((exercise) =>
        exercise.id === editingFreeExercise.id
          ? {
              ...exercise,
              defaultSets: parsePositiveInt(editorSets, exercise.defaultSets),
              defaultReps: parsePositiveInt(editorReps, exercise.defaultReps),
              defaultRestTime: parsePositiveInt(editorRest, exercise.defaultRestTime),
            }
          : exercise
      )
    );
    setEditingFreeExerciseId(null);
  };

  const handleStartPlan = () => {
    if (!selectedPlan || selectedPlanExerciseIds.size === 0) return;
    const startedAt = new Date().toISOString();

    const sessionData = {
      sessionSource: "plan" as const,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      startedAt,
      exercises: selectedPlan.exercises
        .filter((exercise) => selectedPlanExerciseIds.has(exercise.exerciseId))
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          ...buildSessionExercise(exercise.exercise, { source: "plan" }),
          defaultSets: exercise.defaultSets,
          defaultReps: exercise.defaultReps,
          restTime: exercise.restTime,
          supersetWithNext: exercise.supersetWithNext,
          source: "plan" as const,
        })),
    };

    sessionStorage.setItem(WORKOUT_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    router.push("/workout/session");
  };

  const handleStartFree = () => {
    if (selectedFreeExercises.length === 0) return;
    const startedAt = new Date().toISOString();

    const sessionData = {
      sessionSource: "free" as const,
      planId: null,
      planName: "Free Workout",
      startedAt,
      exercises: selectedFreeExercises.map((exercise) => ({
        ...buildSessionExercise(exercise, {
          source: "free",
        }),
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        restTime: exercise.defaultRestTime,
      })),
    };

    sessionStorage.setItem(WORKOUT_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    router.push("/workout/session");
  };

  const handleBack = () => {
    if (step === "choose-plan-exercises") {
      setStep(preselectedPlanId ? "choose-plan" : "choose-plan");
      return;
    }

    if (step === "choose-free-exercises" || step === "choose-plan") {
      if (preselectedPlanId) {
        router.back();
        return;
      }

      setStep("choose-mode");
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-mesh">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090D] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.14),transparent_22%),linear-gradient(180deg,#0a0d11_0%,#07090d_50%,#05070a_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/35"
            id="back-btn"
            aria-label="Kembali"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald/80">
              Workout Start
            </p>
            <h1
              className="text-[1.8rem] font-bold leading-none text-foreground"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {step === "choose-mode"
                ? "Pilih Cara Mulai"
                : mode === "free"
                  ? "Mode Bebas"
                  : step === "choose-plan"
                    ? "Pilih Plan"
                    : "Atur Exercise"}
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              {step === "choose-mode"
                ? "Pilih flow yang paling cocok untuk sesi latihan hari ini."
                : mode === "free"
                  ? `${selectedFreeExercises.length} exercise siap untuk sesi spontanmu`
                  : selectedPlan
                    ? `${selectedPlanExerciseIds.size} exercise aktif dari ${selectedPlan.name}`
                    : "Plan mana yang mau kamu jalani hari ini?"}
            </p>
          </div>
        </div>

        {step === "choose-mode" ? (
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_30%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                Dua Jalur
              </p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("plan");
                    setStep("choose-plan");
                  }}
                  className="group w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-emerald/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald/12 text-emerald ring-1 ring-emerald/20">
                      <Layers2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-foreground">Dari Plan</p>
                        <ChevronRight
                          className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-emerald"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        Pilih plan yang sudah kamu susun, lalu aktifkan hanya exercise
                        yang ingin dijalankan hari ini.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("free");
                    setStep("choose-free-exercises");
                  }}
                  className="group w-full rounded-[28px] border border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_30%),rgba(255,255,255,0.04)] p-4 text-left transition-colors hover:border-amber-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-amber-300 ring-1 ring-amber-300/20">
                      <Flame className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-foreground">Mode Bebas</p>
                        <ChevronRight
                          className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-amber-300"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        Cari exercise dari seluruh database, ambil favorit, lalu mulai
                        sesi spontan tanpa harus masuk plan dulu.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {step === "choose-plan" ? (
          <div className="space-y-3">
            {plans.map((plan) => {
              const categories = Array.from(
                new Set(
                  plan.exercises
                    .map((exercise) => exercise.exercise.category)
                    .filter(Boolean) as ExerciseDisplayCategory[]
                )
              );

              return (
                <button
                  key={plan.id}
                  onClick={() => {
                    setMode("plan");
                    setSelectedPlan(plan);
                    setSelectedPlanExerciseIds(
                      new Set(plan.exercises.map((exercise) => exercise.exerciseId))
                    );
                    setStep("choose-plan-exercises");
                  }}
                  className="group w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-colors hover:border-emerald/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30"
                  id={`select-plan-${plan.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{plan.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                        {plan.type}
                      </p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-emerald"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className={`rounded-full border border-white/5 bg-linear-to-r px-2 py-1 text-[10px] font-medium text-foreground/80 ${CATEGORY_GRADIENTS[category]}`}
                      >
                        {CATEGORY_LABELS[category]}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-text-muted">{plan.exercises.length} exercise total</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === "choose-plan-exercises" && selectedPlan ? (
          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                Active Plan
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedPlan.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Pilih hanya exercise yang ingin kamu jalankan sekarang.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald/20 bg-emerald/10 px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-emerald/75">Ready</p>
                  <p className="text-lg font-semibold text-emerald">{selectedPlanExerciseIds.size}</p>
                </div>
              </div>
            </section>

            {Array.from(
              selectedPlan.exercises.reduce((grouped, exercise) => {
                const category = exercise.exercise.category ?? "arms";
                if (!grouped.has(category)) grouped.set(category, []);
                grouped.get(category)?.push(exercise);
                return grouped;
              }, new Map<ExerciseDisplayCategory, PlanExercise[]>())
            ).map(([category, items]) => (
              <section key={category} className="space-y-2">
                <div
                  className={`inline-flex items-center rounded-full border border-white/5 bg-linear-to-r px-2.5 py-1 text-xs font-semibold text-foreground/80 ${CATEGORY_GRADIENTS[category]}`}
                >
                  {CATEGORY_LABELS[category]}
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const isSelected = selectedPlanExerciseIds.has(item.exerciseId);

                    return (
                      <button
                        key={item.exerciseId}
                        onClick={() => togglePlanExercise(item.exerciseId)}
                        className={`flex min-h-16 w-full items-center gap-3 rounded-[24px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/30 ${
                          isSelected
                            ? "border-emerald/35 bg-emerald/10"
                            : "border-white/10 bg-white/[0.03] opacity-70"
                        }`}
                        id={`toggle-ex-${item.exerciseId}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                            isSelected
                              ? "border-emerald/40 bg-emerald text-[#09110E]"
                              : "border-white/10 bg-white/[0.04] text-text-muted"
                          }`}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.exercise.name}
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">
                            {item.defaultSets}x{item.defaultReps} · Rest {item.restTime}s
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                            item.exercise.trainingStyle === "compound"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {item.exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {step === "choose-free-exercises" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <section className="mb-5 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_32%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
                    Free Workout
                  </p>
                  <h2
                    className="mt-2 text-[1.55rem] font-bold leading-tight text-foreground"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Ambil exercise, mulai cepat, tambah lagi saat sesi jalan.
                  </h2>
                </div>
                <div className="hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-3 text-right sm:block">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Search</p>
                  <Search className="ml-auto mt-2 h-5 w-5 text-amber-300" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 max-w-[30ch] text-sm leading-6 text-text-muted">
                Pilih minimal satu exercise dulu. Stopwatch baru mulai setelah kamu
                tekan tombol mulai.
              </p>
            </section>

            {selectedFreeExercises.length > 0 ? (
              <section className="mb-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Queue Awal
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      Urutan mengikuti pilihanmu dan bisa ditambah lagi nanti.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/75">Ready</p>
                    <p className="text-lg font-semibold text-amber-300">
                      {selectedFreeExercises.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedFreeExercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300/14 text-[11px] text-amber-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {exercise.name}
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">
                            {exercise.defaultSets} set · {exercise.defaultReps} reps · Rest{" "}
                            {exercise.defaultRestTime}s
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenFreeEditor(exercise.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30"
                        >
                          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFreeExercise(exercise)}
                          className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/30"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="min-h-0 flex-1">
              <FreeWorkoutExerciseBrowser
                selectedIds={freeSelectedIds}
                onToggleExercise={toggleFreeExercise}
              />
            </div>
          </div>
        ) : null}

        {(step === "choose-plan-exercises" || step === "choose-free-exercises") ? (
          <div className="fixed inset-x-0 bottom-0 border-t border-white/8 bg-[#07090D]/88 p-4 backdrop-blur-xl">
            <div className="mx-auto max-w-md">
              <button
                onClick={mode === "free" ? handleStartFree : handleStartPlan}
                disabled={
                  mode === "free"
                    ? selectedFreeExercises.length === 0
                    : selectedPlanExerciseIds.size === 0
                }
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-[22px] font-bold text-base transition-[transform,background-color,opacity] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 ${
                  mode === "free"
                    ? "bg-amber-300 text-[#140E02] hover:bg-amber-200 focus-visible:ring-amber-300/35"
                    : "bg-emerald text-[#0A0A0F] hover:bg-emerald-dark focus-visible:ring-emerald/35"
                } disabled:opacity-40`}
                id="start-session-btn"
              >
                <Dumbbell className="h-5 w-5" aria-hidden="true" />
                {mode === "free"
                  ? `Mulai ${selectedFreeExercises.length} Exercise`
                  : `Mulai ${selectedPlanExerciseIds.size} Exercise`}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Sheet
        open={Boolean(editingFreeExercise)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingFreeExerciseId(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[72vh] overflow-y-auto rounded-t-3xl border-t border-white/6 bg-[#0A0A0F] overscroll-contain"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-left text-lg font-bold text-foreground">
              <Settings2 className="h-4 w-4 text-amber-300" aria-hidden="true" />
              Atur Exercise
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-text-muted">
              {editingFreeExercise
                ? `Sesuaikan set, reps, dan rest untuk ${editingFreeExercise.name}.`
                : "Sesuaikan set, reps, dan rest."}
            </SheetDescription>
          </SheetHeader>

          {editingFreeExercise ? (
            <div className="space-y-4 px-4 pb-8 pt-1">
              <div className="glass-card border border-white/6 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {editingFreeExercise.name}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {editingFreeExercise.primaryLabel}
                  {editingFreeExercise.category
                    ? ` · ${CATEGORY_LABELS[editingFreeExercise.category]}`
                    : ""}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="free-exercise-sets"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Sets
                  </label>
                  <Input
                    id="free-exercise-sets"
                    name="free-exercise-sets"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={editorSets}
                    onChange={(event) => setEditorSets(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="free-exercise-reps"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Reps
                  </label>
                  <Input
                    id="free-exercise-reps"
                    name="free-exercise-reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={editorReps}
                    onChange={(event) => setEditorReps(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="free-exercise-rest"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Rest
                  </label>
                  <Input
                    id="free-exercise-rest"
                    name="free-exercise-rest"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={editorRest}
                    onChange={(event) => setEditorRest(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted">
                Nilai kosong atau kurang dari 1 akan otomatis kembali ke nilai sebelumnya.
              </p>

              <Button
                type="button"
                onClick={handleSaveFreeEditor}
                className="h-12 w-full rounded-xl bg-amber-300 text-base font-semibold text-[#140E02] hover:bg-amber-200"
              >
                Simpan Pengaturan
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
