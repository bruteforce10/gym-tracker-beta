"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  ChevronRight,
  Dumbbell,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { deleteWorkoutPlan } from "@/actions/plans";
import {
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
  exercises as allExercises,
  UPPER_CATEGORIES,
  LOWER_CATEGORIES,
  type Category,
} from "@/data/exercises";
import PlanEditorSheet from "@/components/plan-editor-sheet";

type PlanExercise = {
  id: string;
  planId: string;
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

const TYPE_CONFIG: Record<string, { label: string; color: string; categories: Category[] }> = {
  upper: {
    label: "Upper Body",
    color: "from-blue-500/20 to-violet-500/10",
    categories: UPPER_CATEGORIES,
  },
  lower: {
    label: "Lower Body",
    color: "from-emerald/20 to-teal-500/10",
    categories: LOWER_CATEGORIES,
  },
  custom: {
    label: "Custom",
    color: "from-amber-500/20 to-orange-500/10",
    categories: [...UPPER_CATEGORIES, ...LOWER_CATEGORIES],
  },
};

export default function PlanClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (planId: string) => {
    if (!confirm("Hapus plan ini?")) return;
    setDeleting(planId);
    await deleteWorkoutPlan(planId);
    router.refresh();
    setDeleting(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Workout Plans
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Kelola rencana latihan kamu
        </p>
      </div>

      {/* Quick Start Banner */}
      <button
        onClick={() => router.push("/workout/start")}
        className="w-full glass-card p-4 flex items-center gap-4 group border border-emerald/20 hover:border-emerald/40 transition-all"
        id="quick-start-btn"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
          <Dumbbell className="w-6 h-6 text-emerald" />
        </div>
        <div className="text-left">
          <p className="text-foreground font-semibold text-sm">Mulai Latihan Sekarang</p>
          <p className="text-text-muted text-xs mt-0.5">Pilih plan & langsung mulai</p>
        </div>
        <ChevronRight className="w-5 h-5 text-emerald ml-auto group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Plans List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Plans kamu ({plans.length})
          </h2>
        </div>

        {plans.map((plan) => {
          const config = TYPE_CONFIG[plan.type] ?? TYPE_CONFIG.custom;
          const categorySet = new Set(
            plan.exercises
              .map((pe) => allExercises.find((e) => e.id === pe.exerciseId)?.category)
              .filter(Boolean)
          );

          return (
            <div
              key={plan.id}
              className="glass-card p-4 space-y-3"
              id={`plan-card-${plan.id}`}
            >
              {/* Plan header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-linear-to-br ${config.color} flex items-center justify-center`}
                  >
                    <ClipboardList className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-sm">{plan.name}</p>
                    <p className="text-text-muted text-xs">
                      {plan.exercises.length} exercise
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="text-xs text-emerald hover:text-emerald-light transition-colors px-2 py-1 rounded-lg hover:bg-emerald/10"
                    id={`edit-plan-${plan.id}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={deleting === plan.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                    id={`delete-plan-${plan.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Muscle group tags */}
              <div className="flex flex-wrap gap-1.5">
                {Array.from(categorySet).map((cat) => (
                  <span
                    key={cat}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[cat as Category]} text-foreground/80 border border-white/5`}
                  >
                    {CATEGORY_LABELS[cat as Category]}
                  </span>
                ))}
              </div>

              {/* Start button */}
              <button
                onClick={() =>
                  router.push(`/workout/start?planId=${plan.id}`)
                }
                className="w-full py-2 rounded-lg bg-emerald/10 border border-emerald/20 text-emerald text-sm font-semibold hover:bg-emerald/20 transition-colors"
                id={`start-plan-${plan.id}`}
              >
                Mulai Plan Ini →
              </button>
            </div>
          );
        })}

        {/* Add custom plan */}
        <button
          onClick={() => setEditingPlan({ id: "", name: "", type: "custom", exercises: [] })}
          className="w-full py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-emerald/30 hover:text-emerald transition-colors flex items-center justify-center gap-2 text-sm"
          id="add-plan-btn"
        >
          <Plus className="w-4 h-4" />
          Buat Custom Plan
        </button>
      </div>

      {/* Exercise Library Preview */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Exercise Library
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
            const count = allExercises.filter((e) => e.category === cat).length;
            return (
              <div
                key={cat}
                className={`glass-card p-3 flex items-center gap-2 bg-linear-to-br ${CATEGORY_GRADIENTS[cat]}`}
              >
                <div>
                  <p className="text-foreground text-xs font-semibold">{CATEGORY_LABELS[cat]}</p>
                  <p className="text-text-muted text-[10px]">{count} exercise</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan editor sheet */}
      {editingPlan !== null && (
        <PlanEditorSheet
          plan={editingPlan}
          open={editingPlan !== null}
          onClose={() => setEditingPlan(null)}
          onSaved={() => {
            setEditingPlan(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
