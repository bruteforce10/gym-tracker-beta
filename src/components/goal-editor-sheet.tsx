"use client";

import { Check, Calendar as CalendarIcon, Trash2, X } from "lucide-react";
import { format } from "date-fns";

import ExercisePicker from "@/components/exercise-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateInputValue, parseDateInputValue } from "@/lib/date";
import type { ExerciseCatalogItem } from "@/lib/exercise-catalog";
import { cn } from "@/lib/utils";

type GoalEditorFormState = {
  exercise: ExerciseCatalogItem | null;
  targetWeight: string;
  deadline: string;
};

type GoalEditorSheetProps = {
  open: boolean;
  editingGoalId: string | null;
  activeGoalCount: number;
  saving: boolean;
  deleting: boolean;
  formMessage: string;
  value: GoalEditorFormState;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: GoalEditorFormState) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onReset: () => void;
  onDuplicateGoalSelected: (exercise: ExerciseCatalogItem) => void;
};

export default function GoalEditorSheet({
  open,
  editingGoalId,
  activeGoalCount,
  saving,
  deleting,
  formMessage,
  value,
  onOpenChange,
  onValueChange,
  onSubmit,
  onDelete,
  onReset,
  onDuplicateGoalSelected,
}: GoalEditorSheetProps) {
  const isEditing = Boolean(editingGoalId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] rounded-t-[28px] border-t border-white/10 bg-[#0B0D12] data-[side=bottom]:mx-auto data-[side=bottom]:w-full data-[side=bottom]:max-w-2xl"
      >
        <SheetHeader className="border-b border-white/8 px-5 py-4">
          <SheetTitle>
            {isEditing ? "Edit Goal Aktif" : "Tambah Goal Baru"}
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Setiap exercise hanya boleh punya satu goal aktif dan deadline wajib
            diisi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <ExercisePicker
              inputId="goal-exercise"
              label="Exercise"
              value={value.exercise}
              onChange={(exercise) => {
                if (!exercise) {
                  onValueChange({ ...value, exercise: null });
                  return;
                }

                onDuplicateGoalSelected(exercise);
              }}
              helperText="Pilih exercise yang ingin dikejar targetnya."
            />

            <div>
              <label
                htmlFor="goal-target-weight"
                className="mb-1.5 block text-xs font-medium text-text-muted"
              >
                Target Weight (kg)
              </label>
              <input
                id="goal-target-weight"
                name="goal-target-weight"
                type="number"
                inputMode="decimal"
                value={value.targetWeight}
                onChange={(event) =>
                  onValueChange({
                    ...value,
                    targetWeight: event.target.value,
                  })
                }
                className="h-10 w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 font-data text-sm text-foreground outline-none transition-colors focus:border-emerald/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Deadline
              </label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-full justify-start border-border-subtle bg-surface-elevated px-3 text-left font-normal text-foreground transition-colors hover:bg-surface",
                    !value.deadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon
                    className="mr-2 h-4 w-4 text-emerald"
                    aria-hidden="true"
                  />
                  {value.deadline ? (
                    format(
                      parseDateInputValue(value.deadline) ?? new Date(),
                      "PPP",
                    )
                  ) : (
                    <span>Pilih deadline</span>
                  )}
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto border-border-subtle bg-surface p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={parseDateInputValue(value.deadline) ?? undefined}
                    onSelect={(date) =>
                      onValueChange({
                        ...value,
                        deadline: date ? formatDateInputValue(date) : "",
                      })
                    }
                    initialFocus
                    className="bg-surface"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {formMessage ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {formMessage}
              </div>
            ) : null}

            {!isEditing && activeGoalCount >= 3 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-text-muted">
                Slot goal aktif sedang penuh. Hapus atau selesaikan satu goal
                untuk membuka slot baru.
              </div>
            ) : null}

            {isEditing ? (
              <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-danger/80">
                  Danger Zone
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Hapus goal ini kalau kamu tidak ingin melanjutkan target untuk
                  exercise ini.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={saving || deleting}
                  className="mt-4 h-11 w-full rounded-xl"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {deleting ? "Menghapus..." : "Hapus Goal"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <SheetFooter className="border-t border-white/8 px-5 py-4">
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            className="h-11 rounded-xl border-border-subtle text-text-muted hover:text-foreground"
          >
            <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Batal
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              saving ||
              deleting ||
              !value.exercise ||
              !value.deadline ||
              (!isEditing && activeGoalCount >= 3)
            }
            className="h-11 rounded-xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark disabled:opacity-50"
          >
            <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {saving ? "Menyimpan..." : "Simpan Goal"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
