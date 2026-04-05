"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BODY_PART_FILTER_OPTIONS,
  EQUIPMENT_FILTER_OPTIONS,
  TRAINING_TYPE_FILTER_OPTIONS,
} from "@/lib/exercise-filters";
import type { ExerciseComposerValues } from "@/lib/custom-exercise-form";

type CustomExerciseFieldsProps = {
  values: ExerciseComposerValues;
  onChange: <K extends keyof ExerciseComposerValues>(
    key: K,
    value: ExerciseComposerValues[K],
  ) => void;
  className?: string;
  showImageUrlField?: boolean;
};

export default function CustomExerciseFields({
  values,
  onChange,
  className,
  showImageUrlField = true,
}: CustomExerciseFieldsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Field label="Nama Exercise">
        <Input
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Contoh: Incline Cable Fly"
          className="h-11 rounded-xl border-border-subtle bg-surface-elevated px-3 text-foreground"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Body Part"
          value={values.bodyPart}
          placeholder="Pilih body part"
          options={BODY_PART_FILTER_OPTIONS}
          onChange={(value) => onChange("bodyPart", value)}
        />
        <SelectField
          label="Equipment"
          value={values.equipment}
          placeholder="Pilih equipment"
          options={EQUIPMENT_FILTER_OPTIONS}
          onChange={(value) => onChange("equipment", value)}
        />
        <SelectField
          label="Type"
          value={values.type}
          placeholder="Pilih type"
          options={TRAINING_TYPE_FILTER_OPTIONS}
          onChange={(value) => onChange("type", value)}
        />
      </div>

      <Field label="Target Muscles">
        <Input
          value={values.targetMuscles}
          onChange={(event) => onChange("targetMuscles", event.target.value)}
          placeholder="Contoh: Upper Chest, Front Delts"
          className="h-11 rounded-xl border-border-subtle bg-surface-elevated px-3 text-foreground"
        />
      </Field>

      <Field label="Secondary Muscles">
        <Input
          value={values.secondaryMuscles}
          onChange={(event) => onChange("secondaryMuscles", event.target.value)}
          placeholder="Contoh: Triceps, Serratus"
          className="h-11 rounded-xl border-border-subtle bg-surface-elevated px-3 text-foreground"
        />
      </Field>

      {showImageUrlField ? (
        <Field label="Image URL (Opsional)">
          <Input
            value={values.imageUrl}
            onChange={(event) => onChange("imageUrl", event.target.value)}
            placeholder="https://..."
            className="h-11 rounded-xl border-border-subtle bg-surface-elevated px-3 text-foreground"
          />
        </Field>
      ) : null}

      <Field label="Catatan (Opsional)">
        <textarea
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          rows={4}
          placeholder="Tambahkan catatan singkat agar admin lebih mudah review."
          className="w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-3 text-sm text-foreground outline-none placeholder:text-text-muted/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue ?? "")}>
        <SelectTrigger
          className="h-11 w-full rounded-xl border-border-subtle bg-surface-elevated px-3 text-sm text-foreground"
          aria-label={label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border-subtle bg-[#101218] text-foreground shadow-2xl">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
