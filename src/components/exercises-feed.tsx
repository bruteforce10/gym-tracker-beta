"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import AddToPlanSheet from "@/components/add-to-plan-sheet";
import ExerciseImage from "@/components/exercise-image";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
} from "@/lib/exercise-catalog";

type ExercisesFeedProps = {
  exercises: ExerciseCatalogItem[];
  plans: Array<{
    id: string;
    name: string;
    type: string;
    exercises: Array<{
      id: string;
      exerciseId: string;
    }>;
  }>;
};

const INITIAL_BATCH_SIZE = 18;
const BATCH_SIZE = 18;

function getExerciseMonogram(name: string) {
  const tokens = name
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return "EX";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

export default function ExercisesFeed({
  exercises,
  plans,
}: ExercisesFeedProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_BATCH_SIZE, exercises.length),
  );
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < exercises.length;
  const visibleExercises = exercises.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_BATCH_SIZE, exercises.length));
  }, [exercises]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        startTransition(() => {
          setVisibleCount((current) =>
            Math.min(current + BATCH_SIZE, exercises.length),
          );
        });
      },
      {
        rootMargin: "280px 0px",
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [exercises.length, hasMore, startTransition]);

  if (exercises.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-text-muted">
          Tidak ada exercise yang cocok dengan filter saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visibleExercises.map((exercise) => {
          const gradient = exercise.category
            ? CATEGORY_GRADIENTS[exercise.category]
            : "from-slate-500/20 to-slate-400/10";
          const monogram = getExerciseMonogram(exercise.name);

          return (
            <div
              key={exercise.id}
              className={`glass-card overflow-hidden bg-linear-to-br transition-colors duration-200 hover:border-emerald/20 hover:shadow-[0_18px_40px_rgba(10,14,22,0.18)] ${gradient}`}
            >
              <div className="flex flex-col">
                <div className="relative w-full overflow-hidden border-b border-white/8 bg-white/95">
                  <ExerciseImage
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    width={1200}
                    height={900}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    fallback={
                      <div
                        className={`flex h-32 w-full items-center justify-center bg-linear-to-br ${gradient}`}
                      >
                        <span
                          className="text-lg font-black tracking-[0.18em] text-white/90 sm:text-xl"
                          style={{ fontFamily: "Outfit, sans-serif" }}
                        >
                          {monogram}
                        </span>
                      </div>
                    }
                  />
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground sm:text-[17px]">
                        {exercise.name}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {exercise.primaryLabel}
                        {exercise.category
                          ? ` · ${CATEGORY_LABELS[exercise.category]}`
                          : ""}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-text-muted">
                      {exercise.trainingStyle === "compound"
                        ? "Compound"
                        : "Isolation"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {exercise.source === "user" ? (
                      <span className="rounded-full border border-emerald/20 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
                        Custom
                      </span>
                    ) : null}
                    {exercise.bodyParts.slice(0, 2).map((part) => (
                      <span
                        key={`${exercise.id}-${part}`}
                        className="rounded-full border border-white/8 bg-[#0B0E14]/45 px-2 py-0.5 text-[10px] font-medium text-text-muted"
                      >
                        {part}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <AddToPlanSheet
                      exercise={exercise}
                      plans={plans}
                      triggerLabel="Masuk Plan"
                      triggerClassName="h-11 w-full rounded-xl border-border-subtle bg-surface-elevated text-foreground hover:bg-surface"
                    />
                    <Link
                      href={`/exercises/${exercise.slug}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald/20 bg-emerald/10 px-4 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/20 focus-visible:ring-2 focus-visible:ring-emerald/30"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="glass-card p-4 text-center">
          <p className="text-xs text-text-muted">
            {isPending
              ? "Memuat exercise berikutnya..."
              : "Scroll lagi untuk membuka batch berikutnya."}
          </p>
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                setVisibleCount((current) =>
                  Math.min(current + BATCH_SIZE, exercises.length),
                );
              });
            }}
            className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-emerald/30 px-4 text-xs font-semibold text-emerald transition-colors hover:border-emerald/50 hover:bg-emerald/10"
          >
            Muat lebih banyak
          </button>
        </div>
      ) : null}
    </div>
  );
}
