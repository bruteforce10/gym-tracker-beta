"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Timer } from "lucide-react";

import {
  buildStoredSessionSnapshot,
  getExerciseBySessionId,
  WORKOUT_SESSION_STORAGE_KEY,
} from "@/lib/workout-session";

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hoursLabel = String(hours).padStart(2, "0");
  const minutesLabel = String(minutes).padStart(2, "0");
  const secondsLabel = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hoursLabel}:${minutesLabel}:${secondsLabel}`
    : `${minutesLabel}:${secondsLabel}`;
}

export default function ContinueWorkoutBanner() {
  const router = useRouter();
  const [snapshotRaw, setSnapshotRaw] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const update = () => {
      const nextRaw = sessionStorage.getItem(WORKOUT_SESSION_STORAGE_KEY);
      setSnapshotRaw(nextRaw);
    };

    update();
    const interval = setInterval(update, 1000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener("focus", update);

    return () => {
      clearInterval(interval);
      clearInterval(tick);
      window.removeEventListener("focus", update);
    };
  }, []);

  const snapshot = useMemo(
    () => buildStoredSessionSnapshot(snapshotRaw),
    [snapshotRaw]
  );

  if (!snapshot || snapshot.progress.state === "done") return null;

  const startedAtValue = new Date(snapshot.startedAt);
  const liveElapsedSeconds = Number.isNaN(startedAtValue.getTime())
    ? 0
    : Math.max(0, Math.floor((now - startedAtValue.getTime()) / 1000));
  const elapsedSeconds = snapshot.pausedElapsedSeconds ?? liveElapsedSeconds;

  const currentExercise = getExerciseBySessionId(
    snapshot,
    snapshot.progress.activeTurn.sessionExerciseId
  );

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 px-4">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-emerald/20 bg-[linear-gradient(135deg,var(--color-emerald-dark)_0%,var(--color-emerald)_58%,var(--color-emerald-light)_100%)] text-[var(--primary-foreground)] shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {currentExercise?.name ?? snapshot.planName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Timer className="h-4 w-4 opacity-80" aria-hidden="true" />
                <span className="font-mono text-3xl font-bold tracking-tight">
                  {formatElapsedTime(elapsedSeconds)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/workout/session")}
              className="inline-flex min-h-12 items-center gap-2 rounded-[20px] bg-white px-5 py-3 text-base font-semibold text-emerald-dark transition-transform active:scale-[0.98]"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
