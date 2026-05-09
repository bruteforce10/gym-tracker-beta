"use client";

import { Check, Flame, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type FreeWorkoutCompletionPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExercise: () => void;
  onFinishWorkout: () => void;
};

export default function FreeWorkoutCompletionPopup({
  open,
  onOpenChange,
  onAddExercise,
  onFinishWorkout,
}: FreeWorkoutCompletionPopupProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[60vh] rounded-t-[30px] border-t border-white/8 bg-[#0B0D12] px-0"
      >
        <SheetHeader className="border-b border-white/8 p-5">
          <SheetTitle className="flex items-center gap-2 text-left text-xl">
            <Flame className="size-4 text-amber-300" aria-hidden="true" />
            Workout Hampir Selesai
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-text-muted">
            Semua exercise di antrean sudah selesai. Mau tambah exercise lagi
            atau selesaikan workout?
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 p-5">
          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-amber-300 font-semibold text-[#140E02] hover:bg-amber-200"
            onClick={onAddExercise}
          >
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Tambah Exercise
          </Button>
          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
            onClick={onFinishWorkout}
          >
            <Check className="mr-1.5 size-4" aria-hidden="true" />
            Selesaikan Workout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
