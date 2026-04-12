"use client";

import { useState } from "react";
import { ChevronDown, Dumbbell } from "lucide-react";

import { calculate1RM, type WorkoutLike } from "@/lib/calculations";

type WorkoutSetDetail = {
  setNumber: number;
  weight: number;
  reps: number;
};

type WorkoutCardExercise = {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  setDetails?: WorkoutSetDetail[];
};

type WorkoutCardData = WorkoutLike<WorkoutCardExercise> & {
  title?: string;
  duration?: string;
  dateLabel?: string;
};

interface WorkoutCardProps {
  workout: WorkoutCardData;
  delay?: number;
}

type NormalizedSet = {
  weight: number;
  reps: number;
};

type GroupedExercise = {
  exercise: string;
  sets: Array<{
    setNumber: number;
    weight: number;
    reps: number;
  }>;
  best1RM: number;
};

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatDateStable(dateStr: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!year || !month || !day) {
    return dateStr;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAY_LABELS[date.getUTCDay()] ?? "";
  const monthLabel = MONTH_LABELS[month - 1] ?? monthRaw;

  return `${weekday}, ${day} ${monthLabel} ${year}`;
}

function normalizeSetDetails(log: WorkoutCardExercise): NormalizedSet[] {
  if (log.setDetails && log.setDetails.length > 0) {
    return log.setDetails.map((set) => ({
      weight: set.weight,
      reps: set.reps,
    }));
  }

  const count = Math.max(1, log.sets);
  return Array.from({ length: count }, () => ({
    weight: log.weight,
    reps: log.reps,
  }));
}

function groupExercisesByName(logs: WorkoutCardExercise[]): GroupedExercise[] {
  const groupedMap = new Map<string, NormalizedSet[]>();

  for (const log of logs) {
    const key = log.exercise;
    const existing = groupedMap.get(key) ?? [];
    existing.push(...normalizeSetDetails(log));
    groupedMap.set(key, existing);
  }

  return Array.from(groupedMap.entries()).map(([exercise, sets]) => {
    const indexedSets = sets.map((set, index) => ({
      setNumber: index + 1,
      weight: set.weight,
      reps: set.reps,
    }));

    const best1RM = indexedSets.reduce((currentBest, set) => {
      return Math.max(currentBest, calculate1RM(set.weight, set.reps));
    }, 0);

    return {
      exercise,
      sets: indexedSets,
      best1RM,
    };
  });
}

export default function WorkoutCard({ workout, delay = 0 }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const groupedExercises = groupExercisesByName(workout.exercises);
  const displayDate = workout.dateLabel ?? formatDateStable(workout.date);
  const displayDuration = workout.duration ?? "00:00";
  const exerciseCount = groupedExercises.length;

  const bestExercise = groupedExercises.reduce((currentBest, exercise) => {
    if (!currentBest) return exercise;
    return exercise.best1RM > currentBest.best1RM ? exercise : currentBest;
  }, groupedExercises[0]);

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
      id={`workout-${workout.id}`}
    >
      <button
        onClick={() => setExpanded((current) => !current)}
        className="w-full p-4 flex items-center justify-between text-left"
        aria-label={`Lihat detail workout ${displayDate}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-emerald" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {displayDate}
            </p>
            <p className="text-xs text-text-muted">
              {exerciseCount} exercises • Durasi{" "}
              <span className="font-data">{displayDuration}</span>
            </p>
            <p className="text-xs text-text-muted">
              Best: {bestExercise?.exercise ?? "-"}{" "}
              {bestExercise ? (
                <span className="font-data text-emerald">
                  {bestExercise.best1RM.toFixed(1)} kg
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="border-t border-border-subtle px-4 pb-2 pt-1">
          {groupedExercises.map((exercise) => (
            <div
              key={exercise.exercise}
              className="border-b border-border-subtle/70 py-3 text-sm last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground font-medium">
                  {exercise.exercise}
                </p>
                <div className="text-right">
                  <p className="font-data text-sm text-emerald font-semibold">
                    {exercise.best1RM.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-text-muted">est. 1RM</p>
                </div>
              </div>

              <div className="mt-1.5 grid gap-1">
                {exercise.sets.map((set) => (
                  <p
                    key={`${exercise.exercise}-${set.setNumber}`}
                    className="text-xs text-text-muted"
                  >
                    Set {set.setNumber}:{" "}
                    <span className="font-data text-foreground">
                      {set.weight}
                    </span>{" "}
                    kg ×{" "}
                    <span className="font-data text-foreground">
                      {set.reps}
                    </span>{" "}
                    reps
                  </p>
                ))}
                <p className="text-[11px] text-text-muted">
                  Total {exercise.sets.length} set
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
