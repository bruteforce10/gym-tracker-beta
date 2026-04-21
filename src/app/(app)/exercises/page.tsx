import Link from "next/link";
import { Plus } from "lucide-react";

import { getExerciseCatalog } from "@/actions/exercises";
import { getWorkoutPlans } from "@/actions/plans";
import ExerciseFilterForm from "@/components/exercise-filter-form";
import ExercisesFeed from "@/components/exercises-feed";
import {
  BODY_PART_FILTER_OPTIONS,
  EQUIPMENT_FILTER_OPTIONS,
  TRAINING_TYPE_FILTER_OPTIONS,
  normalizeExerciseFilterValue,
} from "@/lib/exercise-filters";

type ExercisePageProps = {
  searchParams: Promise<{
    q?: string;
    bodyPart?: string;
    equipment?: string;
    type?: string;
  }>;
};

export default async function ExercisesPage({
  searchParams,
}: ExercisePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const bodyPart = normalizeExerciseFilterValue(
    params.bodyPart,
    BODY_PART_FILTER_OPTIONS,
  );
  const equipment = normalizeExerciseFilterValue(
    params.equipment,
    EQUIPMENT_FILTER_OPTIONS,
  );
  const type = normalizeExerciseFilterValue(
    params.type,
    TRAINING_TYPE_FILTER_OPTIONS,
  );
  const exercises = await getExerciseCatalog({
    query,
    bodyPart,
    equipment,
    type,
    limit: 300,
  });
  const plans = await getWorkoutPlans();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Exercise
            <br />
            Catalog
          </h1>
        </div>
        <Link
          href="/exercises/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald px-4 text-sm font-semibold text-[#0A0A0F] transition-colors hover:bg-emerald-dark"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Exercise
        </Link>
      </div>

      <ExerciseFilterForm
        key={`${query}:${bodyPart}:${equipment}:${type}`}
        query={query}
        bodyPart={bodyPart}
        equipment={equipment}
        type={type}
        bodyPartOptions={BODY_PART_FILTER_OPTIONS}
        equipmentOptions={EQUIPMENT_FILTER_OPTIONS}
        typeOptions={TRAINING_TYPE_FILTER_OPTIONS}
      />

      <ExercisesFeed exercises={exercises} plans={plans} />
    </div>
  );
}
