"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, HeartPulse, Search } from "lucide-react";

import {
  getExerciseQuickPickerData,
  type FavoriteAwareExerciseItem,
} from "@/actions/exercises";
import ExercisePickerCard from "@/components/exercise-picker-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDebounceCallback } from "@/hooks/use-debounce-callback";
import type { ExercisePlanBucket } from "@/lib/exercise-catalog";

type SupersetPickerSheetProps = {
  open: boolean;
  primaryExerciseName: string;
  planBucket?: ExercisePlanBucket | "all";
  onOpenChange: (open: boolean) => void;
  onConfirm: (exercise: FavoriteAwareExerciseItem) => void;
};

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

export default function SupersetPickerSheet({
  open,
  primaryExerciseName,
  planBucket = "all",
  onOpenChange,
  onConfirm,
}: SupersetPickerSheetProps) {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedExercise, setSelectedExercise] =
    useState<FavoriteAwareExerciseItem | null>(null);
  const [sections, setSections] = useState<QuickPickerSections>(EMPTY_SECTIONS);
  const [isPending, startTransition] = useTransition();
  const updateQuery = useDebounceCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, 300);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    startTransition(async () => {
      const nextSections = await getExerciseQuickPickerData({
        query,
        planBucket,
        limitFavorites: 10,
        limitRecent: 10,
        limitResults: 18,
      });

      if (!cancelled) {
        setSections(nextSections);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, planBucket, query]);

  const hasItems = useMemo(
    () =>
      sections.favorites.length > 0 ||
      sections.recent.length > 0 ||
      sections.results.length > 0,
    [sections]
  );

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
    setSelectedExercise((current: FavoriteAwareExerciseItem | null) =>
      current?.id === exerciseId ? { ...current, isFavorite: nextValue } : current
    );
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
          {items.map((exercise) => (
            <ExercisePickerCard
              key={exercise.id}
              exercise={exercise}
              selected={selectedExercise?.id === exercise.id}
              onSelect={() => setSelectedExercise(exercise)}
              onFavoriteChange={(nextValue) =>
                updateFavoriteState(exercise.id, nextValue)
              }
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          updateQuery.cancel();
          setQueryInput("");
          setQuery("");
          setSelectedExercise(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92vh] rounded-t-[30px] border-t border-white/8 bg-[#0B0D12] px-0"
      >
        <SheetHeader className="border-b border-white/8 px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-left text-xl">
            <HeartPulse className="h-4 w-4 text-amber-300" aria-hidden="true" />
            Tambah Superset
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Pilih pasangan cepat untuk {primaryExerciseName}. Favorit dan recent
            diletakkan paling atas supaya tidak perlu cari dari nol.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Quick Find
                </p>
                <input
                  id="superset-search"
                  name="superset-search"
                  type="search"
                  value={queryInput}
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setQueryInput(nextQuery);
                    updateQuery.run(nextQuery);
                  }}
                  placeholder="Cari exercise untuk dipasangkan..."
                  autoComplete="off"
                  className="mt-1 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 pb-28">
            {renderSection("Favorite", sections.favorites, "favorite")}
            {renderSection("Recent", sections.recent, "recent")}
            {renderSection(
              queryInput.trim() ? "Hasil Pencarian" : "Explore",
              sections.results,
              "search"
            )}

            {!isPending && !hasItems ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
                Belum ada kandidat yang muncul. Coba cari exercise lain atau
                tandai beberapa favorit dulu.
              </div>
            ) : null}

            {isPending ? (
              <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
                Menyusun daftar favorite, recent, dan hasil pencarian...
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/8 bg-[#090B10]/95 px-5 py-4 backdrop-blur-xl">
          {selectedExercise ? (
            <div className="rounded-[24px] border border-emerald/20 bg-emerald/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald/80">
                Konfirmasi Pairing
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <span className="truncate font-semibold">{primaryExerciseName}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
                <span className="truncate font-semibold">{selectedExercise.name}</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Exercise tambahan ini akan dipakai sebagai pasangan untuk sisa set
                yang masih berjalan.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-border-subtle bg-transparent text-text-muted hover:text-foreground"
                  onClick={() => setSelectedExercise(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
                  onClick={() => onConfirm(selectedExercise)}
                >
                  Ya, mulai superset
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-text-muted">
              Pilih satu exercise dulu untuk mengaktifkan superset.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
