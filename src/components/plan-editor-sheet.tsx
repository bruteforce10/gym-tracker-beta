"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Link2,
  PencilLine,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getExerciseQuickPickerData,
  type FavoriteAwareExerciseItem,
} from "@/actions/exercises";
import ExercisePickerCard from "@/components/exercise-picker-card";
import { createWorkoutPlan, updateWorkoutPlanExercises } from "@/actions/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CATEGORY_GRADIENTS,
  CATEGORY_LABELS,
  type ExerciseCatalogItem,
  type ExercisePlanBucket,
} from "@/lib/exercise-catalog";

type PlanExercise = {
  id: string;
  planId: string;
  exerciseId: string;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  supersetWithNext: boolean;
  order: number;
  exercise: ExerciseCatalogItem;
};

type Plan = {
  id: string;
  name: string;
  type: string;
  exercises: PlanExercise[];
};

type EditablePlanExercise = {
  exerciseId: string;
  exercise: ExerciseCatalogItem;
  defaultSets: number;
  defaultReps: number;
  restTime: number;
  supersetWithNext: boolean;
  order: number;
};

interface PlanEditorSheetProps {
  plan: Plan;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type PlanPickerSections = {
  favorites: FavoriteAwareExerciseItem[];
  results: FavoriteAwareExerciseItem[];
};

const EMPTY_PICKER_SECTIONS: PlanPickerSections = {
  favorites: [],
  results: [],
};

function normalizeOrder(items: EditablePlanExercise[]) {
  return items.map((item, index) => {
    const isLast = index === items.length - 1;

    return {
      ...item,
      order: index,
      supersetWithNext: isLast ? false : item.supersetWithNext,
    };
  });
}

function buildEditablePlanExercise(exercise: ExerciseCatalogItem): EditablePlanExercise {
  return {
    exerciseId: exercise.id,
    exercise,
    defaultSets: exercise.defaultSets,
    defaultReps: exercise.defaultReps,
    restTime: exercise.defaultRestTime,
    supersetWithNext: false,
    order: 0,
  };
}

function formatPrescription(item: EditablePlanExercise) {
  return `${item.defaultSets} set · ${item.defaultReps} reps · ${item.restTime} dtk`;
}

function parseStepValue(rawValue: string, minimum: number) {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.max(minimum, parsed);
}

function SortableExerciseCard({
  index,
  item,
  onEdit,
  onRemove,
  onToggleSuperset,
  canToggleSuperset,
}: {
  index: number;
  item: EditablePlanExercise;
  onEdit: (exerciseId: string) => void;
  onRemove: (exerciseId: string) => void;
  onToggleSuperset: (index: number) => void;
  canToggleSuperset: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.exerciseId,
  });

