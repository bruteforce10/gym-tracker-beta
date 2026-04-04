"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { searchExercises } from "@/actions/exercises";
import { CATEGORY_LABELS, type ExerciseCatalogItem, type ExercisePlanBucket } from "@/lib/exercise-catalog";

interface ExercisePickerProps {
  inputId: string;
  label: string;
  value: ExerciseCatalogItem | null;
  onChange: (exercise: ExerciseCatalogItem | null) => void;
  placeholder?: string;
  planBucket?: ExercisePlanBucket | "all";
  helperText?: string;
}

export default function ExercisePicker({
  inputId,
  label,
  value,
  onChange,
  placeholder = "Cari exercise…",
  planBucket = "all",
  helperText,
}: ExercisePickerProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<ExerciseCatalogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    startTransition(async () => {
      const nextResults = await searchExercises({
        query,
        planBucket,
        limit: 18,
      });

      if (!cancelled) {
        setResults(nextResults);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, planBucket, query]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-xs text-text-muted font-medium">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-danger transition-colors"
            aria-label={`Hapus pilihan ${label}`}
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden">
        <div className="flex items-center gap-2 px-3">
          <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
          <input
            id={inputId}
            name={inputId}
            type="search"
            value={query || value?.name || ""}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full h-11 bg-transparent text-sm text-foreground placeholder:text-text-muted/70 outline-none"
          />
        </div>

        {isOpen && (
          <div className="border-t border-border-subtle">
            <div className="max-h-64 overflow-y-auto overscroll-contain p-2 space-y-1">
              {results.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onChange(exercise);
                    setQuery(exercise.name);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    value?.id === exercise.id
                      ? "border-emerald/40 bg-emerald/10"
                      : "border-transparent bg-surface hover:border-emerald/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {exercise.name}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {exercise.primaryLabel}
                        {exercise.category ? ` · ${CATEGORY_LABELS[exercise.category]}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
                    </span>
                  </div>
                </button>
              ))}

              {!isPending && results.length === 0 && (
                <div className="rounded-lg bg-surface px-3 py-4 text-center text-xs text-text-muted">
                  Tidak ada exercise yang cocok.
                </div>
              )}

              {isPending && (
                <div className="rounded-lg bg-surface px-3 py-4 text-center text-xs text-text-muted">
                  Mencari exercise…
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && <p className="text-[11px] text-text-muted">{helperText}</p>}
    </div>
  );
}
