"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exercisesList } from "@/data/dummy";
import { calculate1RM } from "@/lib/calculations";
import { createWorkout } from "@/actions/workouts";
import { Plus, X, Dumbbell, Trophy, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExerciseEntry {
  exercise: string;
  weight: string;
  reps: string;
  sets: string;
}

interface AddWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyExercise: ExerciseEntry = {
  exercise: "",
  weight: "",
  reps: "",
  sets: "3",
};

export default function AddWorkoutSheet({ open, onOpenChange }: AddWorkoutSheetProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ ...emptyExercise }]);
  const [date, setDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const updateExercise = (index: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const addExercise = () => {
    setExercises([...exercises, { ...emptyExercise }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validExercises = exercises.filter(
      (e) => e.exercise && e.weight && e.reps
    );
    if (validExercises.length === 0) return;

    setSaving(true);
    try {
      await createWorkout(
        date.toISOString().split("T")[0],
        validExercises.map((e) => ({
          exercise: e.exercise,
          weight: Number(e.weight),
          reps: Number(e.reps),
          sets: Number(e.sets) || 3,
        }))
      );
      onOpenChange(false);
      setExercises([{ ...emptyExercise }]);
      router.refresh();
    } catch {
      // Handle error
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
                <Dumbbell className="w-4 h-4 text-emerald" />
              </div>
              Log Workout
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Date Picker */}
          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Tanggal
            </label>
            <Popover>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-start text-left font-normal bg-surface border-border-subtle text-foreground h-10 px-3 hover:bg-surface-elevated transition-colors",
                  !date && "text-muted-foreground"
                )}
                id="workout-date-trigger"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald" />
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

          {/* Exercise Entries */}
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
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-emerald tracking-wider uppercase">
                    Exercise {index + 1}
                  </span>
                </div>

                {/* Exercise select */}
                <div>
                  <label className="text-xs text-text-muted font-medium mb-1 block">
                    Jenis Latihan
                  </label>
                  <select
                    value={entry.exercise}
                    onChange={(e) => updateExercise(index, "exercise", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border-subtle text-foreground text-sm focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-surface">Pilih exercise...</option>
                    {exercisesList.map((ex) => (
                      <option key={ex} value={ex} className="bg-surface">{ex}</option>
                    ))}
                  </select>
                </div>

                {/* Weight, Reps, Sets grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">
                      Berat (kg)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={entry.weight}
                      onChange={(e) => updateExercise(index, "weight", e.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">
                      Reps
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={entry.reps}
                      onChange={(e) => updateExercise(index, "reps", e.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">
                      Sets
                    </label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={entry.sets}
                      onChange={(e) => updateExercise(index, "sets", e.target.value)}
                      className="bg-surface-elevated border-border-subtle text-foreground font-data text-center"
                    />
                  </div>
                </div>

                {/* Estimated 1RM */}
                {estimated1RM > 0 && (
                  <div className="flex items-center gap-2 pt-1 px-1">
                    <Trophy className="w-3.5 h-3.5 text-emerald" />
                    <span className="text-xs text-text-muted">Est. 1RM:</span>
                    <span className="font-data text-sm font-bold text-emerald">
                      {estimated1RM.toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Exercise Button */}
          <button
            onClick={addExercise}
            className="w-full py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:border-emerald/30 hover:text-emerald transition-colors flex items-center justify-center gap-2 text-sm"
            id="add-exercise-btn"
          >
            <Plus className="w-4 h-4" />
            Tambah Exercise
          </button>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold text-base rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            id="save-workout-btn"
          >
            {saving ? "Menyimpan..." : "Simpan Workout"}
          </Button>

          {/* Bottom spacing for safe area */}
          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
