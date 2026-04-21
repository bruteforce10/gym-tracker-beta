"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Edit3, Plus, Target, Trophy } from "lucide-react";

import { deleteGoal, getGoalPageData, upsertGoal } from "@/actions/goals";
import GoalEditorSheet from "@/components/goal-editor-sheet";
import GoalHistoryCard from "@/components/goal-history-card";
import GoalSummaryCard from "@/components/goal-summary-card";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExerciseCatalogItem } from "@/lib/exercise-catalog";
import type { GoalDisplayItem } from "@/lib/goal-state";

type GoalCollections = Awaited<ReturnType<typeof getGoalPageData>>;
type PendingDuplicateGoal = {
  exerciseId: string;
  exerciseName: string;
  targetWeight: number;
  deadline: string;
};

const EMPTY_FORM_STATE = {
  exercise: null as ExerciseCatalogItem | null,
  targetWeight: "100",
  deadline: "",
};

function ConfirmDuplicateGoalDialog({
  open,
  pendingGoal,
  saving,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pendingGoal: PendingDuplicateGoal | null;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md rounded-[28px] border border-white/10 bg-[#0B0D12] p-0"
      >
        <DialogHeader className="px-6 pt-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald/20 bg-emerald/10 text-emerald">
            <Target className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="pt-3 text-xl font-bold text-foreground">
            Goal Ini Sudah Pernah Selesai
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-text-muted">
            Sebelumnya kamu sudah capai target{" "}
            <span className="font-semibold text-foreground">
              {pendingGoal?.targetWeight.toFixed(1)} kg
            </span>{" "}
            untuk{" "}
            <span className="font-semibold text-foreground">
              {pendingGoal?.exerciseName ?? "exercise ini"}
            </span>
            . Perlu dibuat kembali?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="rounded-b-[28px] border-white/8 bg-white/[0.02] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="h-11 rounded-xl border-border-subtle text-text-muted hover:text-foreground mb-4"
          >
            Tidak
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-11 rounded-xl bg-emerald font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
          >
            {saving ? "Menyimpan..." : "Iya, buat goal baru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalPage() {
  const [activeGoals, setActiveGoals] = useState<GoalDisplayItem[]>([]);
  const [completedGoals, setCompletedGoals] = useState<GoalDisplayItem[]>([]);
  const [overdueGoals, setOverdueGoals] = useState<GoalDisplayItem[]>([]);
  const [activeGoalCount, setActiveGoalCount] = useState(0);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM_STATE);
  const [pendingDuplicateGoal, setPendingDuplicateGoal] =
    useState<PendingDuplicateGoal | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const syncPageData = (data: GoalCollections) => {
    setActiveGoals(data.activeGoals);
    setCompletedGoals(data.completedGoals);
    setOverdueGoals(data.overdueGoals);
    setActiveGoalCount(data.activeGoalCount);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingGoalId(null);
    setFormMessage("");
    setEditForm(EMPTY_FORM_STATE);
    setPendingDuplicateGoal(null);
    setDuplicateDialogOpen(false);
  };

  const applyGoalToForm = (goal: GoalDisplayItem, message = "") => {
    setEditingGoalId(goal.id);
    setFormOpen(true);
    setFormMessage(message);
    setEditForm({
      exercise: goal.exercise,
      targetWeight: goal.targetWeight.toString(),
      deadline: goal.deadline ?? "",
    });
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getGoalPageData();
        syncPageData(data);
      } catch {
        // Keep the page interactive even if loading fails.
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const reloadGoalData = async () => {
    const data = await getGoalPageData();
    syncPageData(data);
    return data;
  };

  const openCreateForm = () => {
    if (activeGoalCount >= 3) {
      setFormMessage(
        "Maksimal 3 goal aktif. Tunggu salah satu selesai terlebih dahulu.",
      );
      setFormOpen(true);
      setEditingGoalId(null);
      return;
    }

    setFormMessage("");
    setEditingGoalId(null);
    setEditForm(EMPTY_FORM_STATE);
    setFormOpen(true);
  };

  const handleExerciseSelection = (exercise: ExerciseCatalogItem) => {
    const duplicateGoal = activeGoals.find(
      (goal) => goal.exercise.id === exercise.id && goal.id !== editingGoalId,
    );

    if (duplicateGoal) {
      applyGoalToForm(
        duplicateGoal,
        "Goal untuk exercise ini sudah ada. Kami buka mode edit.",
      );
      return;
    }

    setFormMessage("");
    setEditForm((current) => ({ ...current, exercise }));
  };

  const handleSave = async () => {
    if (!editForm.exercise) {
      setFormMessage("Pilih exercise terlebih dahulu.");
      return;
    }

    const submission = {
      exerciseId: editForm.exercise.id,
      exerciseName: editForm.exercise.name,
      targetWeight: Number(editForm.targetWeight),
      deadline: editForm.deadline,
    };

    await submitGoal(submission);
  };

  const submitGoal = async (
    submission: PendingDuplicateGoal,
    allowCompletedDuplicate = false,
  ) => {
    setSaving(true);
    setFormMessage("");

    try {
      const result = await upsertGoal({
        goalId: editingGoalId,
        exerciseId: submission.exerciseId,
        targetWeight: submission.targetWeight,
        deadline: submission.deadline,
        allowCompletedDuplicate,
      });

      if (!result.success) {
        if (result.code === "duplicate_active" && result.goalId) {
          const duplicateGoal = activeGoals.find(
            (goal) => goal.id === result.goalId,
          );
          if (duplicateGoal) {
            applyGoalToForm(
              duplicateGoal,
              result.error ??
                "Goal untuk exercise ini sudah ada. Kami buka mode edit.",
            );
            return;
          }
        }

        if (result.code === "duplicate_completed" && !allowCompletedDuplicate) {
          setPendingDuplicateGoal(submission);
          setDuplicateDialogOpen(true);
          return;
        }

        setFormMessage(result.error ?? "Gagal menyimpan goal.");
        return;
      }

      setPendingDuplicateGoal(null);
      setDuplicateDialogOpen(false);
      await reloadGoalData();
      closeForm();
    } catch {
      setFormMessage("Terjadi kesalahan saat menyimpan goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!editingGoalId) return;

    setDeletingGoalId(editingGoalId);
    setFormMessage("");

    try {
      const result = await deleteGoal(editingGoalId);

      if (!result.success) {
        setFormMessage(result.error ?? "Goal gagal dihapus.");
        return;
      }

      await reloadGoalData();
      closeForm();
    } catch {
      setFormMessage("Terjadi kesalahan saat menghapus goal.");
    } finally {
      setDeletingGoalId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Goal" />
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-text-muted">Memuat goal...</p>
        </div>
      </div>
    );
  }

  const hasAnyGoal =
    activeGoals.length > 0 ||
    completedGoals.length > 0 ||
    overdueGoals.length > 0;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Goal"
          subtitle="target kekuatanmu, capai puncak performamu!"
          rightContent={
            <Button
              type="button"
              onClick={openCreateForm}
              disabled={activeGoalCount >= 3}
              className="h-10 rounded-xl bg-emerald px-4 text-sm font-semibold text-[#0A0A0F] hover:bg-emerald-dark disabled:opacity-50"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Tambah Goal
            </Button>
          }
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Goal Aktif
              </div>
            </div>
            <p className="text-xs text-text-muted">
              {activeGoalCount}/3 goal aktif
            </p>
          </div>

          {activeGoalCount >= 3 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-text-muted">
              Maksimal 3 goal aktif. Selesaikan satu goal atau tunggu deadline
              lewat untuk membuka slot baru.
            </div>
          ) : null}

          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <GoalSummaryCard
                  key={goal.id}
                  goal={goal}
                  action={
                    <button
                      type="button"
                      onClick={() => applyGoalToForm(goal)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0F1218]/90 text-text-muted transition-colors hover:border-emerald/20 hover:bg-white/[0.06] hover:text-emerald"
                      aria-label={`Edit goal ${goal.exercise.name}`}
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Target
                className="mx-auto h-10 w-10 text-emerald/80"
                aria-hidden="true"
              />
              <p className="mt-4 text-base font-semibold text-foreground">
                Belum ada goal aktif
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Buat sampai 3 target kekuatan untuk exercise yang berbeda.
              </p>
            </div>
          )}
        </section>

        {completedGoals.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald" aria-hidden="true" />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Riwayat Selesai
              </h2>
            </div>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <GoalHistoryCard key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        ) : null}

        {overdueGoals.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="h-4 w-4 text-danger"
                aria-hidden="true"
              />
              <h2
                className="text-base font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Terlambat
              </h2>
            </div>
            <div className="space-y-3">
              {overdueGoals.map((goal) => (
                <GoalHistoryCard key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        ) : null}

        {!hasAnyGoal ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-text-muted">
            Goal selesai dan goal terlambat akan muncul di halaman ini sebagai
            riwayat read-only.
          </div>
        ) : null}
      </div>

      <GoalEditorSheet
        open={formOpen}
        editingGoalId={editingGoalId}
        activeGoalCount={activeGoalCount}
        saving={saving}
        deleting={Boolean(deletingGoalId)}
        formMessage={formMessage}
        value={editForm}
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
        onValueChange={setEditForm}
        onSubmit={handleSave}
        onDelete={handleDeleteGoal}
        onReset={closeForm}
        onDuplicateGoalSelected={handleExerciseSelection}
      />

      <ConfirmDuplicateGoalDialog
        open={duplicateDialogOpen}
        pendingGoal={pendingDuplicateGoal}
        saving={saving}
        onConfirm={() => {
          if (!pendingDuplicateGoal) return;
          void submitGoal(pendingDuplicateGoal, true);
        }}
        onCancel={() => {
          setDuplicateDialogOpen(false);
          setPendingDuplicateGoal(null);
          setFormMessage("tidak dibuatkan");
        }}
      />
    </>
  );
}