  const gradient = item.exercise.category
    ? CATEGORY_GRADIENTS[item.exercise.category]
    : "from-slate-500/20 to-slate-400/10";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`glass-card touch-manipulation p-3 transition-shadow ${
        isDragging
          ? "z-10 scale-[1.01] border border-emerald/40 shadow-[0_24px_60px_rgba(16,185,129,0.16)]"
          : "border border-white/6"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Geser untuk mengurutkan ${item.exercise.name}`}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-elevated text-text-muted transition-colors hover:border-emerald/30 hover:text-emerald focus-visible:border-emerald/40 focus-visible:ring-2 focus-visible:ring-emerald/30 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                  {index + 1}
                </span>
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.exercise.name}
                </p>
              </div>
              <p className="mt-1 truncate text-[11px] text-text-muted">
                {item.exercise.primaryLabel}
                {item.exercise.category
                  ? ` · ${CATEGORY_LABELS[item.exercise.category]}`
                  : ""}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border border-white/5 bg-linear-to-r px-2 py-0.5 text-[10px] font-medium text-foreground/80 ${gradient}`}
            >
              {item.exercise.trainingStyle === "compound" ? "Compound" : "Isolation"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald/20 bg-emerald/10 px-2.5 py-1 text-[11px] font-medium text-emerald">
              {formatPrescription(item)}
            </span>
            {item.supersetWithNext ? (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                Superset dengan next
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onEdit(item.exerciseId)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-text-muted transition-colors hover:border-emerald/30 hover:text-foreground focus-visible:border-emerald/40 focus-visible:ring-2 focus-visible:ring-emerald/30"
            >
              <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onToggleSuperset(index)}
              disabled={!canToggleSuperset}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-colors ${
                item.supersetWithNext
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  : "border-border-subtle bg-surface text-text-muted hover:border-amber-300/30 hover:text-amber-200"
              } disabled:cursor-not-allowed disabled:opacity-40`}
              title={
                canToggleSuperset
                  ? "Pair dengan item berikutnya sebagai superset"
                  : "Item terakhir tidak bisa dipair ke item berikutnya"
              }
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              {item.supersetWithNext ? "Superset On" : "Superset"}
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.exerciseId)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-muted transition-colors hover:border-danger/30 hover:text-danger focus-visible:border-danger/40 focus-visible:ring-2 focus-visible:ring-danger/20"
              aria-label={`Hapus ${item.exercise.name} dari plan`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanEditorSheet({
  plan,
  open,
  onClose,
  onSaved,
}: PlanEditorSheetProps) {
  const router = useRouter();
  const isNew = !plan.id;
  const [planName, setPlanName] = useState(plan.name || "");
  const [planType, setPlanType] = useState<"upper" | "lower" | "custom">(
    (plan.type as "upper" | "lower" | "custom") || "custom"
  );
  const [selectedExercises, setSelectedExercises] = useState<EditablePlanExercise[]>(
    normalizeOrder(
      plan.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exercise: exercise.exercise,
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        restTime: exercise.restTime,
        supersetWithNext: exercise.supersetWithNext,
        order: exercise.order,
      }))
    )
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [pickerSections, setPickerSections] =
    useState<PlanPickerSections>(EMPTY_PICKER_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editorSets, setEditorSets] = useState("");
  const [editorReps, setEditorReps] = useState("");
  const [editorRest, setEditorRest] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPlanName(plan.name || "");
    setPlanType((plan.type as "upper" | "lower" | "custom") || "custom");
    setSelectedExercises(
      normalizeOrder(
        plan.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exercise: exercise.exercise,
          defaultSets: exercise.defaultSets,
          defaultReps: exercise.defaultReps,
          restTime: exercise.restTime,
          supersetWithNext: exercise.supersetWithNext,
          order: exercise.order,
        }))
      )
    );
    setEditingExerciseId(null);
  }, [plan]);

  const bucket: ExercisePlanBucket | "all" = useMemo(() => {
    if (planType === "custom") return "all";
    return planType;
  }, [planType]);

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      const nextSections = await getExerciseQuickPickerData({
        query: deferredQuery,
        planBucket: bucket,
        limitFavorites: 10,
        limitRecent: 0,
        limitResults: 12,
      });

      if (!cancelled) {
        setPickerSections({
          favorites: nextSections.favorites,
          results: nextSections.results,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bucket, deferredQuery]);

  useEffect(() => {
    if (!editingExerciseId) return;

    const item = selectedExercises.find(
      (exercise) => exercise.exerciseId === editingExerciseId
    );

    if (!item) {
      setEditingExerciseId(null);
    }
  }, [editingExerciseId, selectedExercises]);

  const selectedIds = new Set(
    selectedExercises.map((exercise) => exercise.exerciseId)
  );
  const hasPickerItems =
    pickerSections.favorites.length > 0 || pickerSections.results.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  const editingExercise =
    selectedExercises.find((exercise) => exercise.exerciseId === editingExerciseId) ?? null;

  const updateFavoriteState = (exerciseId: string, nextValue: boolean) => {
    setPickerSections((current) => ({
      favorites: current.favorites.map((item) =>
        item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
      ),
      results: current.results.map((item) =>
        item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
      ),
    }));
  };

  const toggleExercise = (exercise: ExerciseCatalogItem) => {
    setSelectedExercises((current) => {
      if (current.some((item) => item.exerciseId === exercise.id)) {
        return normalizeOrder(
          current.filter((item) => item.exerciseId !== exercise.id)
        );
      }

      return normalizeOrder([...current, buildEditablePlanExercise(exercise)]);
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises((current) =>
      normalizeOrder(current.filter((item) => item.exerciseId !== exerciseId))
    );
  };

  const handleToggleSuperset = (index: number) => {
    setSelectedExercises((current) => {
      if (index < 0 || index >= current.length - 1) {
        return current;
      }

      const nextValue = !current[index].supersetWithNext;

      return normalizeOrder(
        current.map((item, itemIndex) => {
          if (itemIndex === index) {
            return { ...item, supersetWithNext: nextValue };
          }

          if (!nextValue) {
            return item;
          }

          if (itemIndex === index - 1 || itemIndex === index + 1) {
            return { ...item, supersetWithNext: false };
          }

          return item;
        })
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelectedExercises((current) => {
      const oldIndex = current.findIndex(
        (exercise) => exercise.exerciseId === active.id
      );
      const newIndex = current.findIndex(
        (exercise) => exercise.exerciseId === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return current;

      return normalizeOrder(arrayMove(current, oldIndex, newIndex));
    });
  };

  const handleOpenEditor = (exerciseId: string) => {
    const item = selectedExercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (!item) return;

    setEditingExerciseId(exerciseId);
    setEditorSets(String(item.defaultSets));
    setEditorReps(String(item.defaultReps));
    setEditorRest(String(item.restTime));
  };

  const handleResetEditor = () => {
    if (!editingExercise) return;

    setEditorSets(String(editingExercise.exercise.defaultSets));
    setEditorReps(String(editingExercise.exercise.defaultReps));
    setEditorRest(String(editingExercise.exercise.defaultRestTime));
  };

  const handleSaveEditor = () => {
    if (!editingExerciseId) return;

    const nextSets = parseStepValue(editorSets, 1);
    const nextReps = parseStepValue(editorReps, 1);
    const nextRest = parseStepValue(editorRest, 0);

    setSelectedExercises((current) =>
      normalizeOrder(
        current.map((item) =>
          item.exerciseId === editingExerciseId
            ? {
                ...item,
                defaultSets: nextSets,
                defaultReps: nextReps,
                restTime: nextRest,
              }
            : item
        )
      )
    );
    setEditingExerciseId(null);
  };

  const handleSave = async () => {
    if (!planName.trim() || selectedExercises.length === 0) return;

    setSaving(true);
    try {
      const exerciseItems = normalizeOrder(selectedExercises).map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        restTime: exercise.restTime,
        supersetWithNext: exercise.supersetWithNext,
        order: index,
      }));

      if (isNew) {
        await createWorkoutPlan(planName, planType, exerciseItems);
      } else {
        await updateWorkoutPlanExercises(plan.id, planName, exerciseItems);
      }

      onSaved();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const renderPickerSection = (
    title: string,
    items: FavoriteAwareExerciseItem[],
    tone: "favorite" | "search"
  ) => {
    if (items.length === 0) return null;

    const badgeClass =
      tone === "favorite"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
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
          {items.map((exercise) => {
            const isSelected = selectedIds.has(exercise.id);

            return (
              <ExercisePickerCard
                key={exercise.id}
                exercise={exercise}
                selected={isSelected}
                showPrescriptionBadges={false}
                onSelect={() => toggleExercise(exercise)}
                onFavoriteChange={(nextValue) =>
                  updateFavoriteState(exercise.id, nextValue)
                }
                selectionIndicator={
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-emerald/40 bg-emerald text-[#0A0A0F]"
                        : "border-white/10 text-text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="h-4 w-4" />
                  </span>
                }
              />
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-white/6 bg-[#0A0A0F] overscroll-contain"
        >
          <SheetHeader className="pb-4">
            <SheetTitle
              className="text-left text-xl font-bold text-foreground"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {isNew ? "Buat Plan Baru" : `Edit: ${plan.name}`}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 pb-8">
            <div>
              <label
                htmlFor="plan-name"
                className="mb-1.5 block text-xs font-medium text-text-muted"
              >
                Nama Plan
              </label>
              <Input
                id="plan-name"
                name="plan-name"
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                placeholder="Contoh: Upper Body A"
                autoComplete="off"
                className="h-11 border-border-subtle bg-surface-elevated text-foreground"
              />
            </div>

            {isNew && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Tipe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["upper", "lower", "custom"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPlanType(type)}
                      className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                        planType === type
                          ? "bg-emerald text-[#0A0A0F]"
                          : "border border-border-subtle bg-surface-elevated text-text-muted hover:border-emerald/30"
                      }`}
                    >
                      {type === "upper" ? "Upper" : type === "lower" ? "Lower" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label
                htmlFor="plan-exercise-search"
                className="block text-xs font-medium text-text-muted"
              >
                Cari Exercise ({selectedExercises.length} dipilih)
              </label>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10 text-emerald">
                    <Search className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                      Quick Find
                    </p>
                  <input
                    id="plan-exercise-search"
                    name="plan-exercise-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari exercise..."
                    autoComplete="off"
                    className="mt-1 h-auto w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
                  />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {renderPickerSection("Favorite", pickerSections.favorites, "favorite")}
                {renderPickerSection(
                  deferredQuery ? "Hasil Pencarian" : "Explore",
                  pickerSections.results,
                  "search"
                )}

                {isPending ? (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
                    Menyusun daftar favorite dan hasil pencarian...
                  </div>
                ) : null}

                {!isPending && !hasPickerItems ? (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-text-muted">
                    Belum ada exercise yang muncul. Coba kata kunci lain atau
                    tandai beberapa favorit dulu.
                  </div>
                ) : null}

              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-muted">Urutan Exercise</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    Geser lewat handle untuk menyusun alur latihan, lalu edit set, reps, dan
                    rest per item.
                  </p>
                </div>
                <div className="rounded-full border border-emerald/20 bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold text-emerald">
                  {selectedExercises.length} item
                </div>
              </div>

              {selectedExercises.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedExercises.map((exercise) => exercise.exerciseId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedExercises.map((exercise, index) => (
                        <SortableExerciseCard
                          key={exercise.exerciseId}
                          index={index}
                          item={exercise}
                          onEdit={handleOpenEditor}
                          onRemove={handleRemoveExercise}
                          onToggleSuperset={handleToggleSuperset}
                          canToggleSuperset={index < selectedExercises.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="glass-card border border-dashed border-border-subtle p-5 text-center text-xs text-text-muted">
                  Belum ada exercise dipilih. Tambahkan exercise dari hasil pencarian, lalu
                  atur urutannya di sini.
                </div>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !planName.trim() || selectedExercises.length === 0}
              className="h-12 w-full rounded-xl bg-emerald text-base font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
            >
              {saving ? "Menyimpan…" : isNew ? "Buat Plan" : "Simpan Perubahan"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(editingExercise)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingExerciseId(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[72vh] overflow-y-auto rounded-t-3xl border-t border-white/6 bg-[#0A0A0F] overscroll-contain"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-left text-lg font-bold text-foreground">
              <Settings2 className="h-4 w-4 text-emerald" aria-hidden="true" />
              Atur Exercise
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-text-muted">
              {editingExercise
                ? `Sesuaikan set, reps, dan rest untuk ${editingExercise.exercise.name}.`
                : "Sesuaikan set, reps, dan rest."}
            </SheetDescription>
          </SheetHeader>

          {editingExercise ? (
            <div className="space-y-4 px-4 pb-8 pt-1">
              <div className="glass-card border border-white/6 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {editingExercise.exercise.name}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {editingExercise.exercise.primaryLabel}
                  {editingExercise.exercise.category
                    ? ` · ${CATEGORY_LABELS[editingExercise.exercise.category]}`
                    : ""}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="exercise-sets"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Sets
                  </label>
                  <Input
                    id="exercise-sets"
                    name="exercise-sets"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={editorSets}
                    onChange={(event) => setEditorSets(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exercise-reps"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Reps
                  </label>
                  <Input
                    id="exercise-reps"
                    name="exercise-reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    autoComplete="off"
                    value={editorReps}
                    onChange={(event) => setEditorReps(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exercise-rest"
                    className="mb-1.5 block text-xs font-medium text-text-muted"
                  >
                    Rest
                  </label>
                  <Input
                    id="exercise-rest"
                    name="exercise-rest"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    autoComplete="off"
                    value={editorRest}
                    onChange={(event) => setEditorRest(event.target.value)}
                    className="h-11 border-border-subtle bg-surface-elevated text-center font-semibold text-foreground"
                  />
                </div>
              </div>

              <p className="text-[11px] text-text-muted">
                Rest dihitung dalam detik. Nilai kosong atau negatif akan otomatis dibetulkan
                saat disimpan.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-border-subtle bg-surface text-foreground hover:bg-surface-elevated"
                  onClick={handleResetEditor}
                >
                  Reset ke Default
                </Button>
                <Button
                  type="button"
                  className="h-11 bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
                  onClick={handleSaveEditor}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

