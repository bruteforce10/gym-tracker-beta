"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import PageHeader from "@/components/page-header";
import WorkoutCard from "@/components/workout-card";
import WeeklyDelta from "@/components/weekly-delta";
import { getAllWorkouts } from "@/actions/workouts";
import {
  groupWorkoutsByWeek,
  getWeeklySummary,
} from "@/lib/calculations";
import { ChevronLeft, ChevronRight, TrendingUp, Dumbbell } from "lucide-react";

interface WorkoutData {
  id: string;
  date: string;
  createdAt: string;
  exercises: { exercise: string; weight: number; reps: number; sets: number }[];
}

export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllWorkouts();
        setWorkouts(
          data.map((w) => ({
            id: w.id,
            date: w.date.toISOString().split("T")[0],
            createdAt: w.createdAt.toISOString(),
            exercises: w.exercises.map((e) => ({
              exercise: e.exercise,
              weight: e.weight,
              reps: e.reps,
              sets: e.sets,
            })),
          }))
        );
      } catch {
        // Handle error
      }
      setLoading(false);
    }
    load();
  }, []);

  const weeklyGroups = useMemo(() => {
    const mapped = workouts.map((w) => ({
      ...w,
      userId: "",
    }));
    const groups = groupWorkoutsByWeek(mapped);
    return Array.from(groups.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [workouts]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const currentWeekEntry = weeklyGroups[selectedWeekIndex];
  const prevWeekEntry = weeklyGroups[selectedWeekIndex + 1];

  const currentWeekWorkouts = useMemo(
    () =>
      (currentWeekEntry?.[1] || []).map((w) => ({
        ...w,
        userId: "",
      })),
    [currentWeekEntry]
  );

  const prevWeekWorkouts = useMemo(
    () =>
      (prevWeekEntry?.[1] || []).map((w) => ({
        ...w,
        userId: "",
      })),
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
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("id-ID", opts)} — ${end.toLocaleDateString("id-ID", opts)}`;
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Progress" subtitle="Pantau perkembangan kekuatanmu" />
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-text-muted">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Progress" subtitle="Pantau perkembangan kekuatanmu" />

      {weeklyGroups.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Dumbbell className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-sm text-text-muted">Belum ada data latihan</p>
        </div>
      ) : (
        <>
          {/* Week Selector */}
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
              className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {formatWeekLabel(currentWeekStart, weekEnd)}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {currentWeekWorkouts.length} workout
                {currentWeekWorkouts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() =>
                setSelectedWeekIndex(Math.max(selectedWeekIndex - 1, 0))
              }
              disabled={selectedWeekIndex <= 0}
              className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekly Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald" />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Ringkasan Mingguan
              </h2>
            </div>
            {weeklySummary.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Dumbbell className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-text-muted">
                  Belum ada latihan minggu ini
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {weeklySummary.map((summary, i) => (
                  <div
                    key={summary.exercise}
                    className="glass-card p-4 flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-emerald" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.exercise}
                        </p>
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

          {/* Workout History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-emerald" />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Detail Latihan
              </h2>
            </div>
            <div className="space-y-3">
              {currentWeekWorkouts
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((workout, i) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    delay={i * 100}
                  />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
