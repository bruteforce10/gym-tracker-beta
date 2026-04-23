"use client";

import { useState } from "react";
import { Download, Share2, Trophy } from "lucide-react";

import WorkoutShareSticker from "@/components/workout-share-sticker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  downloadWorkoutSharePng,
  exportWorkoutSharePng,
} from "@/lib/export-workout-share-png";
import type { WorkoutShareSummary } from "@/lib/workout-share";

type WorkoutShareResultSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: WorkoutShareSummary | null;
};

export default function WorkoutShareResultSheet({
  open,
  onOpenChange,
  summary,
}: WorkoutShareResultSheetProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!summary) return;

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const file = await exportWorkoutSharePng(summary);
      downloadWorkoutSharePng(file);
    } catch {
      setErrorMessage("Sticker belum bisa diexport. Coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;

    setIsExporting(true);
    setErrorMessage(null);
    let exportedFile: File | null = null;

    try {
      exportedFile = await exportWorkoutSharePng(summary);

      if (
        typeof navigator.share !== "function" ||
        (typeof navigator.canShare === "function" &&
          !navigator.canShare({ files: [exportedFile] }))
      ) {
        downloadWorkoutSharePng(exportedFile);
        setErrorMessage("Share belum tersedia di browser ini. PNG diunduh sebagai gantinya.");
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
        setErrorMessage("Share belum tersedia di browser ini. PNG diunduh sebagai gantinya.");
        return;
      }

      setErrorMessage("Sticker belum bisa diexport. Coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[100dvh] overflow-y-auto rounded-t-[32px] border-t border-white/8 bg-[#090B10] px-0"
      >
        <SheetHeader className="border-b border-white/8 px-5 py-5">
          <SheetTitle
            className="flex items-center gap-3 text-left text-xl"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10 text-emerald">
              <Trophy className="h-4 w-4" aria-hidden="true" />
            </span>
            Workout Share
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Download sticker transparan ini atau kirim ke share sheet untuk lanjut
            pamer hasil workout.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="mx-auto w-full max-w-[348px] rounded-[24px] border border-white/8 bg-white/[0.03] p-3 sm:max-w-[380px] sm:rounded-[28px] sm:p-4">
            <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-2.5 sm:rounded-[24px] sm:p-3">
              <div
                className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.04)_50%,rgba(255,255,255,0.04)_75%,transparent_75%,transparent)] bg-[length:16px_16px] sm:rounded-[22px]"
                style={{
                  backgroundColor: "rgba(9, 11, 16, 0.92)",
                }}
              >
                {summary ? (
                  <WorkoutShareSticker summary={summary} className="w-full" />
                ) : (
                  <div className="aspect-[9/16] w-full" />
                )}
              </div>
            </div>
          </div>

          {summary ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-[380px]">
              <MetricPill label="Duration" value={summary.durationLabel} />
              <MetricPill label="Exercises" value={String(summary.exerciseCount)} />
              <MetricPill label="Best Lift" value={summary.bestLiftLabel} />
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
              {errorMessage}
            </p>
          ) : (
            <p className="mt-4 px-2 text-center text-xs leading-relaxed text-text-muted sm:mx-auto sm:max-w-[380px]">
              Jika share file tidak tersedia di browser ini, tombol share akan fallback
              ke download PNG.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-white/8 bg-[#090B10]/95 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-[380px]">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-border-subtle bg-transparent text-foreground hover:bg-white/5"
              onClick={handleDownload}
              disabled={!summary || isExporting}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Menyiapkan..." : "Download PNG"}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-2xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
              onClick={handleShare}
              disabled={!summary || isExporting}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "Menyiapkan..." : "Share"}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 h-10 w-full rounded-2xl text-text-muted hover:text-foreground sm:mx-auto sm:block sm:max-w-[380px]"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
