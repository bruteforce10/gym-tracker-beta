"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculate1RM } from "@/lib/calculations";
import {
  downloadWorkoutSharePng,
  exportWorkoutSharePng,
} from "@/lib/export-workout-share-png";
import {
  getSetsForExercise,
  type WorkoutSessionSnapshot,
} from "@/lib/workout-session";
import {
  formatWorkoutShareDuration,
  type WorkoutShareSummary,
} from "@/lib/workout-share";

type WorkoutSessionCompleteViewProps = {
  snapshot: WorkoutSessionSnapshot;
  summary: WorkoutShareSummary | null;
  completedAt: string | null;
  saving: boolean;
  saveError: string | null;
  onFinished: () => void;
};

type CompletedExerciseSummary = {
  sessionExerciseId: string;
  name: string;
  sets: {
    label: string;
    oneRmLabel: string | null;
    isBest: boolean;
  }[];
};

export default function WorkoutSessionCompleteView({
  snapshot,
  summary,
  completedAt,
  saving,
  saveError,
  onFinished,
}: WorkoutSessionCompleteViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const completedExercises = useMemo<CompletedExerciseSummary[]>(() => {
    return snapshot.exercises
      .map((exercise) => {
        const completedSets = getSetsForExercise(
          snapshot,
          exercise.sessionExerciseId
        ).filter((set) => set.done);

        if (completedSets.length === 0) {
          return null;
        }

        let bestSetIndex = -1;
        let bestSetValue = 0;

        completedSets.forEach((set, index) => {
          const oneRm = calculate1RM(set.weight, set.reps);
          if (oneRm > bestSetValue) {
            bestSetValue = oneRm;
            bestSetIndex = index;
          }
        });

        return {
          sessionExerciseId: exercise.sessionExerciseId,
          name: exercise.name,
          sets: completedSets.map((set, index) => {
            const oneRm = calculate1RM(set.weight, set.reps);

            return {
              label: formatSetLabel(set.weight, set.reps),
              oneRmLabel: oneRm > 0 ? `${formatWeight(oneRm)} kg est. 1RM` : null,
              isBest: bestSetValue > 0 && index === bestSetIndex,
            };
          }),
        };
      })
      .filter((exercise): exercise is CompletedExerciseSummary => exercise !== null);
  }, [snapshot]);

  const totalVolume = useMemo(() => {
    return snapshot.exercises.reduce((total, exercise) => {
      return (
        total +
        getSetsForExercise(snapshot, exercise.sessionExerciseId)
          .filter((set) => set.done)
          .reduce((exerciseTotal, set) => exerciseTotal + set.weight * set.reps, 0)
      );
    }, 0);
  }, [snapshot]);

  const totalCompletedSets = useMemo(() => {
    return completedExercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  }, [completedExercises]);

  const completedAtValue = useMemo(() => {
    const fallbackValue = new Date(snapshot.startedAt);
    const parsedValue = completedAt ? new Date(completedAt) : fallbackValue;
    return Number.isNaN(parsedValue.getTime()) ? fallbackValue : parsedValue;
  }, [completedAt, snapshot.startedAt]);

  const durationLabel = useMemo(() => {
    if (summary?.durationLabel) {
      return summary.durationLabel;
    }

    const startedAtValue = new Date(snapshot.startedAt);
    const durationSeconds = Math.max(
      0,
      Math.floor(
        (completedAtValue.getTime() - startedAtValue.getTime()) / 1000
      )
    );

    return formatWorkoutShareDuration(durationSeconds);
  }, [completedAtValue, snapshot.startedAt, summary?.durationLabel]);

  const handleDownload = async () => {
    if (!summary) return;

    setIsExporting(true);
    setActionMessage(null);

    try {
      const file = await exportWorkoutSharePng(summary);
      downloadWorkoutSharePng(file);
      setActionMessage("Report PNG berhasil diunduh.");
    } catch {
      setActionMessage("Report PNG belum bisa diexport. Coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;

    setIsExporting(true);
    setActionMessage(null);
    let exportedFile: File | null = null;

    try {
      exportedFile = await exportWorkoutSharePng(summary);

      if (
        typeof navigator.share !== "function" ||
        (typeof navigator.canShare === "function" &&
          !navigator.canShare({ files: [exportedFile] }))
      ) {
        downloadWorkoutSharePng(exportedFile);
        setActionMessage(
          "Share belum tersedia di browser ini. Report PNG diunduh sebagai gantinya."
        );
        return;
      }

      await navigator.share({
        title: "Workout selesai",
        text: "Hasil workout terbaru dari GRYNX.",
        files: [exportedFile],
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (exportedFile) {
        downloadWorkoutSharePng(exportedFile);
        setActionMessage(
          "Share belum tersedia di browser ini. Report PNG diunduh sebagai gantinya."
        );
        return;
      }

      setActionMessage("Report PNG belum bisa diexport. Coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const statusMessage =
    saveError ??
    actionMessage ??
    (saving
      ? "Workout sedang disimpan. Anda sudah bisa download atau share report."
      : "Download report PNG atau share hasil workout langsung dari halaman ini.");

  const bestLiftChip =
    summary?.bestLiftValue && summary.bestLiftExerciseName
      ? `Best ${summary.bestLiftLabel} · ${summary.bestLiftExerciseName}`
      : null;

  return (
    <div className="min-h-[100dvh] text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-44 pt-2">
        <section className="px-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1.5 text-xs font-medium text-emerald">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Workout completed
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1
                className="text-[1.95rem] font-bold tracking-tight text-foreground"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Sesi selesai
              </h1>
              <p className="mt-1 max-w-[28ch] text-sm leading-6 text-text-muted">
                Ringkasan workout sudah siap. Cek hasil cepat lalu bagikan kalau
                perlu.
              </p>
            </div>

            <div className="glass-card flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-emerald/15 bg-emerald/10 text-emerald">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="glass-card overflow-hidden rounded-[1.6rem]">
          <div className="bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(16,185,129,0.04))] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald/80">
                  Workout Summary
                </p>
                <h2
                  className="mt-2 truncate text-[1.45rem] font-bold tracking-tight text-foreground"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {snapshot.planName}
                </h2>
              </div>
              <div className="rounded-2xl border border-emerald/15 bg-[#0A0A0F]/30 p-2 text-emerald">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="grid grid-cols-3 gap-4">
              <SummaryMetric label="Volume" value={`${formatWeight(totalVolume)} kg`} />
              <SummaryMetric label="Duration" value={durationLabel} />
              <SummaryMetric
                label={formatDateLabel(completedAtValue)}
                value={formatTimeLabel(completedAtValue)}
              />
            </div>

            <div className="mt-5 h-px w-full bg-white/6" />

            <div className="mt-4 flex flex-wrap gap-2">
              <InfoChip
                icon={<Flame className="h-3.5 w-3.5" aria-hidden="true" />}
                label={`${totalCompletedSets} set selesai`}
              />
              <InfoChip
                icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                label={`${completedExercises.length} exercise`}
              />
              <InfoChip
                icon={<Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                label={durationLabel}
              />
              {bestLiftChip ? (
                <InfoChip
                  icon={<Trophy className="h-3.5 w-3.5" aria-hidden="true" />}
                  label={bestLiftChip}
                />
              ) : null}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {completedExercises.map((exercise) => (
            <section
              key={exercise.sessionExerciseId}
              className="glass-card rounded-[1.5rem] px-4 py-4"
            >
              <h3
                className="pr-4 text-[1.15rem] font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {exercise.name}
              </h3>

              <div className="mt-4 space-y-2.5">
                {exercise.sets.map((set, index) => (
                  <div
                    key={`${exercise.sessionExerciseId}-${index}`}
                    className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-[11px] font-semibold text-emerald">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {set.label}
                        </p>
                        {set.isBest ? (
                          <span className="rounded-full border border-emerald/25 bg-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-emerald">
                            Best
                          </span>
                        ) : null}
                      </div>

                      {set.oneRmLabel ? (
                        <p className="mt-1 text-xs text-text-muted">
                          {set.oneRmLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {completedExercises.length === 0 ? (
            <section className="glass-card rounded-[1.5rem] px-5 py-5 text-center">
              <p className="text-sm text-text-muted">
                Belum ada set yang selesai pada sesi ini.
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0A0A0F]/92 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-md px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-border-subtle bg-transparent text-foreground hover:bg-white/5"
              onClick={handleDownload}
              disabled={!summary || isExporting}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Menyiapkan…" : "Download PNG"}
            </Button>

            <Button
              type="button"
              className="h-12 rounded-2xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
              onClick={handleShare}
              disabled={!summary || isExporting}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Menyiapkan…" : "Share"}
            </Button>
          </div>

          <p
            aria-live="polite"
            className={`mt-3 text-center text-xs leading-relaxed ${
              saveError ? "text-danger" : "text-text-muted"
            }`}
          >
            {statusMessage}
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 h-12 w-full rounded-2xl border border-white/[0.06] bg-surface-elevated text-sm font-semibold text-foreground hover:bg-surface-hover"
            onClick={onFinished}
          >
            Finished
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-data text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}

function InfoChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-elevated px-3 py-1.5 text-xs text-text-muted">
      <span className="shrink-0 text-emerald">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function formatSetLabel(weight: number, reps: number) {
  if (weight <= 0) {
    return `Bodyweight x ${reps}`;
  }

  return `${formatWeight(weight)} kg x ${reps}`;
}

function formatWeight(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDateLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeLabel(value: Date) {
  return value.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
