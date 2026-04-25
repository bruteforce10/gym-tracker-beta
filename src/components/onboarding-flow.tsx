"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar as CalendarIcon,
  CalendarRange,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Trophy,
  VenusAndMars,
} from "lucide-react";

import { saveOnboardingDraft } from "@/actions/onboarding";
import { getExerciseById } from "@/actions/exercises";
import ExercisePicker from "@/components/exercise-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateInputValue, parseDateInputValue } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  LOAD_LEVEL_OPTIONS,
  TRAINING_DAY_OPTIONS,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import type { ExerciseCatalogItem } from "@/lib/exercise-catalog";

const DEFAULT_ANSWERS: OnboardingAnswers = {
  goalExerciseId: "",
  goalTargetWeight: 0,
  goalDeadline: "",
  primaryGoal: "muscle_gain",
  secondaryGoal: "strength",
  trainingDaysPerWeek: 4,
  experienceLevel: "beginner",
  loadLevel: "light",
  equipmentAccess: "full_gym",
  gender: "prefer_not_to_say",
};

type StepKey =
  | "goalSetup"
  | "primaryGoal"
  | "secondaryGoal"
  | "trainingDaysPerWeek"
  | "experienceLevel"
  | "loadLevel"
  | "equipmentAccess"
  | "gender";

type StepDefinition = {
  key: StepKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: StepDefinition[] = [
  {
    key: "goalSetup",
    title: "Set goal utamamu dulu",
    description: "Pilih exercise target, angka yang ingin kamu capai, dan deadline. Plan akan dibentuk mengikuti goal ini.",
    icon: Target,
  },
  {
    key: "primaryGoal",
    title: "Fokus program utamamu apa?",
    description: "Ini jadi lapisan kedua setelah goal, supaya struktur latihan terasa lebih sesuai dengan caramu mau progres.",
    icon: Sparkles,
  },
  {
    key: "secondaryGoal",
    title: "Fokus kedua yang ingin ikut dijaga apa?",
    description: "Sistem tetap memprioritaskan tujuan utama, tapi akan memberi penyesuaian kecil.",
    icon: Sparkles,
  },
  {
    key: "trainingDaysPerWeek",
    title: "Berapa hari kamu realistis latihan tiap minggu?",
    description: "Jawaban ini dipakai untuk memilih split plan yang paling masuk akal.",
    icon: CalendarRange,
  },
  {
    key: "experienceLevel",
    title: "Level gym kamu sekarang ada di mana?",
    description: "Volume dan kompleksitas plan akan mengikuti ritme latihanmu saat ini.",
    icon: Trophy,
  },
  {
    key: "loadLevel",
    title: "Kalau soal beban, kemampuanmu lebih dekat ke level mana?",
    description: "Kami pakai ini untuk membuat target awal yang cukup menantang tapi tetap realistis.",
    icon: BarChart3,
  },
  {
    key: "equipmentAccess",
    title: "Kamu biasanya latihan pakai setup seperti apa?",
    description: "Plan akan menyesuaikan alat yang paling mungkin kamu pakai secara rutin.",
    icon: Dumbbell,
  },
  {
    key: "gender",
    title: "Gender kamu?",
    description: "Dipakai hanya untuk penyesuaian minor dan bahasa rekomendasi.",
    icon: VenusAndMars,
  },
];

function OptionCard({
  selected,
  title,
  description,
  onClick,
  accent = "emerald",
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  accent?: "emerald" | "amber" | "blue";
}) {
  const accentClasses =
    accent === "amber"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : accent === "blue"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-100"
        : "border-emerald/30 bg-emerald/10 text-emerald-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
        selected
          ? `${accentClasses} shadow-[0_18px_48px_rgba(16,185,129,0.12)]`
          : "border-border-subtle bg-surface-elevated/75 text-foreground hover:border-emerald/20 hover:bg-surface-elevated hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
        </div>
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-current bg-current/20"
              : "border-border-subtle bg-background/60"
          )}
          aria-hidden="true"
        >
          {selected ? <div className="h-2.5 w-2.5 rounded-full bg-current" /> : null}
        </div>
      </div>
    </button>
  );
}

function DayOption({
  value,
  selected,
  onClick,
}: {
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border px-4 py-5 text-center transition-[border-color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
        selected
          ? "border-emerald/35 bg-emerald/12 text-foreground"
          : "border-border-subtle bg-surface-elevated/70 text-text-muted hover:border-emerald/20 hover:text-foreground"
      )}
    >
      <div className="font-heading text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs">{value === 1 ? "hari" : "hari / minggu"}</div>
    </button>
  );
}

