"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";

import { getWorkoutPlans } from "@/actions/plans";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
  type ExerciseDisplayCategory,
} from "@/lib/exercise-catalog";

type PlanExercise = {
  id: string;
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  order: number;
  exercise: ExerciseCatalogItem;
};

type Plan = {
  id: string;
  name: string;
  type: string;
  exercises: PlanExercise[];
};

type Step = "choose-plan" | "choose-exercises";

export default function WorkoutStartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [step, setStep] = useState<Step>(preselectedPlanId ? "choose-exercises" : "choose-plan");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
          setSelected(new Set(plan.exercises.map((exercise) => exercise.exerciseId)));
        }
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [preselectedPlanId]);

  const toggleExercise = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    if (!selectedPlan || selected.size === 0) return;
    const startedAt = new Date().toISOString();

    const sessionData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      startedAt,
      exercises: selectedPlan.exercises
        .filter((exercise) => selected.has(exercise.exerciseId))
        .sort((left, right) => left.order - right.order)
        .map((exercise) => ({
          exerciseId: exercise.exercise.id,
          name: exercise.exercise.name,
          imageUrl: exercise.exercise.imageUrl,
          category: exercise.exercise.category,
          primaryLabel: exercise.exercise.primaryLabel,
          trainingStyle: exercise.exercise.trainingStyle,
          defaultSets: exercise.defaultSets,
          defaultReps: exercise.defaultReps,
          restTime: exercise.restTime,
        })),
    };

    sessionStorage.setItem("gym-session", JSON.stringify(sessionData));
    router.push("/workout/session");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              if (step === "choose-exercises") setStep("choose-plan");
              else router.back();
            }}
            className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center"
            id="back-btn"
            aria-label={step === "choose-exercises" ? "Kembali ke pilih plan" : "Kembali"}
          >
            <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
              {step === "choose-plan" ? "Pilih Plan" : "Pilih Exercise"}
            </h1>
            <p className="text-text-muted text-xs">
              {step === "choose-plan"
                ? "Plan mana yang mau kamu jalani hari ini?"
                : `${selected.size} exercise dipilih`}
            </p>
          </div>
        </div>

        {step === "choose-plan" && (
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
                    setSelectedPlan(plan);
                    setSelected(new Set(plan.exercises.map((exercise) => exercise.exerciseId)));
                    setStep("choose-exercises");
                  }}
                  className="w-full glass-card p-4 text-left group hover:border-emerald/30 transition-colors"
                  id={`select-plan-${plan.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-foreground font-semibold">{plan.name}</p>
                    <ChevronRight
                      className="w-4 h-4 text-text-muted group-hover:text-emerald group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[category]} text-foreground/80 border border-white/5`}
                      >
                        {CATEGORY_LABELS[category]}
                      </span>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs mt-2">{plan.exercises.length} exercise total</p>
                </button>
              );
            })}
          </div>
        )}

        {step === "choose-exercises" && selectedPlan && (
          <div className="space-y-4">
            {Array.from(
              selectedPlan.exercises.reduce((grouped, exercise) => {
                const category = exercise.exercise.category ?? "arms";
                if (!grouped.has(category)) grouped.set(category, []);
                grouped.get(category)!.push(exercise);
                return grouped;
              }, new Map<ExerciseDisplayCategory, PlanExercise[]>())
            ).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <div
                  className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[category]} text-foreground/80 border border-white/5`}
                >
                  {CATEGORY_LABELS[category]}
                </div>
                <div className="space-y-2">
                  {items.map((item) => {
                    const isSelected = selected.has(item.exerciseId);
                    return (
                      <button
                        key={item.exerciseId}
                        onClick={() => toggleExercise(item.exerciseId)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                          isSelected
                            ? "bg-emerald/10 border-emerald/30"
                            : "bg-surface-elevated border-border-subtle opacity-60"
                        }`}
                        id={`toggle-ex-${item.exerciseId}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-emerald" : "bg-surface border border-border-subtle"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[#0A0A0F]" aria-hidden="true" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.exercise.name}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {item.defaultSets}×{item.defaultReps} · Rest {item.restTime}s
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            item.exercise.trainingStyle === "compound"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {item.exercise.trainingStyle === "compound" ? "C" : "I"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/6">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleStart}
                  disabled={selected.size === 0}
                  className="w-full h-14 bg-emerald hover:bg-emerald-dark disabled:opacity-40 text-[#0A0A0F] font-bold text-base rounded-2xl transition-[transform,background-color,opacity] active:scale-[0.98] flex items-center justify-center gap-2"
                  id="start-session-btn"
                >
                  <Dumbbell className="w-5 h-5" aria-hidden="true" />
                  Mulai {selected.size} Exercise
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
