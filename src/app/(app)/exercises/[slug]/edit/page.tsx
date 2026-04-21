import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { getExerciseBySlug } from "@/actions/exercises";
import CustomExerciseForm from "@/components/custom-exercise-form";
import { getViewerContext } from "@/lib/auth-guards";

type UserExerciseEditPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function UserExerciseEditPage({
  params,
}: UserExerciseEditPageProps) {
  const viewer = await getViewerContext();
  const { slug } = await params;
  const exercise = await getExerciseBySlug(slug);

  if (
    !exercise ||
    exercise.source !== "user" ||
    exercise.createdByUserId !== viewer.userId ||
    exercise.status === "archived"
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={`/exercises/${exercise.slug}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke detail exercise
        </Link>

        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Edit Custom Exercise
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Perbarui detail custom exercise milikmu lalu simpan untuk kembali ke halaman detail.
          </p>
        </div>
      </div>

      <CustomExerciseForm
        mode="edit"
        exerciseId={exercise.id}
        source="user"
        editorRole="user"
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
        cancelHref={`/exercises/${exercise.slug}`}
        successHref={`/exercises/${exercise.slug}`}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
