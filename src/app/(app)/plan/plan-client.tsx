"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  Dumbbell,
  LayoutGrid,
  Plus,
  Trash2,
} from "lucide-react";

import { deleteWorkoutPlan } from "@/actions/plans";
import PlanEditorSheet from "@/components/plan-editor-sheet";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
  type ExerciseDisplayCategory,
} from "@/lib/exercise-catalog";

type PlanExercise = {
  id: string;
  planId: string;
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

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  upper: {
    label: "Upper Body",
    color: "from-blue-500/20 to-violet-500/10",
  },
  lower: {
    label: "Lower Body",
    color: "from-emerald/20 to-teal-500/10",
  },
  custom: {
    label: "Custom",
    color: "from-amber-500/20 to-orange-500/10",
  },
};

const CATALOG_CATEGORY_LINKS: Array<{
  category: ExerciseDisplayCategory;
  label: string;
  bodyPart: string;
}> = [
  { category: "chest", label: CATEGORY_LABELS.chest, bodyPart: "Chest" },
  { category: "back", label: CATEGORY_LABELS.back, bodyPart: "Back" },
  { category: "shoulder", label: CATEGORY_LABELS.shoulder, bodyPart: "Shoulders" },
  { category: "arms", label: CATEGORY_LABELS.arms, bodyPart: "Arms" },
  { category: "quads", label: CATEGORY_LABELS.quads, bodyPart: "Legs" },
  { category: "hamstrings", label: CATEGORY_LABELS.hamstrings, bodyPart: "Legs" },
  { category: "glutes", label: CATEGORY_LABELS.glutes, bodyPart: "Legs" },
  { category: "calves", label: CATEGORY_LABELS.calves, bodyPart: "Legs" },
];

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
      <div>
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Workout Plans
        </h1>
        <p className="text-text-muted text-sm mt-1">Kelola rencana latihan kamu</p>
      </div>

      <button
        onClick={() => router.push("/workout/start")}
        className="w-full glass-card p-4 flex items-center gap-4 group border border-emerald/20 hover:border-emerald/40 transition-colors"
        id="quick-start-btn"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
          <Dumbbell className="w-6 h-6 text-emerald" aria-hidden="true" />
        </div>
        <div className="text-left">
          <p className="text-foreground font-semibold text-sm">Mulai Latihan Sekarang</p>
          <p className="text-text-muted text-xs mt-0.5">Pilih plan & langsung mulai</p>
        </div>
        <ChevronRight
          className="w-5 h-5 text-emerald ml-auto group-hover:translate-x-1 transition-transform"
          aria-hidden="true"
        />
      </button>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Plans kamu ({plans.length})
          </h2>
        </div>

        {plans.map((plan) => {
          const config = TYPE_CONFIG[plan.type] ?? TYPE_CONFIG.custom;
          const categories = Array.from(
            new Set(
              plan.exercises
                .map((exercise) => exercise.exercise.category)
                .filter(Boolean) as ExerciseDisplayCategory[]
            )
          );

          return (
            <div
              key={plan.id}
              className="glass-card p-4 space-y-3"
              id={`plan-card-${plan.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-linear-to-br ${config.color} flex items-center justify-center`}
                  >
                    <ClipboardList className="w-5 h-5 text-foreground/70" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-sm">{plan.name}</p>
                    <p className="text-text-muted text-xs">{plan.exercises.length} exercise</p>
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
                    aria-label={`Hapus plan ${plan.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
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

              <button
                onClick={() => router.push(`/workout/start?planId=${plan.id}`)}
                className="w-full py-2 rounded-lg bg-emerald/10 border border-emerald/20 text-emerald text-sm font-semibold hover:bg-emerald/20 transition-colors"
                id={`start-plan-${plan.id}`}
              >
                Mulai Plan Ini →
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setEditingPlan({ id: "", name: "", type: "custom", exercises: [] })}
          className="w-full py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-emerald/30 hover:text-emerald transition-colors flex items-center justify-center gap-2 text-sm"
          id="add-plan-btn"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Buat Custom Plan
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            Exercise Catalog
          </h2>
          <Link
            href="/exercises"
            className="text-xs text-emerald font-medium hover:underline"
          >
            Buka katalog
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATALOG_CATEGORY_LINKS.map(({ category, label, bodyPart }) => {
            return (
              <Link
                key={category}
                href={`/exercises?bodyPart=${encodeURIComponent(bodyPart)}`}
                className={`glass-card flex items-center gap-2 bg-linear-to-br p-3 transition-colors hover:border-emerald/20 hover:shadow-[0_18px_40px_rgba(10,14,22,0.18)] focus-visible:ring-2 focus-visible:ring-emerald/30 ${CATEGORY_GRADIENTS[category]}`}
              >
                <div className="min-w-0">
                  <p className="text-foreground text-xs font-semibold">{label}</p>
                  <p className="text-text-muted text-[10px]">
                    Lihat katalog {bodyPart.toLowerCase()}
                  </p>
                </div>
                <ChevronRight
                  className="ml-auto h-4 w-4 shrink-0 text-foreground/60"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </div>

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
