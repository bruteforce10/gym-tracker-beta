import { calculate1RM } from "@/lib/calculations";
import {
  getSetsForExercise,
  type WorkoutSessionSnapshot,
} from "@/lib/workout-session";

export const WORKOUT_SHARE_LOGO_PATH = "/grynx-logo-horizontal.png";
export const WORKOUT_SHARE_STICKER_WIDTH = 1080;
export const WORKOUT_SHARE_STICKER_HEIGHT = 1920;

export type WorkoutShareSummary = {
  durationLabel: string;
  exerciseCount: number;
  bestLiftLabel: string;
  bestLiftValue: number | null;
  bestLiftExerciseName: string | null;
  fileName: string;
};

export function buildWorkoutShareSummary(
  snapshot: WorkoutSessionSnapshot,
  endedAt: string
): WorkoutShareSummary {
  const startedAtValue = new Date(snapshot.startedAt);
  const endedAtValue = new Date(endedAt);
  const durationSeconds =
    Number.isNaN(startedAtValue.getTime()) || Number.isNaN(endedAtValue.getTime())
      ? 0
      : Math.max(
          0,
          Math.floor((endedAtValue.getTime() - startedAtValue.getTime()) / 1000)
        );

  const completedExerciseIds = new Set<string>();
  let bestLiftValue = 0;
  let bestLiftExerciseName: string | null = null;

  for (const exercise of snapshot.exercises) {
    const completedSets = getSetsForExercise(
      snapshot,
      exercise.sessionExerciseId
    ).filter((set) => set.done);

    if (completedSets.length === 0) {
      continue;
    }

    completedExerciseIds.add(exercise.exerciseId);

    for (const set of completedSets) {
      const estimated1RM = calculate1RM(set.weight, set.reps);
      if (estimated1RM > bestLiftValue) {
        bestLiftValue = estimated1RM;
        bestLiftExerciseName = exercise.name;
      }
    }
  }

  return {
    durationLabel: formatWorkoutShareDuration(durationSeconds),
    exerciseCount: completedExerciseIds.size,
    bestLiftLabel: bestLiftValue > 0 ? `${bestLiftValue.toFixed(1)} kg` : "-",
    bestLiftValue: bestLiftValue > 0 ? bestLiftValue : null,
    bestLiftExerciseName,
    fileName: buildWorkoutShareFileName(snapshot.startedAt),
  };
}

export function formatWorkoutShareDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

export function buildWorkoutShareStickerSvg(
  summary: WorkoutShareSummary,
  options?: {
    logoHref?: string;
  }
) {
  const logoHref = options?.logoHref ?? WORKOUT_SHARE_LOGO_PATH;
  const exerciseCountLabel =
    summary.exerciseCount === 1
      ? "1 exercise"
      : `${summary.exerciseCount} exercises`;
  const bestLiftLabel = summary.bestLiftExerciseName
    ? `BEST LIFT: ${summary.bestLiftExerciseName}`
    : "BEST LIFT";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WORKOUT_SHARE_STICKER_WIDTH}" height="${WORKOUT_SHARE_STICKER_HEIGHT}" viewBox="0 0 ${WORKOUT_SHARE_STICKER_WIDTH} ${WORKOUT_SHARE_STICKER_HEIGHT}" fill="none">
  <g font-family="Outfit, Arial, sans-serif">
    <g transform="translate(84 980)">
      ${buildMetricBlock("Duration", escapeXml(summary.durationLabel), 0)}
      ${buildMetricBlock("Exercises", escapeXml(exerciseCountLabel), 272)}
      ${buildMetricBlock(bestLiftLabel, escapeXml(summary.bestLiftLabel), 544)}
    </g>

    <image
      x="66"
      y="1764"
      width="290"
      height="74"
      preserveAspectRatio="xMinYMid meet"
      href="${escapeAttribute(logoHref)}"
      opacity="0.98"
    />
  </g>
</svg>`.trim();
}

function buildMetricBlock(label: string, value: string, offsetY: number) {
  return `
    <g transform="translate(0 ${offsetY})">
      <text
        x="0"
        y="0"
        fill="#FFFFFF"
        fill-opacity="0.72"
        font-size="${label.length > 20 ? 24 : 30}"
        font-weight="700"
        letter-spacing="${label.length > 20 ? "0.12em" : "0.22em"}"
      >
        ${escapeXml(label.toUpperCase())}
      </text>
      <text
        x="0"
        y="132"
        fill="#FFFFFF"
        font-size="${value.length > 10 ? 110 : 124}"
        font-weight="800"
        letter-spacing="-0.04em"
      >
        ${value}
      </text>
    </g>
  `.trim();
}

function buildWorkoutShareFileName(startedAt: string) {
  const startedAtValue = new Date(startedAt);
  const safeDate = Number.isNaN(startedAtValue.getTime())
    ? new Date().toISOString().slice(0, 10)
    : startedAtValue.toISOString().slice(0, 10);

  return `grynx-workout-${safeDate}.png`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeAttribute(value: string) {
  return escapeXml(value).replaceAll("\n", "");
}
