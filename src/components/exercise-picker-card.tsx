"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import ExerciseImage from "@/components/exercise-image";
import FavoriteExerciseButton from "@/components/favorite-exercise-button";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
} from "@/lib/exercise-catalog";
import { cn } from "@/lib/utils";

type ExercisePickerCardProps = {
  exercise: ExerciseCatalogItem & {
    isFavorite?: boolean;
  };
  selected?: boolean;
  showPrescriptionBadges?: boolean;
  showThumbnail?: boolean;
  selectionIndicator?: ReactNode;
  onSelect?: () => void;
  onFavoriteChange?: (nextValue: boolean) => void;
  className?: string;
};

export default function ExercisePickerCard({
  exercise,
  selected = false,
  showPrescriptionBadges = true,
  showThumbnail = false,
  selectionIndicator,
  onSelect,
  onFavoriteChange,
  className,
}: ExercisePickerCardProps) {
  const isInteractive = typeof onSelect === "function";
  const gradient = exercise.category
    ? CATEGORY_GRADIENTS[exercise.category]
    : "from-slate-500/30 to-slate-400/20";

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/45",
        selected
          ? "border-emerald/35 bg-emerald/10"
          : "border-white/8 bg-white/[0.03] hover:border-emerald/20",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {showThumbnail ? (
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white aspect-video">
            <ExerciseImage
              src={exercise.imageUrl}
              alt={exercise.name}
              width={128}
              height={80}
              className="h-full w-full object-cover"
              sizes="128px"
              quality={45}
              loading="lazy"
              fallback={
                <div
                  className={`flex h-full w-full items-center justify-center bg-linear-to-br ${gradient}`}
                />
              }
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {exercise.name}
                </p>
                {exercise.isFavorite ? (
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-amber-300"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-text-muted">
                {exercise.primaryLabel}
                {exercise.category
                  ? ` · ${CATEGORY_LABELS[exercise.category]}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-white/5 text-text-muted"
            >
              {exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
            </Badge>
            {showPrescriptionBadges ? (
              <>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 text-text-muted"
                >
                  {exercise.defaultSets} x {exercise.defaultReps}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 text-text-muted"
                >
                  Rest {exercise.defaultRestTime}s
                </Badge>
              </>
            ) : null}
          </div>
        </div>

        {typeof exercise.isFavorite === "boolean" || selectionIndicator ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {typeof exercise.isFavorite === "boolean" ? (
              <FavoriteExerciseButton
                exerciseId={exercise.id}
                initialFavorite={exercise.isFavorite}
                onFavoriteChange={onFavoriteChange}
              />
            ) : null}
            {selectionIndicator}
          </div>
        ) : null}
      </div>
    </div>
  );
}
