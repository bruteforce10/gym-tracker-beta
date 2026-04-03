"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Dumbbell } from "lucide-react";
import { getWorkoutPlans } from "@/actions/plans";
import {
  exercises as allExercises,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
  type Category,
  type Exercise,
} from "@/data/exercises";

type PlanExercise = {
  id: string;
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  order: number;
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

  const loadPlans = useCallback(async () => {
    const data = await getWorkoutPlans();
    setPlans(data);
    if (preselectedPlanId) {
      const plan = data.find((p) => p.id === preselectedPlanId);
      if (plan) {
        setSelectedPlan(plan);
        setSelected(new Set(plan.exercises.map((e) => e.exerciseId)));
      }
    }
    setLoading(false);
  }, [preselectedPlanId]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const toggleExercise = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    if (!selectedPlan || selected.size === 0) return;

    // Serialize selected exercises data to pass via URL/sessionStorage
    const sessionData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      exercises: selectedPlan.exercises
        .filter((pe) => selected.has(pe.exerciseId))
        .sort((a, b) => a.order - b.order)
        .map((pe) => {
          const ex = allExercises.find((e) => e.id === pe.exerciseId)!;
          return {
            exerciseId: ex.id,
            name: ex.name,
            category: ex.category,
            muscleGroup: ex.muscleGroup,
            type: ex.type,
            defaultSets: pe.defaultSets,
            defaultReps: pe.defaultReps,
            restTime: pe.restTime,
          };
        }),
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              if (step === "choose-exercises") setStep("choose-plan");
              else router.back();
            }}
            className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center"
            id="back-btn"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
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

        {/* Step: Choose Plan */}
        {step === "choose-plan" && (
          <div className="space-y-3">
            {plans.map((plan) => {
              const categories = [
                ...new Set(
                  plan.exercises
                    .map((pe) => allExercises.find((e) => e.id === pe.exerciseId)?.category)
                    .filter(Boolean) as Category[]
                ),
              ];
              return (
                <button
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setSelected(new Set(plan.exercises.map((e) => e.exerciseId)));
                    setStep("choose-exercises");
                  }}
                  className="w-full glass-card p-4 text-left group hover:border-emerald/30 transition-all"
                  id={`select-plan-${plan.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-foreground font-semibold">{plan.name}</p>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-emerald group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[cat]} text-foreground/80 border border-white/5`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </span>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs mt-2">
                    {plan.exercises.length} exercise total
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Choose Exercises */}
        {step === "choose-exercises" && selectedPlan && (
          <div className="space-y-4">
            {/* Group exercises by category */}
            {(() => {
              const grouped = new Map<Category, (typeof selectedPlan.exercises[0] & { exercise: Exercise })[]>();
              for (const pe of selectedPlan.exercises) {
                const ex = allExercises.find((e) => e.id === pe.exerciseId);
                if (!ex) continue;
                const cat = ex.category as Category;
                if (!grouped.has(cat)) grouped.set(cat, []);
                grouped.get(cat)!.push({ ...pe, exercise: ex });
              }
              return Array.from(grouped.entries()).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <div
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[cat]} text-foreground/80 border border-white/5`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </div>
                  <div className="space-y-2">
                    {items.map(({ exercise: ex, ...pe }) => {
                      const isOn = selected.has(ex.id);
                      return (
                        <button
                          key={ex.id}
                          onClick={() => toggleExercise(ex.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                            isOn
                              ? "bg-emerald/10 border-emerald/30"
                              : "bg-surface-elevated border-border-subtle opacity-60"
                          }`}
                          id={`toggle-ex-${ex.id}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                              isOn ? "bg-emerald" : "bg-surface border border-border-subtle"
                            }`}
                          >
                            {isOn && <Check className="w-3 h-3 text-[#0A0A0F]" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground">{ex.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {pe.defaultSets}×{pe.defaultReps} · Rest {pe.restTime}s
                            </p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            ex.type === "compound" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {ex.type === "compound" ? "C" : "I"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Start CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/6">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleStart}
                  disabled={selected.size === 0}
                  className="w-full h-14 bg-emerald hover:bg-emerald-dark disabled:opacity-40 text-[#0A0A0F] font-bold text-base rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  id="start-session-btn"
                >
                  <Dumbbell className="w-5 h-5" />
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
