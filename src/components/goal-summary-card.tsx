import { AlertTriangle, Calendar, Sparkles, Target } from "lucide-react";

import ProgressRing from "@/components/progress-ring";
import { parseDateInputValue } from "@/lib/date";
import type { GoalDisplayItem } from "@/lib/goal-state";

type GoalSummaryCardProps = {
  goal: GoalDisplayItem;
  action?: React.ReactNode;
};

export default function GoalSummaryCard({
  goal,
  action,
}: GoalSummaryCardProps) {
  const isDeadlineWarning = goal.daysLeft !== null && goal.daysLeft <= 3;
  const remainingToTarget = Math.max(goal.targetWeight - goal.current1RM, 0);
  const deadlineLabel =
    goal.daysLeft === null
      ? "Tanpa deadline"
      : goal.daysLeft < 0
        ? `Lewat ${Math.abs(goal.daysLeft)} hari`
        : goal.daysLeft === 0
          ? "Hari Ini"
          : `${goal.daysLeft} hari`;
  const deadlineDateValue = goal.deadline
    ? parseDateInputValue(goal.deadline)
    : null;
  const deadlineDate = deadlineDateValue
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(deadlineDateValue)
    : null;
  const surfaceClass =
    "rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]";
  const metricLabelClass =
    "text-[10px] uppercase tracking-[0.18em] text-text-muted/80";
  const metricValueClass = "text-[1.35rem]";
  const exerciseBackgroundStyle = goal.exercise.imageUrl
    ? {
        backgroundImage: `url(${goal.exercise.imageUrl})`,
      }
    : undefined;

  return (
    <div className="glass-card relative overflow-hidden rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 animate-fade-in-up sm:p-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -left-16 top-0 h-36 w-36 rounded-full blur-3xl ${
            isDeadlineWarning ? "bg-danger/10" : "bg-emerald/10"
          }`}
        />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          isDeadlineWarning
            ? "bg-gradient-to-r from-transparent via-danger/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-emerald/60 to-transparent"
        }`}
      />

      <div className="relative space-y-4">
        {action ? (
          <div className="absolute top-0 right-0 z-10">{action}</div>
        ) : null}

        <div className="flex items-start gap-3">
          <div className={`min-w-0 flex-1 ${action ? "pr-24" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted/70">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Goal Aktif
              </span>
              <span
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  isDeadlineWarning
                    ? "border-danger/30 bg-danger/12 text-danger"
                    : "border-emerald/20 bg-emerald/10 text-emerald"
                }`}
              >
                {isDeadlineWarning ? (
                  <AlertTriangle
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Calendar
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="font-data tracking-normal">
                  {deadlineLabel}
                </span>
              </span>
            </div>

            <div className="mt-3">
              <h3
                className="text-balance text-[18px] font-bold leading-tight text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {goal.exercise.name}
              </h3>
              <p className="mt-2 text-sm text-text-muted/85">
                {deadlineDate
                  ? `Target selesai sebelum ${deadlineDate}`
                  : "Deadline belum diatur"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-3">
          <div className={`${surfaceClass} p-3`}>
            <div
              className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] px-3 py-3 ${
                exerciseBackgroundStyle ? "bg-white/95" : "bg-black"
              }`}
            >
              {exerciseBackgroundStyle ? (
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className="absolute inset-0 bg-center bg-cover opacity-20"
                    style={exerciseBackgroundStyle}
                  />
                  <div className="absolute inset-0 bg-black/50" />
                </div>
              ) : null}

              <div className="relative z-[1] flex flex-1 items-center justify-center py-2">
                <ProgressRing
                  percentage={goal.progress}
                  size={100}
                  strokeWidth={6}
                  label="progress"
                />
              </div>

              <div className="relative z-[1] rounded-full border border-white/8 bg-white/5 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-white">
                  {goal.progress >= 100
                    ? "Target Tercapai"
                    : isDeadlineWarning
                      ? "Perlu Dikejar"
                      : "Masih On Track"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className={`${surfaceClass} px-4 py-4`}>
                <p className={metricLabelClass}>1RM Saat Ini</p>
                <p
                  className={`mt-2 font-data font-bold ${metricValueClass} text-foreground`}
                >
                  {goal.current1RM.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-text-muted">
                    kg
                  </span>
                </p>
              </div>

              <div className={`${surfaceClass} px-4 py-4`}>
                <p className={metricLabelClass}>Target</p>
                <p
                  className={`mt-2 font-data font-bold ${metricValueClass} text-emerald`}
                >
                  {goal.targetWeight}{" "}
                  <span className="text-sm font-normal text-text-muted">
                    kg
                  </span>
                </p>
              </div>

              <div className={`${surfaceClass} px-4 py-4`}>
                <p className={metricLabelClass}>Sisa Target</p>
                <p
                  className={`mt-2 font-data font-bold ${metricValueClass} ${
                    remainingToTarget <= 0.001
                      ? "text-emerald"
                      : "text-foreground"
                  }`}
                >
                  {remainingToTarget.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-text-muted">
                    kg
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
