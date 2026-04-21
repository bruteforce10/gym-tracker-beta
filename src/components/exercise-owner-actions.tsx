"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { archiveCustomExerciseByOwner } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ExerciseOwnerActionsProps = {
  exerciseId: string;
  exerciseName: string;
  editHref: string;
};

export default function ExerciseOwnerActions({
  exerciseId,
  exerciseName,
  editHref,
}: ExerciseOwnerActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href={editHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit Exercise
        </Link>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                className="h-11 rounded-xl px-4 text-sm font-semibold"
              />
            }
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </DialogTrigger>

          <DialogContent
            showCloseButton={false}
            className="max-w-md rounded-[28px] border border-white/10 bg-[#0B0D12] p-0"
          >
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-xl font-bold text-foreground">
                Hapus exercise ini?
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-text-muted">
                Exercise{" "}
                <span className="font-semibold text-foreground">
                  {exerciseName}
                </span>{" "}
                akan dihapus dari katalog milikmu
              </DialogDescription>
            </DialogHeader>

            {message ? (
              <div className="mx-6 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
                {message}
              </div>
            ) : null}

            <DialogFooter className="rounded-b-[28px] border-white/8 bg-white/[0.02] px-6 py-4 mb-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setMessage("");
                  setOpen(false);
                }}
                className="h-11 rounded-xl border-border-subtle text-text-muted hover:text-foreground"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  setMessage("");
                  startTransition(async () => {
                    const result =
                      await archiveCustomExerciseByOwner(exerciseId);

                    if (!result.success) {
                      setMessage(result.error ?? "Gagal menghapus exercise.");
                      return;
                    }

                    setOpen(false);
                    router.push("/exercises");
                    router.refresh();
                  });
                }}
                className="h-11 rounded-xl"
              >
                {isPending ? "Menghapus..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-text-muted">
        Tombol ini hanya muncul untuk custom exercise yang kamu buat sendiri.
      </p>
    </div>
  );
}
