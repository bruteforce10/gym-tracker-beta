"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ClipboardList, Plus } from "lucide-react";

import { addExerciseToPlan } from "@/actions/plans";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type ExerciseCatalogItem } from "@/lib/exercise-catalog";

type PlanOption = {
  id: string;
  name: string;
  type: string;
  exercises: Array<{
    id: string;
    exerciseId: string;
  }>;
};

type AddToPlanSheetProps = {
  exercise: ExerciseCatalogItem;
  plans: PlanOption[];
  triggerClassName?: string;
  triggerLabel?: string;
  compact?: boolean;
};

export default function AddToPlanSheet({
  exercise,
  plans,
  triggerClassName,
  triggerLabel = "Masuk Plan",
  compact = false,
}: AddToPlanSheetProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const resetState = () => {
    setSelectedPlanId(null);
    setMessage("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className={
          triggerClassName ??
          "h-11 rounded-xl border-border-subtle bg-surface-elevated text-foreground hover:bg-surface"
        }
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {triggerLabel}
      </Button>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            resetState();
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto h-[78vh] w-full max-w-xl rounded-t-[28px] border-white/8 bg-[#0F1117] p-0 text-foreground"
        >
          <SheetHeader className="border-b border-white/6 px-5 py-4">
            <SheetTitle>Masukkan Ke Plan</SheetTitle>
            <SheetDescription>
              Pilih salah satu plan yang sudah ada untuk menambahkan{" "}
              <span className="font-medium text-foreground">{exercise.name}</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto px-5 py-5">
            {plans.length === 0 ? (
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-text-muted">
                  Kamu belum punya plan. Buat dulu di halaman plan sebelum
                  menambahkan exercise.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const alreadyContains = plan.exercises.some(
                    (entry) => entry.exerciseId === exercise.id,
                  );

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setMessage("");
                      }}
                      className={`glass-card w-full cursor-pointer touch-manipulation rounded-2xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-emerald/30 ${
                        isSelected
                          ? "border-emerald/40 bg-emerald/10"
                          : "border-white/8 hover:border-emerald/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {plan.name}
                            </p>
                            {alreadyContains ? (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-100">
                                Sudah Ada
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-text-muted">
                            {plan.exercises.length} exercise · {plan.type}
                          </p>
                        </div>

                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-emerald/40 bg-emerald text-[#0A0A0F]"
                              : "border-white/10 text-text-muted"
                          }`}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {message ? (
              <div
                aria-live="polite"
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.startsWith("Berhasil")
                    ? "border border-emerald/20 bg-emerald/10 text-emerald-100"
                    : "border border-danger/20 bg-danger/10 text-danger"
                }`}
              >
                {message}
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-t border-white/6 px-5 py-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl border-border-subtle bg-surface-elevated text-foreground hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                disabled={isPending || !selectedPlan || plans.length === 0}
                className="h-11 flex-1 rounded-xl bg-emerald text-sm font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
                onClick={() => {
                  if (!selectedPlan) return;

                  setMessage("");
                  startTransition(async () => {
                    const result = await addExerciseToPlan(selectedPlan.id, exercise.id, {
                      defaultSets: exercise.defaultSets,
                      defaultReps: exercise.defaultReps,
                      restTime: exercise.defaultRestTime,
                    });

                    if (!result.success) {
                      setMessage(result.error ?? "Gagal menambahkan exercise ke plan.");
                      return;
                    }

                    setMessage(`Berhasil ditambahkan ke plan "${selectedPlan.name}".`);
                  });
                }}
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Tambahkan
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
