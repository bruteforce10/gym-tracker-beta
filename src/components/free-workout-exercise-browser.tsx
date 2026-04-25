"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Search, Sparkles } from "lucide-react";

import {
  getExerciseQuickPickerData,
  type FavoriteAwareExerciseItem,
} from "@/actions/exercises";
import ExercisePickerCard from "@/components/exercise-picker-card";
import { Badge } from "@/components/ui/badge";
import { useDebounceCallback } from "@/hooks/use-debounce-callback";
import type { ExercisePlanBucket } from "@/lib/exercise-catalog";

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

type FreeWorkoutExerciseBrowserProps = {
  selectedIds: Set<string>;
  onToggleExercise: (exercise: FavoriteAwareExerciseItem) => void;
  planBucket?: ExercisePlanBucket | "all";
  excludeIds?: Set<string>;
  compact?: boolean;
};

export default function FreeWorkoutExerciseBrowser({
  selectedIds,
  onToggleExercise,
  planBucket = "all",
  excludeIds,
  compact = false,
}: FreeWorkoutExerciseBrowserProps) {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [sections, setSections] = useState<QuickPickerSections>(EMPTY_SECTIONS);
  const [isPending, startTransition] = useTransition();
  const updateQuery = useDebounceCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, 300);

  useEffect(() => {
    let cancelled = false;
    const isSearching = query.trim().length > 0;

    startTransition(async () => {
      const nextSections = await getExerciseQuickPickerData({
        query,
        planBucket,
        limitFavorites: compact ? 8 : 10,
        limitRecent: 3,
        limitResults: isSearching ? 3 : compact ? 18 : 24,
      });

      if (!cancelled) {
        setSections(nextSections);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [compact, planBucket, query]);

  const visibleSections = useMemo(() => {
    const blockedIds = excludeIds ?? new Set<string>();
    const filterItems = (items: FavoriteAwareExerciseItem[]) =>
      items.filter((item) => !blockedIds.has(item.id));

    return {
      favorites: filterItems(sections.favorites),
      recent: filterItems(sections.recent),
      results: filterItems(sections.results),
    };
  }, [excludeIds, sections]);

  const hasItems =
    visibleSections.favorites.length > 0 ||
    visibleSections.recent.length > 0 ||
    visibleSections.results.length > 0;
  const isSearching = queryInput.trim().length > 0;

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
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {title}
          </p>
          <Badge variant="outline" className={badgeClass}>
            {items.length}
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((exercise) => {
            const selected = selectedIds.has(exercise.id);

            return (
              <ExercisePickerCard
                key={exercise.id}
                exercise={exercise}
                selected={selected}
                showThumbnail
                onSelect={() => onToggleExercise(exercise)}
                onFavoriteChange={(nextValue) =>
                  updateFavoriteState(exercise.id, nextValue)
                }
                selectionIndicator={
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition-colors ${
                      selected
                        ? "border-emerald/40 bg-emerald text-[#09110E]"
                        : "border-white/10 bg-white/[0.04] text-text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </div>
                }
              />
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_38%),rgba(255,255,255,0.03)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-colors focus-within:border-amber-300/35 focus-within:ring-2 focus-within:ring-amber-300/20">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Live Search
            </p>
            <input
              id="free-workout-search"
              name="free-workout-search"
              type="search"
              aria-label="Cari exercise untuk free workout"
              value={queryInput}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQueryInput(nextQuery);
                updateQuery.run(nextQuery);
              }}
              placeholder="Cari exercise favoritmu atau jelajah semua katalog..."
              autoComplete="off"
              className="mt-1 min-h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            Favorit diprioritaskan biar pilih exercise terasa cepat.
          </div>
          <span>{selectedIds.size} dipilih</span>
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {isSearching ? (
          <>
            {renderSection("Hasil Pencarian", visibleSections.results, "search")}
            {!isPending && visibleSections.results.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
                Hasil pencarian tidak ada.
              </div>
            ) : null}
            {renderSection("Recent", visibleSections.recent, "recent")}
            {renderSection("Favorite", visibleSections.favorites, "favorite")}
          </>
        ) : (
          <>
            {renderSection("Favorite", visibleSections.favorites, "favorite")}
            {renderSection("Recent", visibleSections.recent, "recent")}
            {renderSection("Explore Semua Exercise", visibleSections.results, "search")}
          </>
        )}

        {!isPending && !hasItems ? (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
            Tidak ada exercise yang cocok. Coba kata kunci lain atau buka tab favoritmu.
          </div>
        ) : null}

        {isPending ? (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
            Menyusun favorit, recent, dan katalog exercise...
          </div>
        ) : null}
      </div>
    </div>
  );
}
