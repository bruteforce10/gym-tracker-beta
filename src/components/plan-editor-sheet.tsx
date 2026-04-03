"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import {
  exercises as allExercises,
  getExercisesByCategory,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
  UPPER_CATEGORIES,
  LOWER_CATEGORIES,
  type Category,
} from "@/data/exercises";
import { createWorkoutPlan, updateWorkoutPlanExercises } from "@/actions/plans";

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

interface PlanEditorSheetProps {
  plan: Plan;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function PlanEditorSheet({ plan, open, onClose, onSaved }: PlanEditorSheetProps) {
  const isNew = !plan.id;
  const [planName, setPlanName] = useState(plan.name || "");
  const [planType, setPlanType] = useState<"upper" | "lower" | "custom">(
    (plan.type as "upper" | "lower" | "custom") || "custom"
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(plan.exercises.map((e) => e.exerciseId))
  );
  const [saving, setSaving] = useState(false);

  const categories =
    planType === "upper"
      ? UPPER_CATEGORIES
      : planType === "lower"
      ? LOWER_CATEGORIES
      : [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];

  const toggleExercise = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!planName.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      const selectedArray = Array.from(selected);
      const exerciseItems = selectedArray.map((exerciseId, i) => {
        const ex = allExercises.find((e) => e.id === exerciseId)!;
        return {
          exerciseId,
          defaultSets: ex.type === "compound" ? 4 : 3,
          defaultReps: ex.type === "compound" ? 8 : 12,
          restTime: ex.defaultRestTime,
          order: i,
        };
      });

      if (isNew) {
        await createWorkoutPlan(planName, planType, exerciseItems);
      } else {
        await updateWorkoutPlanExercises(plan.id, exerciseItems);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0A0A0F] border-t border-white/6 rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle
            className="text-xl font-bold text-foreground text-left"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {isNew ? "Buat Plan Baru" : `Edit: ${plan.name}`}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Name input */}
          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">Nama Plan</label>
            <Input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Contoh: Upper Body A"
              className="bg-surface-elevated border-border-subtle text-foreground"
            />
          </div>

          {/* Type selector */}
          {isNew && (
            <div>
              <label className="text-xs text-text-muted font-medium mb-1.5 block">Tipe</label>
              <div className="grid grid-cols-3 gap-2">
                {(["upper", "lower", "custom"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPlanType(t)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      planType === t
                        ? "bg-emerald text-[#0A0A0F]"
                        : "bg-surface-elevated border border-border-subtle text-text-muted hover:border-emerald/30"
                    }`}
                  >
                    {t === "upper" ? "Upper" : t === "lower" ? "Lower" : "Custom"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exercise selection per category */}
          <div className="space-y-4">
            <label className="text-xs text-text-muted font-medium block">
              Pilih Exercise ({selected.size} dipilih)
            </label>
            {categories.map((cat) => {
              const catExercises = getExercisesByCategory(cat);
              return (
                <div key={cat} className="space-y-2">
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-linear-to-r ${CATEGORY_GRADIENTS[cat]} text-foreground/80 border border-white/5`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </div>
                  <div className="space-y-1.5">
                    {catExercises.map((ex) => {
                      const isSelected = selected.has(ex.id);
                      return (
                        <button
                          key={ex.id}
                          onClick={() => toggleExercise(ex.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                            isSelected
                              ? "bg-emerald/10 border-emerald/30 text-foreground"
                              : "bg-surface-elevated border-border-subtle text-text-muted hover:border-emerald/20"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? "bg-emerald" : "bg-surface border border-border-subtle"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-[#0A0A0F]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${isSelected ? "text-foreground" : ""}`}>
                              {ex.name}
                            </p>
                            <p className="text-[10px] text-text-muted">{ex.muscleGroup}</p>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                              ex.type === "compound"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {ex.type === "compound" ? "Compound" : "Isolation"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving || !planName.trim() || selected.size === 0}
            className="w-full h-12 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold text-base rounded-xl"
          >
            {saving ? "Menyimpan..." : isNew ? "Buat Plan" : "Simpan Perubahan"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
