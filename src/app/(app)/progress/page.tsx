"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, TrendingUp } from "lucide-react";

import { getAllWorkouts } from "@/actions/workouts";
import PageHeader from "@/components/page-header";
import WeeklyDelta from "@/components/weekly-delta";
import WorkoutCard from "@/components/workout-card";
import { groupWorkoutsByWeek, getWeeklySummary, type WorkoutLike } from "@/lib/calculations";

interface WorkoutData extends WorkoutLike {
  createdAt: string;
}

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllWorkouts();
        setWorkouts(
          data.map((workout) => ({
            id: workout.id,
            date: workout.date.toISOString().split("T")[0],
            createdAt: workout.createdAt.toISOString(),
            exercises: workout.exercises.map((exercise) => ({
              exercise: exercise.exercise?.name ?? "Unknown Exercise",
              weight: exercise.weight,
              reps: exercise.reps,
              sets: exercise.sets,
            })),
          }))
        );
      } catch {
        // Ignore load errors and show empty state.
      }
      setLoading(false);
    }

    load();
  }, []);

  const weeklyGroups = useMemo(() => {
    const groups = groupWorkoutsByWeek(workouts);
    return Array.from(groups.entries()).sort(
      (left, right) => new Date(right[0]).getTime() - new Date(left[0]).getTime()
    );
  }, [workouts]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const currentWeekEntry = weeklyGroups[selectedWeekIndex];
  const prevWeekEntry = weeklyGroups[selectedWeekIndex + 1];
  const currentWeekWorkouts = useMemo(
    () => (currentWeekEntry?.[1] || []) as WorkoutLike[],
    [currentWeekEntry]
  );
  const prevWeekWorkouts = useMemo(
    () => (prevWeekEntry?.[1] || []) as WorkoutLike[],
    [prevWeekEntry]
  );

  const weeklySummary = useMemo(
    () => getWeeklySummary(currentWeekWorkouts, prevWeekWorkouts),
    [currentWeekWorkouts, prevWeekWorkouts]
  );

  const currentWeekStart = currentWeekEntry?.[0]
    ? new Date(currentWeekEntry[0])
    : new Date();
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatWeekLabel = useCallback((start: Date, end: Date) => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    });
    return `${formatter.format(start)} — ${formatter.format(end)}`;
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Progress" subtitle="Pantau perkembangan kekuatanmu" />
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-text-muted">Memuat data…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Progress" subtitle="Pantau perkembangan kekuatanmu" />

      {weeklyGroups.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Dumbbell className="w-8 h-8 text-text-muted/30 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-text-muted">Belum ada data latihan</p>
        </div>
      ) : (
        <>
          <div
            className="glass-card p-3 flex items-center justify-between mb-6 animate-fade-in-up"
            id="week-selector"
          >
            <button
              onClick={() =>
                setSelectedWeekIndex(
                  Math.min(selectedWeekIndex + 1, weeklyGroups.length - 1)
                )
              }
              disabled={selectedWeekIndex >= weeklyGroups.length - 1}
              className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Lihat minggu sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {formatWeekLabel(currentWeekStart, weekEnd)}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {currentWeekWorkouts.length} workout{currentWeekWorkouts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setSelectedWeekIndex(Math.max(selectedWeekIndex - 1, 0))}
              disabled={selectedWeekIndex <= 0}
              className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Lihat minggu berikutnya"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald" aria-hidden="true" />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Ringkasan Mingguan
              </h2>
            </div>
            {weeklySummary.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Dumbbell className="w-8 h-8 text-text-muted/30 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-text-muted">Belum ada latihan minggu ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {weeklySummary.map((summary, index) => (
                  <div
                    key={summary.exercise}
                    className="glass-card p-4 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-emerald" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{summary.exercise}</p>
                        <p className="text-xs text-text-muted">
                          Peak 1RM:{" "}
                          <span className="font-data text-foreground">
                            {summary.peak1RM.toFixed(1)} kg
                          </span>
                        </p>
                      </div>
                    </div>
                    <WeeklyDelta delta={summary.delta} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-emerald" aria-hidden="true" />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Detail Latihan
              </h2>
            </div>
            <div className="space-y-3">
              {currentWeekWorkouts
                .slice()
                .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
                .map((workout, index) => (
                  <WorkoutCard key={workout.id} workout={workout} delay={index * 100} />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
