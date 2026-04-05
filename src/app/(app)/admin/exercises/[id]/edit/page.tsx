import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import { notFound } from "next/navigation";

import { getAdminExerciseById } from "@/actions/exercises";
import CustomExerciseForm from "@/components/custom-exercise-form";
import { requireAdmin } from "@/lib/auth-guards";

type AdminExerciseEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminExerciseEditPage({
  params,
}: AdminExerciseEditPageProps) {
  await requireAdmin();
  const { id } = await params;
  const exercise = await getAdminExerciseById(id);

  if (!exercise) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke dashboard exercise
        </Link>

        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald/15 bg-emerald/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Admin Edit
          </div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Edit Exercise
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Perbarui detail exercise lalu simpan untuk kembali ke dashboard admin.
          </p>
        </div>
      </div>

      <CustomExerciseForm
        mode="edit"
        exerciseId={exercise.id}
        source={exercise.source === "system" ? "system" : "user"}
        initialValues={{
          name: exercise.name,
          bodyPart: exercise.bodyParts[0] ?? "",
          equipment: exercise.equipments[0] ?? "",
          type: exercise.exerciseType ?? "",
          targetMuscles: exercise.targetMuscles.join(", "),
          secondaryMuscles: exercise.secondaryMuscles.join(", "),
          imageUrl: exercise.imageUrl ?? "",
          notes: exercise.notes ?? "",
        }}
        initialImageUrl={exercise.imageUrl}
        initialStatus={
          exercise.status === "flagged" || exercise.status === "archived"
            ? exercise.status
            : "published"
        }
        initialVisibility={exercise.visibility === "global" ? "global" : "private"}
        cancelHref="/admin/exercises"
        successHref="/admin/exercises"
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
