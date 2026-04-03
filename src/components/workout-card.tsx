"use client";

import { useState } from "react";
import { Workout } from "@/data/dummy";
import { formatDate, getBest1RMFromLog } from "@/lib/calculations";
import { ChevronDown, Dumbbell } from "lucide-react";

interface WorkoutCardProps {
  workout: Workout;
  delay?: number;
}

export default function WorkoutCard({ workout, delay = 0 }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);

  const bestExercise = workout.exercises.reduce((best, log) => {
    const rm = getBest1RMFromLog(log);
    return rm > getBest1RMFromLog(best) ? log : best;
  }, workout.exercises[0]);

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
      id={`workout-${workout.id}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-emerald" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {formatDate(workout.date)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {workout.exercises.length} exercises • Best: {bestExercise.exercise}{" "}
              <span className="font-data text-emerald">{getBest1RMFromLog(bestExercise).toFixed(1)} kg</span>
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border-subtle">
          {workout.exercises.map((log, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 text-sm"
            >
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
