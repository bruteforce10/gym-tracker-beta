"use client";

import { useState } from "react";
import { ChevronDown, Dumbbell } from "lucide-react";

import { formatDate, getBest1RMFromLog, type WorkoutLike } from "@/lib/calculations";

interface WorkoutCardProps {
  workout: WorkoutLike;
  delay?: number;
}

export default function WorkoutCard({ workout, delay = 0 }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);

  const bestExercise = workout.exercises.reduce((currentBest, log) => {
    const currentBestRm = currentBest ? getBest1RMFromLog(currentBest) : 0;
    const nextRm = getBest1RMFromLog(log);
    return nextRm > currentBestRm ? log : currentBest;
  }, workout.exercises[0]);

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
      id={`workout-${workout.id}`}
    >
      <button
        onClick={() => setExpanded((current) => !current)}
        className="w-full p-4 flex items-center justify-between text-left"
        aria-label={`Lihat detail workout ${formatDate(workout.date)}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-emerald" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{formatDate(workout.date)}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {workout.exercises.length} exercises • Best: {bestExercise.exercise}{" "}
              <span className="font-data text-emerald">
                {getBest1RMFromLog(bestExercise).toFixed(1)} kg
              </span>
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
        <div className="px-4 pb-4 space-y-2 border-t border-border-subtle">
          {workout.exercises.map((log, index) => (
            <div key={`${log.exercise}-${index}`} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-foreground font-medium">{log.exercise}</p>
                <p className="text-xs text-text-muted">
                  {log.sets} × {log.reps} reps @ <span className="font-data">{log.weight}</span> kg
                </p>
              </div>
              <div className="text-right">
                <p className="font-data text-sm text-emerald font-semibold">
                  {getBest1RMFromLog(log).toFixed(1)}
                </p>
                <p className="text-[10px] text-text-muted">est. 1RM</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
