import { Search } from "lucide-react";

import { getExerciseCatalog } from "@/actions/exercises";
import ExercisesFeed from "@/components/exercises-feed";

type ExercisePageProps = {
  searchParams: Promise<{
    q?: string;
    bucket?: "upper" | "lower" | "all";
  }>;
};

export default async function ExercisesPage({ searchParams }: ExercisePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const bucket = params.bucket ?? "all";
  const exercises = await getExerciseCatalog({
    query,
    planBucket: bucket,
    limit: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Exercise Catalog
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Jelajahi katalog live dari Gym Fit.
        </p>
      </div>

      <form className="glass-card p-4 space-y-3" action="/exercises">
        <label htmlFor="exercise-search" className="text-xs font-medium text-text-muted block">
          Cari exercise
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-3">
          <Search className="w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            id="exercise-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Cari exercise…"
            autoComplete="off"
            className="w-full h-11 bg-transparent text-sm text-foreground placeholder:text-text-muted/70 outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "all", label: "Semua" },
            { value: "upper", label: "Upper" },
            { value: "lower", label: "Lower" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                bucket === option.value
                  ? "border-emerald/40 bg-emerald text-[#0A0A0F]"
                  : "border-border-subtle bg-surface-elevated text-text-muted"
              }`}
            >
              <input
                type="radio"
                name="bucket"
                value={option.value}
                defaultChecked={bucket === option.value}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        <button className="w-full h-11 rounded-xl bg-emerald hover:bg-emerald-dark text-[#0A0A0F] text-sm font-semibold transition-colors">
          Terapkan Filter
        </button>
      </form>

      <ExercisesFeed exercises={exercises} />
    </div>
  );
}
