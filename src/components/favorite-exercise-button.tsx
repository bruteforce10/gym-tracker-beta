"use client";

import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";

import { toggleFavoriteExercise } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoriteExerciseButtonProps = {
  exerciseId: string;
  initialFavorite: boolean;
  className?: string;
  onFavoriteChange?: (nextValue: boolean) => void;
};

export default function FavoriteExerciseButton({
  exerciseId,
  initialFavorite,
  className,
  onFavoriteChange,
}: FavoriteExerciseButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      aria-label={
        isFavorite ? "Hapus dari favorit exercise" : "Tambah ke favorit exercise"
      }
      title={isFavorite ? "Hapus favorit" : "Tambah favorit"}
      className={cn(
        "rounded-full border border-white/10 bg-white/5 text-text-muted transition-colors hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-300",
        isFavorite && "border-amber-300/35 bg-amber-300/10 text-amber-300",
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const optimisticNext = !isFavorite;
        setIsFavorite(optimisticNext);
        onFavoriteChange?.(optimisticNext);

        startTransition(async () => {
          const result = await toggleFavoriteExercise(exerciseId);

          if (!result.success) {
            setIsFavorite(!optimisticNext);
            onFavoriteChange?.(!optimisticNext);
            return;
          }

          setIsFavorite(result.favorited);
          onFavoriteChange?.(result.favorited);
        });
      }}
    >
      <Star
        className={cn("transition-transform", isPending && "scale-90")}
        fill={isFavorite ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </Button>
  );
}
