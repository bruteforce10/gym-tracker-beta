"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Dumbbell, Plus, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createWorkout } from "@/actions/workouts";
import ExercisePicker from "@/components/exercise-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { calculate1RM } from "@/lib/calculations";
import type { ExerciseCatalogItem } from "@/lib/exercise-catalog";
import { cn } from "@/lib/utils";

interface ExerciseEntry {
  exercise: ExerciseCatalogItem | null;
  weight: string;
  reps: string;
  sets: string;
}

interface AddWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyExercise: ExerciseEntry = {
  exercise: null,
  weight: "",
  reps: "",
  sets: "3",
};

export default function AddWorkoutSheet({ open, onOpenChange }: AddWorkoutSheetProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ ...emptyExercise }]);
  const [date, setDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const updateExercise = (index: number, field: keyof ExerciseEntry, value: ExerciseEntry[keyof ExerciseEntry]) => {
    setExercises((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addExercise = () => {
    setExercises((current) => [...current, { ...emptyExercise }]);
  };

  const removeExercise = (index: number) => {
    setExercises((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(
      (entry) => entry.exercise && entry.weight && entry.reps
    );
    if (validExercises.length === 0) return;

    setSaving(true);
    try {
      const selectedDateIso = date.toISOString().split("T")[0];
      const loggedTimestamp = `${selectedDateIso}T00:00:00.000Z`;

      await createWorkout(
        selectedDateIso,
        validExercises.map((entry) => ({
          exerciseId: entry.exercise!.id,
          weight: Number(entry.weight),
          reps: Number(entry.reps),
          sets: Number(entry.sets) || 3,
        })),
        loggedTimestamp,
        loggedTimestamp
      );

      onOpenChange(false);
      setExercises([{ ...emptyExercise }]);
      router.refresh();
    } catch {
      // Ignore save errors and keep the sheet open.
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#0A0A0F] border-t border-white/6 rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle
            className="text-xl font-bold text-foreground text-left"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-emerald" aria-hidden="true" />
              </div>
              Log Workout
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="workout-date-trigger"
              className="text-xs text-text-muted font-medium mb-1.5 block"
            >
              Tanggal
            </label>
            <Popover>
              <PopoverTrigger
                id="workout-date-trigger"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-start text-left font-normal bg-surface border-border-subtle text-foreground h-10 px-3 hover:bg-surface-elevated transition-colors",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald" aria-hidden="true" />
                {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface border-border-subtle" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="bg-surface"
                />
                <div className="p-3 border-t border-border-subtle">
                  <Button
                    variant="ghost"
                    className="w-full text-xs h-8 text-emerald hover:bg-emerald/10 hover:text-emerald"
                    onClick={() => setDate(new Date())}
                  >
                    Set ke Hari Ini
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {exercises.map((entry, index) => {
            const estimated1RM =
              entry.weight && entry.reps
                ? calculate1RM(Number(entry.weight), Number(entry.reps))
                : 0;

            return (
              <div
                key={index}
                className="glass-card p-4 space-y-3 relative"
                id={`exercise-entry-${index}`}
              >
                {exercises.length > 1 && (
                  <button
                    onClick={() => removeExercise(index)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    aria-label={`Hapus exercise ${index + 1}`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-emerald tracking-wider uppercase">
                    Exercise {index + 1}
                  </span>
                </div>

                <ExercisePicker
                  inputId={`manual-exercise-${index}`}
                  label="Jenis Latihan"
                  value={entry.exercise}
                  onChange={(exercise) => updateExercise(index, "exercise", exercise)}
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor={`manual-weight-${index}`}
                      className="text-xs text-text-muted font-medium mb-1 block"
                    >
                      Berat (kg)
                    </label>
                    <Input
                      id={`manual-weight-${index}`}
                      name={`manual-weight-${index}`}
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={entry.weight}
                      onChange={(event) => updateExercise(index, "weight", event.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`manual-reps-${index}`}
                      className="text-xs text-text-muted font-medium mb-1 block"
                    >
                      Reps
                    </label>
                    <Input
                      id={`manual-reps-${index}`}
                      name={`manual-reps-${index}`}
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={entry.reps}
                      onChange={(event) => updateExercise(index, "reps", event.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`manual-sets-${index}`}
                      className="text-xs text-text-muted font-medium mb-1 block"
                    >
                      Sets
                    </label>
                    <Input
                      id={`manual-sets-${index}`}
                      name={`manual-sets-${index}`}
                      type="number"
                      inputMode="numeric"
                      placeholder="3"
                      value={entry.sets}
                      onChange={(event) => updateExercise(index, "sets", event.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                </div>

                {estimated1RM > 0 && (
                  <div className="flex items-center gap-2 pt-1 px-1">
                    <Trophy className="w-3.5 h-3.5 text-emerald" aria-hidden="true" />
                    <span className="text-xs text-text-muted">Est. 1RM:</span>
                    <span className="font-data text-sm font-bold text-emerald">
                      {estimated1RM.toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={addExercise}
            className="w-full py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-emerald/30 hover:text-emerald transition-colors flex items-center justify-center gap-2 text-sm"
            id="add-exercise-btn"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah Exercise
          </button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold text-base rounded-xl transition-[transform,background-color,opacity] active:scale-[0.98] disabled:opacity-50"
            id="save-workout-btn"
          >
            {saving ? "Menyimpan…" : "Simpan Workout"}
          </Button>

          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
