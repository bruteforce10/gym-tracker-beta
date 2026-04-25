"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Target,
} from "lucide-react";

import { activateOnboardingDraft } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  getEquipmentMeta,
  getExperienceMeta,
  getGoalMeta,
  getLoadLevelMeta,
  type GeneratedOnboardingDraft,
} from "@/lib/onboarding";

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function OnboardingReview({
  draft,
}: {
  draft: GeneratedOnboardingDraft;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const answers = draft.answers;
  const [error, setError] = useState("");

  return (
    <main className="min-h-screen gradient-mesh px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/onboarding"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated/70 text-foreground transition-[border-color,background-color] duration-200 hover:border-emerald/25 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
            aria-label="Kembali ke jawaban onboarding"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald/80">
              Review Program
            </p>
            <h1 className="mt-2 text-balance text-3xl font-bold text-foreground">
              Plan pertamamu sudah siap
            </h1>
          </div>
        </div>

        <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,29,0.96),rgba(10,10,15,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald/80">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Rekomendasi Awal
              </div>
              <p className="mt-4 text-2xl font-bold leading-tight text-foreground">
                {draft.recommendationSummary}
              </p>
              <p className="mt-3 max-w-[52ch] text-sm leading-6 text-text-muted">
                {draft.rationale[0]}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    Focus Program
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {getGoalMeta(answers.primaryGoal).shortLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    Frekuensi
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {answers.trainingDaysPerWeek} hari per minggu
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    Setup
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {getEquipmentMeta(answers.equipmentAccess).label}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-emerald/10 bg-emerald/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/12 text-emerald">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald/80">
                    Goal yang Kamu Set
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {draft.goal.exerciseName}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    Target
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {draft.goal.targetWeight.toFixed(1)} kg
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                    Deadline
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDeadline(draft.goal.deadline)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-muted">
                {draft.goal.rationale}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,19,28,0.92),rgba(12,12,18,0.94))] p-5">
            <h2 className="text-lg font-bold text-foreground">Profil latihanmu</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  Focus Stack
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {getGoalMeta(answers.primaryGoal).shortLabel}
                  {answers.secondaryGoal
                    ? ` + ${getGoalMeta(answers.secondaryGoal).shortLabel}`
                    : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  Experience
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {getExperienceMeta(answers.experienceLevel).label}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                  Load Level
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {getLoadLevelMeta(answers.loadLevel).label}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Kenapa plan ini mengikuti goal itu?
              </p>
              <div className="mt-3 space-y-3">
                {draft.rationale.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald" aria-hidden="true" />
                    <p className="text-sm leading-6 text-text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {draft.plans.map((plan) => (
              <section
                key={plan.name}
                className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,20,27,0.9),rgba(10,10,15,0.94))] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald/80">
                      {plan.focusLabel}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-emerald">
                    <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {plan.exercises.map((exercise) => (
                    <div
                      key={`${plan.name}-${exercise.exerciseId}`}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {exercise.exerciseName}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {exercise.primaryLabel}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-text-muted">
                          {exercise.defaultSets} x {exercise.defaultReps}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
                        <div className="inline-flex items-center gap-1.5">
                          <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                          Rest {exercise.restTime}s
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                          {exercise.rationale}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        {error ? (
          <div
            className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-red-100"
            aria-live="polite"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border-border-subtle bg-surface-elevated/60 text-foreground hover:bg-surface-elevated"
            onClick={() => router.push("/onboarding")}
          >
            Ubah Jawaban
          </Button>
          <Button
            type="button"
            className="h-12 rounded-2xl bg-emerald text-[#08110D] hover:bg-emerald-dark"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setError("");
                const result = await activateOnboardingDraft();
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                router.push("/dashboard");
                router.refresh();
              })
            }
          >
            {isPending ? "Mengaktifkan…" : "Aktifkan Plan"}
          </Button>
        </div>
      </div>
    </main>
  );
}
