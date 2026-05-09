"use client";

import { Settings2 } from "lucide-react";

import type { FavoriteAwareExerciseItem } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type CompletionExerciseConfig = {
  exercise: FavoriteAwareExerciseItem;
  sets: string;
  reps: string;
  rest: string;
};

type CompletionExerciseEditorSheetProps = {
  open: boolean;
  configs: CompletionExerciseConfig[];
  onConfigChange: (index: number, field: "sets" | "reps" | "rest", value: string) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export default function CompletionExerciseEditorSheet({
  open,
  configs,
  onConfigChange,
  onConfirm,
  onOpenChange,
}: CompletionExerciseEditorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] overflow-y-auto rounded-t-[30px] border-t border-white/8 bg-[#0B0D12] px-0"
      >
        <SheetHeader className="border-b border-white/8 p-5">
          <SheetTitle className="flex items-center gap-2 text-left text-lg font-bold text-foreground">
            <Settings2 className="size-4 text-amber-300" aria-hidden="true" />
            Atur Exercise
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Sesuaikan set, reps, dan rest untuk exercise yang akan ditambahkan.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-5">
          {configs.map((config, index) => (
            <div
              key={config.exercise.id}
              className="glass-card space-y-3 border border-white/6 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {config.exercise.name}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {config.exercise.primaryLabel}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor={`completion-sets-${index}`}
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Sets
                  </label>
                  <Input
                    id={`completion-sets-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={config.sets}
                    onChange={(e) => onConfigChange(index, "sets", e.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`completion-reps-${index}`}
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Reps
                  </label>
                  <Input
                    id={`completion-reps-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={config.reps}
                    onChange={(e) => onConfigChange(index, "reps", e.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`completion-rest-${index}`}
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Rest
                  </label>
                  <Input
                    id={`completion-rest-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={config.rest}
                    onChange={(e) => onConfigChange(index, "rest", e.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-text-muted">
            Nilai kosong atau kurang dari 1 akan otomatis menggunakan nilai
            default.
          </p>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={configs.length === 0}
            className="h-12 w-full rounded-2xl bg-amber-300 text-base font-semibold text-[#140E02] hover:bg-amber-200"
          >
            Tambahkan {configs.length} Exercise
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
