"use client";

import { useMemo } from "react";

import {
  buildWorkoutShareStickerSvg,
  type WorkoutShareSummary,
  WORKOUT_SHARE_STICKER_HEIGHT,
  WORKOUT_SHARE_STICKER_WIDTH,
} from "@/lib/workout-share";

type WorkoutShareStickerProps = {
  summary: WorkoutShareSummary;
  className?: string;
};

export default function WorkoutShareSticker({
  summary,
  className,
}: WorkoutShareStickerProps) {
  const svgMarkup = useMemo(
    () => buildWorkoutShareStickerSvg(summary),
    [summary]
  );

  return (
    <div
      className={className}
      aria-label="Workout share sticker preview"
      style={{
        width: "100%",
        aspectRatio: `${WORKOUT_SHARE_STICKER_WIDTH} / ${WORKOUT_SHARE_STICKER_HEIGHT}`,
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
