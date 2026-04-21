"use client";

import Image from "next/image";
import { ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createCustomExercise,
  updateCustomExerciseByOwner,
  updateExerciseAdmin,
} from "@/actions/exercises";
import CustomExerciseFields from "@/components/custom-exercise-fields";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_EXERCISE_COMPOSER_VALUES,
  type ExerciseComposerValues,
} from "@/lib/custom-exercise-form";
import { uploadFiles } from "@/lib/uploadthing";

const STATUS_OPTIONS = ["published", "flagged", "archived"] as const;
const VISIBILITY_OPTIONS = ["private", "global"] as const;

type CustomExerciseFormProps = {
  mode?: "create" | "edit";
  exerciseId?: string;
  source?: "system" | "user";
  editorRole?: "admin" | "user";
  initialValues?: ExerciseComposerValues;
  initialImageUrl?: string | null;
  initialStatus?: "published" | "flagged" | "archived";
  initialVisibility?: "private" | "global";
  cancelHref?: string;
  successHref?: string;
  description?: string;
  submitLabel?: string;
};

export default function CustomExerciseForm({
  mode = "create",
  exerciseId,
  source = "user",
  editorRole = "user",
  initialValues = EMPTY_EXERCISE_COMPOSER_VALUES,
  initialImageUrl = null,
  initialStatus = "published",
  initialVisibility = "private",
  cancelHref = "/exercises",
  successHref = "/exercises",
  description,
  submitLabel,
}: CustomExerciseFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = mode === "edit";
  const isSystemExercise = source === "system";

  const [values, setValues] = useState<ExerciseComposerValues>(initialValues);
  const [message, setMessage] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState(initialImageUrl ?? "");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"published" | "flagged" | "archived">(
    initialStatus,
  );
  const [visibility, setVisibility] = useState<"private" | "global">(
    initialVisibility,
  );
  const [isPending, startTransition] = useTransition();

  const previewUrl = localPreviewUrl || storedImageUrl || "";

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const updateField = <K extends keyof ExerciseComposerValues>(
    key: K,
    value: ExerciseComposerValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearSelectedImage = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setSelectedImageFile(null);
    setLocalPreviewUrl(null);
    setStoredImageUrl("");
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectImage = (file: File | null) => {
    if (!file) {
      clearSelectedImage();
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setSelectedImageFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setMessage("");
  };

  const resolvedDescription =
    description ??
    (isEditMode
      ? isSystemExercise
        ? "Perbarui detail exercise bawaan. Setelah simpan kamu akan kembali ke dashboard admin exercise."
        : editorRole === "admin"
          ? "Perbarui detail, gambar, dan moderasi exercise custom dari user."
          : "Perbarui detail custom exercise milikmu. Setelah simpan kamu akan kembali ke halaman detail exercise."
      : "Exercise baru akan langsung muncul di katalog milikmu.");

  const resolvedSubmitLabel =
    submitLabel ?? (isEditMode ? "Simpan Perubahan" : "Submit Exercise");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald/15 bg-emerald/8 px-4 py-3 text-xs text-emerald-100/90">
        <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-100">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {isEditMode ? "Edit Exercise" : "Private Publish"}
        </div>
        {resolvedDescription}
      </div>

      <div className="grid gap-6 ">
        <div className="space-y-5">
          <CustomExerciseFields
            values={values}
            onChange={updateField}
            showImageUrlField={false}
          />

          {isEditMode && editorRole === "admin" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {isSystemExercise ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-muted">
                    Visibility
                  </label>
                  <div className="flex h-11 items-center rounded-xl border border-border-subtle bg-surface-elevated px-3 text-sm text-text-muted">
                    Exercise sistem selalu global
                  </div>
                </div>
              ) : (
                <ModerationSelect
                  label="Visibility"
                  value={visibility}
                  options={VISIBILITY_OPTIONS}
                  onChange={(value) =>
                    setVisibility(value as "private" | "global")
                  }
                />
              )}
              <ModerationSelect
                label="Status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) =>
                  setStatus(value as "published" | "flagged" | "archived")
                }
              />
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#12151D]">
            {previewUrl ? (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="absolute left-3 top-3 z-10 h-10 rounded-xl border-white/10 bg-[#0F1117]/80 text-foreground backdrop-blur hover:bg-[#0F1117]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Ganti Gambar
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="absolute right-3 top-3 z-10 border-white/10 bg-[#0F1117]/80 text-foreground backdrop-blur hover:bg-[#0F1117]"
                  onClick={clearSelectedImage}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Hapus gambar terpilih</span>
                </Button>
                <Image
                  src={previewUrl}
                  alt="Preview gambar exercise"
                  width={640}
                  height={640}
                  unoptimized
                  className="h-72 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-72 w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] px-6 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-emerald">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Belum ada gambar
                  </p>
                  <p className="mt-1 text-xs text-text-muted mt-2">
                    Maksimal 1 gambar, 8MB.
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    ukuran ideal 640x640px (1:1).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 h-11 rounded-xl border-border-subtle bg-surface text-foreground hover:bg-surface-elevated"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Pilih Gambar
                </Button>
                {selectedImageFile ? (
                  <p className="text-xs text-emerald-100/90">
                    File dipilih: {selectedImageFile.name}
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleSelectImage(event.target.files?.[0] ?? null)
            }
          />

          {message ? (
            <div className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
              {message}
            </div>
          ) : null}

          <div className="flex gap-2 flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl border-border-subtle bg-surface-elevated text-foreground hover:bg-surface"
              onClick={() => router.push(cancelHref)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="h-11 flex-1 rounded-xl bg-emerald text-sm font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
              onClick={() => {
                setMessage("");
                startTransition(async () => {
                  let nextImageUrl = storedImageUrl;

                  if (selectedImageFile) {
                    try {
                      const uploadResult = await uploadFiles(
                        "customExerciseImage",
                        {
                          files: [selectedImageFile],
                        },
                      );

                      const firstUpload = uploadResult?.[0];
                      nextImageUrl =
                        firstUpload?.serverData?.url ??
                        firstUpload?.ufsUrl ??
                        firstUpload?.url ??
                        "";
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Upload gambar gagal.",
                      );
                      return;
                    }
                  }

                  if (isEditMode) {
                    if (!exerciseId) {
                      setMessage("Exercise tidak ditemukan.");
                      return;
                    }

                    const result =
                      editorRole === "admin"
                        ? await updateExerciseAdmin(exerciseId, {
                            ...values,
                            imageUrl: nextImageUrl,
                            visibility: isSystemExercise ? "global" : visibility,
                            status,
                          })
                        : await updateCustomExerciseByOwner(exerciseId, {
                            ...values,
                            imageUrl: nextImageUrl,
                          });

                    if (!result.success) {
                      setMessage(result.error ?? "Gagal menyimpan perubahan.");
                      return;
                    }

                    const nextHref =
                      editorRole === "user" && result.slug
                        ? `/exercises/${result.slug}`
                        : successHref;

                    router.push(nextHref);
                    router.refresh();
                    return;
                  }

                  const result = await createCustomExercise({
                    ...values,
                    imageUrl: nextImageUrl,
                  });

                  if (!result.success) {
                    setMessage(result.error ?? "Gagal menambahkan exercise.");
                    return;
                  }

                  router.push(successHref);
                  router.refresh();
                });
              }}
            >
              {isPending ? "Menyimpan..." : resolvedSubmitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModerationSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-muted">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue ?? value)}
      >
        <SelectTrigger className="h-11 w-full rounded-xl border-border-subtle bg-surface-elevated px-3 text-sm text-foreground">
          <SelectValue placeholder={`Pilih ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border-subtle bg-[#101218] text-foreground shadow-2xl">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
