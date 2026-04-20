"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { Search, Sparkles, X } from "lucide-react";

import {
  getExerciseQuickPickerData,
  type FavoriteAwareExerciseItem,
} from "@/actions/exercises";
import FavoriteExerciseButton from "@/components/favorite-exercise-button";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";

interface ExercisePickerProps {
  inputId: string;
  label: string;
  value: ExerciseCatalogItem | null;
  onChange: (exercise: ExerciseCatalogItem | null) => void;
  placeholder?: string;
  planBucket?: ExercisePlanBucket | "all";
  helperText?: string;
}

type QuickPickerSections = {
  favorites: FavoriteAwareExerciseItem[];
  recent: FavoriteAwareExerciseItem[];
  results: FavoriteAwareExerciseItem[];
};

const EMPTY_SECTIONS: QuickPickerSections = {
  favorites: [],
  recent: [],
  results: [],
};

export default function ExercisePicker({
  inputId,
  label,
  value,
  onChange,
  placeholder = "Cari exercise...",
  planBucket = "all",
  helperText,
}: ExercisePickerProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const deferredQuery = useDeferredValue(query);
  const [sections, setSections] = useState<QuickPickerSections>(EMPTY_SECTIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    startTransition(async () => {
      const nextSections = await getExerciseQuickPickerData({
        query: deferredQuery,
        planBucket,
        limitResults: 18,
      });

      if (!cancelled) {
        setSections(nextSections);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [deferredQuery, isOpen, planBucket]);

  const hasItems =
    sections.favorites.length > 0 ||
    sections.recent.length > 0 ||
    sections.results.length > 0;

  const updateFavoriteState = (exerciseId: string, nextValue: boolean) => {
    setSections((current) => ({
      favorites: current.favorites.map((item) =>
        item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
      ),
      recent: current.recent.map((item) =>
        item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
      ),
      results: current.results.map((item) =>
        item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
      ),
    }));
  };

  const renderSection = (
    title: string,
    items: FavoriteAwareExerciseItem[],
    tone: "favorite" | "recent" | "search"
  ) => {
    if (items.length === 0) return null;

    const badgeClass =
      tone === "favorite"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
        : tone === "recent"
          ? "border-sky-300/20 bg-sky-300/10 text-sky-200"
          : "border-white/10 bg-white/5 text-text-muted";

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {title}
          </p>
          <Badge variant="outline" className={badgeClass}>
            {items.length}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => {
                onChange(exercise);
                setQuery(exercise.name);
                setIsOpen(false);
              }}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                value?.id === exercise.id
                  ? "border-emerald/40 bg-emerald/10"
                  : "border-transparent bg-surface hover:border-emerald/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
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
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {exercise.primaryLabel}
                    {exercise.category
                      ? ` · ${CATEGORY_LABELS[exercise.category as keyof typeof CATEGORY_LABELS]}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[10px] text-text-muted">
                    {exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
                  </span>
                  <FavoriteExerciseButton
                    exerciseId={exercise.id}
                    initialFavorite={exercise.isFavorite}
                    onFavoriteChange={(nextValue) =>
                      updateFavoriteState(exercise.id, nextValue)
                    }
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
          {label}
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-danger"
            aria-label={`Hapus pilihan ${label}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Reset
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated">
        <div className="flex items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
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
            className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
          />
        </div>

        {isOpen ? (
          <div className="border-t border-border-subtle">
            <div className="max-h-80 overflow-y-auto overscroll-contain p-2">
              <div className="flex flex-col gap-3">
                {renderSection("Favorite", sections.favorites, "favorite")}
                {renderSection("Recent", sections.recent, "recent")}
                {renderSection(
                  deferredQuery ? "Hasil Pencarian" : "Explore",
                  sections.results,
                  "search"
                )}
              </div>

              {!isPending && !hasItems ? (
                <div className="rounded-lg bg-surface px-3 py-4 text-center text-xs text-text-muted">
                  Tidak ada exercise yang cocok.
                </div>
              ) : null}

              {isPending ? (
                <div className="rounded-lg bg-surface px-3 py-4 text-center text-xs text-text-muted">
                  Mencari exercise...
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p className="text-[11px] text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
