"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import ProgressRing from "@/components/progress-ring";
import { getActiveGoal, upsertGoal } from "@/actions/goals";
import { getAllWorkouts } from "@/actions/workouts";
import { exercisesList } from "@/data/dummy";
import { calculateProgress, calculate1RM, getDaysUntilDeadline } from "@/lib/calculations";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Target, Calendar as CalendarIcon, Edit3, Check, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GoalData {
  id: string;
  exercise: string;
  targetWeight: number;
  currentWeight: number;
  deadline: string | null;
}

export default function GoalPage() {
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [current1RM, setCurrent1RM] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    exercise: "",
    targetWeight: "",
    deadline: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [goalData, workouts] = await Promise.all([
          getActiveGoal(),
          getAllWorkouts(),
        ]);

        if (goalData) {
          const g: GoalData = {
            id: goalData.id,
            exercise: goalData.exercise,
            targetWeight: goalData.targetWeight,
            currentWeight: goalData.currentWeight,
            deadline: goalData.deadline?.toISOString().split("T")[0] || null,
          };
          setGoal(g);
          setEditForm({
            exercise: g.exercise,
            targetWeight: g.targetWeight.toString(),
            deadline: g.deadline || "",
          });

          // Calculate current 1RM for this exercise
          let best = 0;
          for (const w of workouts) {
            for (const ex of w.exercises) {
              if (ex.exercise === g.exercise) {
                const rm = calculate1RM(ex.weight, ex.reps);
                if (rm > best) best = rm;
              }
            }
          }
          setCurrent1RM(best);
        } else {
          setEditing(true);
          setEditForm({
            exercise: exercisesList[0],
            targetWeight: "100",
            deadline: "",
          });
        }
      } catch {
        // Handle error
      }
      setLoading(false);
    }
    load();
  }, []);

  const progress = goal ? calculateProgress(current1RM, goal.targetWeight) : 0;
  const daysLeft = goal?.deadline ? getDaysUntilDeadline(goal.deadline) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await upsertGoal({
        exercise: editForm.exercise,
        targetWeight: Number(editForm.targetWeight),
        deadline: editForm.deadline || null,
      });
      setGoal({
        id: result.id,
        exercise: result.exercise,
        targetWeight: result.targetWeight,
        currentWeight: result.currentWeight,
        deadline: result.deadline?.toISOString().split("T")[0] || null,
      });
      setEditing(false);
    } catch {
      // Handle error
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (goal) {
      setEditForm({
        exercise: goal.exercise,
        targetWeight: goal.targetWeight.toString(),
        deadline: goal.deadline || "",
      });
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Goal" subtitle="Target kekuatan yang ingin dicapai" />
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-text-muted">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Goal"
        subtitle="Target kekuatan yang ingin dicapai"
        rightContent={
          !editing &&
          goal && (
            <button
              onClick={() => setEditing(true)}
              className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted hover:text-emerald transition-colors"
              id="edit-goal-btn"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )
        }
      />

      {/* Active Goal Card */}
      {goal && (
        <div className="glass-card p-6 mb-6 animate-fade-in-up" id="active-goal-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald" />
            </div>
            <span className="text-xs font-semibold text-emerald uppercase tracking-wider">
              Target Aktif
            </span>
          </div>

          <div className="flex flex-col items-center mb-6">
            <ProgressRing
              percentage={progress}
              size={180}
              strokeWidth={12}
              label="progress"
              sublabel={`${current1RM.toFixed(1)} / ${goal.targetWeight} kg`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Exercise
              </p>
              <p className="text-sm font-bold text-foreground">{goal.exercise}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Target
              </p>
              <p className="font-data text-lg font-bold text-emerald">
                {goal.targetWeight}{" "}
                <span className="text-xs text-text-muted font-normal">kg</span>
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                1RM Saat Ini
              </p>
              <p className="font-data text-lg font-bold text-foreground">
                {current1RM.toFixed(1)}{" "}
                <span className="text-xs text-text-muted font-normal">kg</span>
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                Sisa Waktu
              </p>
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3 text-text-muted" />
                <p className="font-data text-lg font-bold text-foreground">
                  {daysLeft !== null ? daysLeft : "—"}{" "}
                  <span className="text-xs text-text-muted font-normal">hari</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Form */}
      {editing && (
        <div className="glass-card p-5 space-y-4 animate-fade-in-up" id="edit-goal-form">
          <h3
            className="text-base font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {goal ? "Edit Goal" : "Buat Goal Baru"}
          </h3>

          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Exercise
            </label>
            <select
              value={editForm.exercise}
              onChange={(e) => setEditForm({ ...editForm, exercise: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border-subtle text-foreground text-sm focus:ring-2 focus:ring-emerald/30 focus:border-emerald/50 transition-all appearance-none"
            >
              {exercisesList.map((ex) => (
                <option key={ex} value={ex} className="bg-surface">
                  {ex}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Target Weight (kg)
            </label>
            <Input
              type="number"
              value={editForm.targetWeight}
              onChange={(e) => setEditForm({ ...editForm, targetWeight: e.target.value })}
              className="bg-surface-elevated border-border-subtle text-foreground font-data"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Deadline (opsional)
            </label>
            <Popover>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-start text-left font-normal bg-surface-elevated border-border-subtle text-foreground h-10 px-3 hover:bg-surface transition-colors",
                  !editForm.deadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald" />
                {editForm.deadline ? (
                  format(new Date(editForm.deadline), "PPP")
                ) : (
                  <span>Pilih deadline</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface border-border-subtle" align="start">
                <Calendar
                  mode="single"
                  selected={editForm.deadline ? new Date(editForm.deadline) : undefined}
                  onSelect={(date) =>
                    setEditForm({
                      ...editForm,
                      deadline: date ? date.toISOString().split("T")[0] : "",
                    })
                  }
                  initialFocus
                  className="bg-surface"
                />
                <div className="p-3 border-t border-border-subtle flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-xs h-8 text-emerald hover:bg-emerald/10"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        deadline: new Date().toISOString().split("T")[0],
                      })
                    }
                  >
                    Hari Ini
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-xs h-8 text-text-muted hover:bg-white/5"
                    onClick={() => setEditForm({ ...editForm, deadline: "" })}
                  >
                    Hapus
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-2">
            {goal && (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 h-11 border-border-subtle text-text-muted hover:text-foreground rounded-xl"
              >
                <X className="w-4 h-4 mr-1.5" />
                Batal
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-11 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold rounded-xl disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      )}

      {/* Motivational section */}
      {goal && (
        <div
          className="glass-card p-5 mt-6 text-center animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-2xl mb-2">💪</p>
          <p className="text-sm text-text-muted">
            Kamu sudah mencapai{" "}
            <span className="font-data font-bold text-emerald">{progress}%</span> dari
            target. Tetap konsisten!
          </p>
          <div className="mt-3 h-2 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-dark to-emerald-light transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
