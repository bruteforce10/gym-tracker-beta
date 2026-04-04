"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
} from "@/lib/exercise-catalog";

type ExercisesFeedProps = {
  exercises: ExerciseCatalogItem[];
};

const INITIAL_BATCH_SIZE = 18;
const BATCH_SIZE = 18;

export default function ExercisesFeed({ exercises }: ExercisesFeedProps) {
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

          return (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.slug}`}
              className={`glass-card block bg-linear-to-br p-4 ${gradient}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {exercise.primaryLabel}
                    {exercise.category
                      ? ` · ${CATEGORY_LABELS[exercise.category]}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-text-muted">
                  {exercise.trainingStyle === "compound"
                    ? "Compound"
                    : "Isolation"}
                </span>
              </div>
            </Link>
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
