import { AlertTriangle, Calendar, CheckCircle2, Target } from "lucide-react";

import { parseDateInputValue } from "@/lib/date";
import type { GoalDisplayItem } from "@/lib/goal-state";

type GoalHistoryCardProps = {
  goal: GoalDisplayItem;
};

export default function GoalHistoryCard({ goal }: GoalHistoryCardProps) {
  const isCompleted = goal.status === "completed";
  const badgeLabel = isCompleted ? "Completed" : "Terlambat";
  const badgeIcon = isCompleted ? (
    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
  ) : (
    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
  );
  const dateValue = isCompleted ? goal.completedAt : goal.expiredAt;
  const parsedDate = dateValue ? parseDateInputValue(dateValue) : null;
  const dateLabel = parsedDate
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parsedDate)
    : "Tanggal tidak tersedia";
  const remainingToTarget = Math.max(goal.targetWeight - goal.current1RM, 0);

  return (
    <div className="glass-card animate-fade-in-up overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted/70">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              Riwayat Goal
            </span>
            <span
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                isCompleted
                  ? "border-emerald/20 bg-emerald/10 text-emerald"
                  : "border-danger/30 bg-danger/12 text-danger"
              }`}
            >
              {badgeIcon}
              {badgeLabel}
            </span>
          </div>

          <h3
            className="mt-3 text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {goal.exercise.name}
          </h3>
          <p className="mt-2 text-sm text-text-muted/80">
            {isCompleted
              ? `Goal berhasil ditutup pada ${dateLabel}.`
              : `Goal melewati deadline pada ${dateLabel}.`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted/80">
            1RM Terakhir
          </p>
          <p className="mt-2 font-data text-[1.35rem] font-bold text-foreground">
            {goal.current1RM.toFixed(1)}{" "}
            <span className="text-sm font-normal text-text-muted">kg</span>
          </p>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted/80">
            Target
          </p>
          <p className="mt-2 font-data text-[1.35rem] font-bold text-emerald">
            {goal.targetWeight}{" "}
            <span className="text-sm font-normal text-text-muted">kg</span>
          </p>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted/80">
            Selisih
          </p>
          <p
            className={`mt-2 font-data text-[1.35rem] font-bold ${
              remainingToTarget <= 0.001 ? "text-emerald" : "text-danger"
            }`}
          >
            {remainingToTarget <= 0.001 ? "0.0" : remainingToTarget.toFixed(1)}{" "}
            <span className="text-sm font-normal text-text-muted">kg</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-white/8 bg-[#0F1218]/86 px-4 py-3 text-xs text-text-muted/80">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {dateLabel}
        </span>
        <span>{goal.progress}% progress terakhir</span>
      </div>
    </div>
  );
}
