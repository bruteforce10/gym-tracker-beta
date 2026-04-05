"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Database, Lock, Pencil, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  archiveExerciseAdmin,
  deleteCustomExerciseAdmin,
  promoteCustomExerciseAdmin,
} from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminExerciseRow = {
  id: string;
  slug: string;
  name: string;
  bodyParts: string[];
  equipments: string[];
  exerciseType: string | null;
  targetMuscles: string[];
  secondaryMuscles: string[];
  imageUrl: string | null;
  notes: string | null;
  source: string;
  visibility: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: {
    email: string | null;
    name: string | null;
  } | null;
};

const VISIBILITY_FILTER_OPTIONS = ["all", "private", "global"] as const;
const STATUS_FILTER_OPTIONS = [
  "all",
  "published",
  "flagged",
  "archived",
] as const;

export default function AdminCustomExercisesTable({
  exercises,
}: {
  exercises: AdminExerciseRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(exercises);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "private" | "global"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "flagged" | "archived"
  >("all");

  const summary = useMemo(() => {
    return {
      total: rows.length,
      system: rows.filter((row) => row.source === "system").length,
      custom: rows.filter((row) => row.source === "user").length,
      private: rows.filter((row) => row.visibility === "private").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesVisibility =
        visibilityFilter === "all" ? true : row.visibility === visibilityFilter;
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      if (!matchesVisibility || !matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableValues = [
        row.name,
        row.bodyParts.join(" "),
        row.equipments.join(" "),
        row.exerciseType ?? "",
        row.createdByUser?.email ?? "",
        row.createdByUser?.name ?? "",
        row.source,
        row.visibility,
        row.status,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [rows, searchQuery, statusFilter, visibilityFilter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Exercise"
          value={String(summary.total)}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          label="Custom User"
          value={String(summary.custom)}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Private"
          value={String(summary.private)}
          icon={<Lock className="h-4 w-4" />}
        />
      </div>

      <div className="glass-card space-y-4 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Semua Exercise
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            Cari cepat berdasarkan nama, body part, equipment, atau creator lalu
            kombinasikan dengan filter visibility.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Search Exercise
            </label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-3">
              <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, body part, equipment, atau email creator"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Filter Visibility
            </label>
            <Select
              value={visibilityFilter}
              onValueChange={(nextValue) =>
                setVisibilityFilter(
                  (nextValue as "all" | "private" | "global") ?? "all",
                )
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-border-subtle bg-surface-elevated px-3 text-sm text-foreground">
                <SelectValue placeholder="Pilih visibility" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border-subtle bg-[#101218] text-foreground shadow-2xl">
                {VISIBILITY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all"
                      ? "Semua"
                      : option === "private"
                        ? "Private"
                        : "Global"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Filter Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(nextValue) =>
                setStatusFilter(
                  (nextValue as "all" | "published" | "flagged" | "archived") ??
                    "all",
                )
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-border-subtle bg-surface-elevated px-3 text-sm text-foreground">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border-subtle bg-[#101218] text-foreground shadow-2xl">
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all"
                      ? "Semua"
                      : option === "published"
                        ? "Published"
                        : option === "flagged"
                          ? "Flagged"
                          : "Archived"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0F1117]">
        <Table className="min-w-full text-left text-sm">
          <TableHeader className="bg-white/4">
            <TableRow className="hover:bg-transparent">
              <TableHead>Exercise</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {exercise.bodyParts[0] ?? "Body"} ·{" "}
                      {exercise.equipments[0] ?? "Equipment"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] ${
                      exercise.source === "user"
                        ? "border-emerald/20 bg-emerald/10 text-emerald-100"
                        : "border-white/10 text-foreground/85"
                    }`}
                  >
                    {exercise.source === "user" ? "Custom" : "System"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-text-muted">
                  {exercise.createdByUser?.email ?? "-"}
                </TableCell>
                <TableCell>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-foreground/85">
                    {exercise.visibility}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-foreground/85">
                    {exercise.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-text-muted">
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(exercise.updatedAt))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/exercises/${exercise.id}/edit`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-border-subtle bg-surface-elevated text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>

                    {exercise.source === "user" ? (
                      <>
                        {exercise.visibility !== "global" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            className="bg-emerald/10 text-emerald hover:bg-emerald/20"
                            onClick={() => {
                              startTransition(async () => {
                                await promoteCustomExerciseAdmin(exercise.id);
                                setRows((current) =>
                                  current.map((item) =>
                                    item.id === exercise.id
                                      ? {
                                          ...item,
                                          visibility: "global",
                                          status: "published",
                                        }
                                      : item,
                                  ),
                                );
                                router.refresh();
                              });
                            }}
                          >
                            Promote
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === exercise.id}
                          onClick={() => {
                            if (
                              !confirm(
                                `Hapus custom exercise "${exercise.name}"?`,
                              )
                            ) {
                              return;
                            }
                            setIsDeleting(exercise.id);
                            setMessage("");
                            startTransition(async () => {
                              const result = await deleteCustomExerciseAdmin(
                                exercise.id,
                              );

                              if (!result.success) {
                                setMessage(
                                  result.error ?? "Gagal menghapus exercise.",
                                );
                                setIsDeleting(null);
                                return;
                              }

                              setRows((current) =>
                                current.filter((item) => item.id !== exercise.id),
                              );
                              setIsDeleting(null);
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : exercise.status !== "archived" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        className="border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                        onClick={() => {
                          if (
                            !confirm(
                              `Archive exercise bawaan "${exercise.name}" dari katalog publik?`,
                            )
                          ) {
                            return;
                          }
                          startTransition(async () => {
                            await archiveExerciseAdmin(exercise.id);
                            setRows((current) =>
                              current.map((item) =>
                                item.id === exercise.id
                                  ? { ...item, status: "archived" }
                                  : item,
                              ),
                            );
                            router.refresh();
                          });
                        }}
                      >
                        Archive
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-border-subtle bg-surface-elevated text-text-muted"
                      >
                        Archived
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-text-muted"
                >
                  Tidak ada exercise untuk filter saat ini.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card flex items-center gap-3 p-4">
      <div className="rounded-xl bg-emerald/10 p-2 text-emerald">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {label}
        </p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
