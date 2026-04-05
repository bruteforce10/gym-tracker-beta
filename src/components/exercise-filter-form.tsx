"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExerciseFilterFormProps = {
  query: string;
  bodyPart: string;
  equipment: string;
  type: string;
  bodyPartOptions: readonly string[];
  equipmentOptions: readonly string[];
  typeOptions: readonly string[];
};

function FilterSelect({
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
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-muted">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="h-11 w-full cursor-pointer rounded-xl border-border-subtle bg-surface-elevated px-3 text-sm text-foreground touch-manipulation"
          aria-label={label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border-subtle bg-[#101218] text-foreground shadow-2xl">
          <SelectItem value="all">Semua</SelectItem>
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

export default function ExerciseFilterForm({
  query,
  bodyPart,
  equipment,
  type,
  bodyPartOptions,
  equipmentOptions,
  typeOptions,
}: ExerciseFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedBodyPart, setSelectedBodyPart] = useState(bodyPart || "all");
  const [selectedEquipment, setSelectedEquipment] = useState(
    equipment || "all",
  );
  const [selectedType, setSelectedType] = useState(type || "all");

  const applyFilters = (nextValues?: {
    q?: string;
    bodyPart?: string;
    equipment?: string;
    type?: string;
  }) => {
    const params = new URLSearchParams();
    const nextQuery = nextValues?.q ?? searchQuery;
    const nextBodyPart = nextValues?.bodyPart ?? selectedBodyPart;
    const nextEquipment = nextValues?.equipment ?? selectedEquipment;
    const nextType = nextValues?.type ?? selectedType;

    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextBodyPart && nextBodyPart !== "all")
      params.set("bodyPart", nextBodyPart);
    if (nextEquipment && nextEquipment !== "all")
      params.set("equipment", nextEquipment);
    if (nextType && nextType !== "all") params.set("type", nextType);

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(nextUrl);
  };

  return (
    <form
      className="glass-card space-y-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          applyFilters();
        });
      }}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald/80">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filter Katalog
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-3 focus-within:border-emerald/30 focus-within:ring-2 focus-within:ring-emerald/15">
        <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
        <input
          id="exercise-search"
          name="q"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari exercise…"
          autoComplete="off"
          className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted/70"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FilterSelect
          label="Body Part"
          value={selectedBodyPart}
          placeholder="Pilih body part"
          options={bodyPartOptions}
          onChange={(value) => setSelectedBodyPart(value ?? "all")}
        />
        <FilterSelect
          label="Equipment"
          value={selectedEquipment}
          placeholder="Pilih equipment"
          options={equipmentOptions}
          onChange={(value) => setSelectedEquipment(value ?? "all")}
        />
        <FilterSelect
          label="Type"
          value={selectedType}
          placeholder="Pilih type"
          options={typeOptions}
          onChange={(value) => setSelectedType(value ?? "all")}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 flex-1 rounded-xl bg-emerald text-sm font-semibold text-[#0A0A0F] hover:bg-emerald-dark"
        >
          {isPending ? "Menerapkan Filter…" : "Terapkan Filter"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="h-11 rounded-xl border-border-subtle bg-surface-elevated text-foreground hover:bg-surface"
          onClick={() => {
            setSearchQuery("");
            setSelectedBodyPart("all");
            setSelectedEquipment("all");
            setSelectedType("all");
            startTransition(() => {
              applyFilters({
                q: "",
                bodyPart: "all",
                equipment: "all",
                type: "all",
              });
            });
          }}
        >
          Reset Filter
        </Button>
      </div>
    </form>
  );
}