function GeneratingState() {
  const messages = [
    "Membaca profil latihanmu",
    "Memilih struktur program awal",
    "Menyiapkan goal dan plan review",
  ];

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,21,30,0.96),rgba(10,10,15,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10 text-emerald">
          <Flame className="h-6 w-6 animate-pulse" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Menyusun plan pertamamu</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Kami sedang memilih split yang paling masuk akal, volume awal, dan target pertama yang cukup realistis.
        </p>
        <div className="mt-6 space-y-3">
          {messages.map((message, index) => (
            <div
              key={message}
              className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 animate-fade-in-up"
              style={{ animationDelay: `${120 + index * 120}ms` }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-emerald shimmer" aria-hidden="true" />
              <p className="text-sm text-foreground/88">{message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingFlow({
  defaultAnswers,
}: {
  defaultAnswers: OnboardingAnswers | null;
}) {
  const router = useRouter();
  const [isPending, startPending] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [selectedGoalExercise, setSelectedGoalExercise] =
    useState<ExerciseCatalogItem | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>(
    defaultAnswers ?? DEFAULT_ANSWERS
  );

  useEffect(() => {
    const goalExerciseId = defaultAnswers?.goalExerciseId;
    if (typeof goalExerciseId !== "string" || goalExerciseId.length === 0 || selectedGoalExercise) {
      return;
    }
    const stableGoalExerciseId = goalExerciseId;

    let cancelled = false;

    async function loadGoalExercise() {
      const exercise = await getExerciseById(stableGoalExerciseId);
      if (!cancelled && exercise) {
        setSelectedGoalExercise(exercise);
      }
    }

    void loadGoalExercise();

    return () => {
      cancelled = true;
    };
  }, [defaultAnswers?.goalExerciseId, selectedGoalExercise]);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const secondaryGoalOptions = useMemo(
    () => [
      ...GOAL_OPTIONS.filter((option) => option.value !== answers.primaryGoal),
      {
        value: "none" as const,
        label: "Belum Ada Fokus Kedua",
        shortLabel: "Fokus Tunggal",
        description: "Biarkan sistem fokus penuh ke tujuan utama dulu.",
      },
    ],
    [answers.primaryGoal]
  );
  const canProceed =
    currentStep.key === "goalSetup"
      ? Boolean(
          selectedGoalExercise &&
            answers.goalTargetWeight > 0 &&
            parseDateInputValue(answers.goalDeadline)
        )
      : true;

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    startPending(async () => {
      setError("");
      const result = await saveOnboardingDraft(answers as unknown as Record<string, unknown>);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/review");
    });
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.push("/dashboard");
      return;
    }
    setStepIndex((current) => current - 1);
  };

  if (isPending) {
    return <GeneratingState />;
  }

  return (
    <main className="min-h-screen gradient-mesh px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated/70 text-foreground transition-[border-color,background-color] duration-200 hover:border-emerald/25 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
            aria-label={stepIndex === 0 ? "Kembali ke dashboard" : "Kembali ke pertanyaan sebelumnya"}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-text-muted">
              <span>Program Setup</span>
              <span>
                {stepIndex + 1}/{STEPS.length}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald via-emerald-light to-teal-300 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,18,25,0.92),rgba(10,10,15,0.94))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-6">
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10 text-emerald">
              <currentStep.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald/80">
              Langkah {stepIndex + 1}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-bold leading-tight text-foreground">
              {currentStep.title}
            </h1>
            <p className="mt-3 max-w-[44ch] text-sm leading-6 text-text-muted">
              {currentStep.description}
            </p>
          </div>

          {currentStep.key === "goalSetup" ? (
            <div className="space-y-4">
              <ExercisePicker
                inputId="onboarding-goal-exercise"
                label="Exercise Goal"
                value={selectedGoalExercise}
                onChange={(exercise) => {
                  setSelectedGoalExercise(exercise);
                  setAnswers((current) => ({
                    ...current,
                    goalExerciseId: exercise?.id ?? "",
                  }));
                }}
                helperText="Pilih exercise yang benar-benar ingin kamu capai targetnya. Plan akan menyesuaikan area dan pola latihan dari goal ini."
              />

              <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <label
                    htmlFor="onboarding-goal-target"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Target Weight (kg)
                  </label>
                  <input
                    id="onboarding-goal-target"
                    name="onboarding-goal-target"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={
                      answers.goalTargetWeight > 0
                        ? String(answers.goalTargetWeight)
                        : ""
                    }
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        goalTargetWeight: Number(event.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-border-subtle bg-surface-elevated px-3.5 text-sm text-foreground outline-none transition-colors focus:border-emerald/30 focus:ring-2 focus:ring-emerald/15"
                    placeholder="Contoh 60"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-text-muted">
                    Masukkan target yang ingin kamu capai untuk exercise ini.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Deadline Goal
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex h-12 w-full cursor-pointer items-center justify-start rounded-2xl border border-border-subtle bg-surface-elevated px-3.5 text-left text-sm text-foreground transition-colors hover:border-emerald/20 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
                        !answers.goalDeadline && "text-text-muted"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-emerald" aria-hidden="true" />
                      {answers.goalDeadline ? (
                        format(
                          parseDateInputValue(answers.goalDeadline) ?? new Date(),
                          "PPP"
                        )
                      ) : (
                        <span>Pilih deadline</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto border-border-subtle bg-surface p-0"
                    >
                      <Calendar
                        mode="single"
                        selected={parseDateInputValue(answers.goalDeadline) ?? undefined}
                        onSelect={(date) =>
                          setAnswers((current) => ({
                            ...current,
                            goalDeadline: date ? formatDateInputValue(date) : "",
                          }))
                        }
                        initialFocus
                        className="bg-surface"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="mt-2 text-[11px] leading-5 text-text-muted">
                    Deadline ini dipakai untuk membentuk ritme awal programmu.
                  </p>
                </div>
              </div>

              {selectedGoalExercise ? (
                <div className="rounded-2xl border border-emerald/15 bg-emerald/8 px-4 py-3 text-sm text-emerald-50">
                  Goal utama kamu sekarang mengarah ke{" "}
                  <span className="font-semibold">{selectedGoalExercise.name}</span>.
                  Plan akan mengutamakan kategori{" "}
                  <span className="font-semibold">
                    {selectedGoalExercise.primaryLabel.toLowerCase()}
                  </span>{" "}
                  dan exercise pendukung yang paling relevan.
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep.key === "primaryGoal" ? (
            <div className="grid gap-3">
              {GOAL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.primaryGoal === option.value}
                  title={option.shortLabel}
                  description={option.description}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      primaryGoal: option.value,
                      secondaryGoal:
                        current.secondaryGoal === option.value
                          ? null
                          : current.secondaryGoal,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "secondaryGoal" ? (
            <div className="grid gap-3">
              {secondaryGoalOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.secondaryGoal === option.value || (!answers.secondaryGoal && option.value === "none")}
                  title={option.shortLabel}
                  description={option.description}
                  accent="blue"
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      secondaryGoal: option.value === "none" ? null : option.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "trainingDaysPerWeek" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {TRAINING_DAY_OPTIONS.map((value) => (
                <DayOption
                  key={value}
                  value={value}
                  selected={answers.trainingDaysPerWeek === value}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      trainingDaysPerWeek: value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "experienceLevel" ? (
            <div className="grid gap-3">
              {EXPERIENCE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.experienceLevel === option.value}
                  title={option.label}
                  description={option.description}
                  accent="amber"
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      experienceLevel: option.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "loadLevel" ? (
            <div className="grid gap-3">
              {LOAD_LEVEL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.loadLevel === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      loadLevel: option.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "equipmentAccess" ? (
            <div className="grid gap-3">
              {EQUIPMENT_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.equipmentAccess === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      equipmentAccess: option.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {currentStep.key === "gender" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {GENDER_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={answers.gender === option.value}
                  title={option.label}
                  description="Dipakai hanya untuk minor adjustment."
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      gender: option.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <div
              className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-red-100"
              aria-live="polite"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="hidden text-xs text-text-muted sm:block">
              {stepIndex === STEPS.length - 1
                ? "Langkah terakhir. Setelah ini kami siapkan review plan."
                : "Kamu masih bisa ubah semua jawaban di review nanti."}
            </div>
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="ml-auto h-12 min-w-[170px] rounded-2xl bg-emerald text-[#08110D] hover:bg-emerald-dark"
            >
              {stepIndex === STEPS.length - 1 ? "Generate Plan" : "Lanjut"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
