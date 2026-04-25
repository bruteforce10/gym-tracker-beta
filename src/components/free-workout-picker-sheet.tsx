"use client";

import { Flame, Plus } from "lucide-react";

import type { FavoriteAwareExerciseItem } from "@/actions/exercises";
import FreeWorkoutExerciseBrowser from "@/components/free-workout-exercise-browser";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type FreeWorkoutPickerSheetProps = {
  open: boolean;
  selectedIds: Set<string>;
  excludeIds?: Set<string>;
  onOpenChange: (open: boolean) => void;
  onToggleExercise: (exercise: FavoriteAwareExerciseItem) => void;
  onConfirm: () => void;
};

export default function FreeWorkoutPickerSheet({
  open,
  selectedIds,
  excludeIds,
  onOpenChange,
  onToggleExercise,
  onConfirm,
}: FreeWorkoutPickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] rounded-t-[30px] border-t border-white/8 bg-[#0B0D12] px-0"
      >
        <SheetHeader className="border-b border-white/8 px-5 py-5">
          <SheetTitle className="flex items-center gap-2 text-left text-xl">
            <Flame className="h-4 w-4 text-amber-300" aria-hidden="true" />
            Tambah Exercise
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Pilih exercise baru tanpa menghentikan stopwatch. Exercise tambahan akan
            masuk ke antrean workout yang sedang berjalan.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5">
          <FreeWorkoutExerciseBrowser
            selectedIds={selectedIds}
            excludeIds={excludeIds}
            onToggleExercise={onToggleExercise}
            compact
          />
        </div>

        <div className="border-t border-white/8 bg-[#090B10]/95 px-5 py-4 backdrop-blur-xl">
          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
            onClick={onConfirm}
            disabled={selectedIds.size === 0}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Tambahkan {selectedIds.size} Exercise
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
