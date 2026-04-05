import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, PlayCircle } from "lucide-react";

import { getExerciseBySlug } from "@/actions/exercises";
import ExerciseImage from "@/components/exercise-image";
import { CATEGORY_GRADIENTS, CATEGORY_LABELS } from "@/lib/exercise-catalog";

type ExerciseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getExerciseMonogram(name: string) {
  const tokens = name
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return "EX";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function TagList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <section className="glass-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="text-xs px-2.5 py-1 rounded-full bg-surface-elevated border border-border-subtle text-text-muted"
          >
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}

export default async function ExerciseDetailPage({
  params,
}: ExerciseDetailPageProps) {
  const { slug } = await params;
  const exercise = await getExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  const gradient = exercise.category
    ? CATEGORY_GRADIENTS[exercise.category]
    : "from-slate-500/20 to-slate-400/10";
  const monogram = getExerciseMonogram(exercise.name);

  return (
    <div className="space-y-5">
      <Link
        href="/exercises"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Kembali ke katalog
      </Link>

      <section
        className={`glass-card p-5 space-y-5 bg-linear-to-br ${gradient}`}
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-text-muted font-semibold">
            {exercise.category
              ? CATEGORY_LABELS[exercise.category]
              : "Exercise"}
          </p>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {exercise.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            {exercise.gender && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-surface/60 text-text-muted">
                {exercise.gender}
              </span>
            )}
            {exercise.exerciseType && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-surface/60 text-text-muted">
                {exercise.exerciseType}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-surface/60 text-text-muted">
              {exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {exercise.videoUrl ? (
            <div className="glass-card p-3 space-y-3">
              <div className="aspect-video rounded-2xl overflow-hidden bg-[#05060A] border border-border-subtle">
                <video
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                  src={exercise.videoUrl}
                />
              </div>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald hover:text-emerald-light"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                Buka video di tab baru
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          ) : (
            <div className="glass-card p-3 space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
                <ExerciseImage
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  width={1200}
                  height={900}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  fallback={
                    <div
                      className={`flex aspect-[4/3] w-full items-center justify-center bg-linear-to-br ${gradient}`}
                    >
                      <span
                        className="text-5xl font-black tracking-[0.22em] text-white/90 sm:text-6xl"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                      >
                        {monogram}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <TagList title="Body Parts" values={exercise.bodyParts} />
      <TagList title="Equipments" values={exercise.equipments} />
      <TagList title="Target Muscles" values={exercise.targetMuscles} />
      <TagList title="Secondary Muscles" values={exercise.secondaryMuscles} />
    </div>
  );
}
