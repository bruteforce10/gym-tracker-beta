"use client";

import { useEffect, useState, useTransition } from "react";
import { Calendar as CalendarIcon, Scale, X } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { upsertWeightLog } from "@/actions/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateInputValue, parseDateInputValue } from "@/lib/date";
import { clampNumber } from "@/lib/progress";
import { cn } from "@/lib/utils";

type WeightLogSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentKg: number | null;
  latestLoggedOn: string | null;
};

function kgToLbs(value: number): number {
  return value * 2.20462;
}

function lbsToKg(value: number): number {
  return value / 2.20462;
}

function getTodayKey(): string {
  return formatDateInputValue(new Date());
}

function formatDisplayValue(value: number): string {
  return value.toFixed(1);
}

export default function WeightLogSheet({
  open,
  onOpenChange,
  currentKg,
  latestLoggedOn,
}: WeightLogSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [draftKg, setDraftKg] = useState(currentKg ?? 70);
  const [draftInput, setDraftInput] = useState(formatDisplayValue(currentKg ?? 70));
  const [loggedOn, setLoggedOn] = useState(getTodayKey());
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const todayKey = getTodayKey();
    const defaultLoggedOn = latestLoggedOn === todayKey ? latestLoggedOn : todayKey;
    const nextDraftKg = currentKg ?? 70;
    // Reset the sheet draft each time it opens with the latest server-backed values.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftKg(nextDraftKg);
    setDraftInput(formatDisplayValue(nextDraftKg));
    setLoggedOn(defaultLoggedOn);
    setUnit("kg");
    setErrorMessage("");
  }, [currentKg, latestLoggedOn, open]);

  const displayValue = unit === "kg" ? draftKg : kgToLbs(draftKg);
  const sliderMin = unit === "kg" ? 35 : 77;
  const sliderMax = unit === "kg" ? 180 : 397;
  const sliderStep = unit === "kg" ? 0.1 : 0.5;

  const handleValueChange = (nextValue: number) => {
    const normalized = unit === "kg" ? nextValue : lbsToKg(nextValue);
    const clampedValue = clampNumber(normalized, 35, 180);
    setDraftKg(clampedValue);
    setDraftInput(
      formatDisplayValue(unit === "kg" ? clampedValue : kgToLbs(clampedValue)),
    );
  };

  const handleInputChange = (nextValue: string) => {
    setDraftInput(nextValue);

    if (nextValue.trim() === "") return;

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;

    const normalized = unit === "kg" ? parsed : lbsToKg(parsed);
    setDraftKg(clampNumber(normalized, 35, 180));
  };

  const handleInputBlur = () => {
    setDraftInput(formatDisplayValue(displayValue));
  };

  const handleUnitChange = (nextUnit: "kg" | "lbs") => {
    setUnit(nextUnit);
    setDraftInput(
      formatDisplayValue(nextUnit === "kg" ? draftKg : kgToLbs(draftKg)),
    );
  };

  const handleSave = () => {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await upsertWeightLog({
          valueKg: draftKg,
          loggedOn,
        });
        router.refresh();
        onOpenChange(false);
      } catch {
        setErrorMessage("Berat badan belum bisa disimpan. Coba lagi.");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[92vh] rounded-t-[30px] border-t border-white/8 bg-[#11131A] px-0 data-[side=bottom]:mx-auto data-[side=bottom]:w-full data-[side=bottom]:max-w-2xl"
      >
        <SheetHeader className="border-b border-white/6 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Scale className="h-4 w-4 text-emerald" aria-hidden="true" />
                Current Weight
              </SheetTitle>
              <SheetDescription className="mt-1 text-left text-xs text-text-muted">
                Simpan log berat badan harian supaya tren 30 hari kamu tetap
                kebaca.
              </SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 rounded-full border-white/8 bg-white/[0.04] px-3 text-xs text-foreground hover:bg-white/[0.08] focus-visible:ring-emerald/40",
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-emerald" />
                  {format(parseDateInputValue(loggedOn) ?? new Date(), "dd MMM")}
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto border-border-subtle bg-surface p-0"
                >
                  <Calendar
                    mode="single"
                    selected={parseDateInputValue(loggedOn) ?? undefined}
                    onSelect={(date) => date && setLoggedOn(formatDateInputValue(date))}
                    initialFocus
                    className="bg-surface"
                  />
                </PopoverContent>
              </Popover>

              <SheetClose
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-text-muted transition-colors hover:bg-white/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-5 py-5">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => handleUnitChange("kg")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
                unit === "kg"
                  ? "bg-emerald text-[#0A0A0F]"
                  : "text-text-muted hover:text-foreground",
              )}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange("lbs")}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
                unit === "lbs"
                  ? "bg-emerald text-[#0A0A0F]"
                  : "text-text-muted hover:text-foreground",
              )}
            >
              lbs
            </button>
          </div>

          <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(255,255,255,0.02))] px-5 py-6 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
              {loggedOn === getTodayKey() ? "Today" : "Selected Day"}
            </p>
            <div className="mt-4 flex items-end justify-center gap-2">
              <span className="font-heading text-6xl font-semibold tracking-tight text-white">
                {displayValue.toFixed(1)}
              </span>
              <span className="pb-2 text-base text-text-muted">{unit}</span>
            </div>

            <div className="mt-6 space-y-4">
              <label htmlFor="weight-log-range" className="sr-only">
                Weight slider
              </label>
              <input
                id="weight-log-range"
                name="weight-log-range"
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={displayValue}
                onChange={(event) => handleValueChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald"
              />
              <label htmlFor="weight-log-value" className="sr-only">
                Weight value
              </label>
              <input
                id="weight-log-value"
                name="weight-log-value"
                type="number"
                inputMode="decimal"
                autoComplete="off"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={draftInput}
                onChange={(event) => handleInputChange(event.target.value)}
                onBlur={handleInputBlur}
                className="h-12 w-full rounded-2xl border border-white/8 bg-black/30 px-4 text-center font-data text-lg text-white outline-none transition-colors focus:border-emerald/50 focus-visible:ring-2 focus-visible:ring-emerald/25"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-white/6 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl border-white/8 bg-white/[0.03] text-text-muted hover:bg-white/[0.06] hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="h-12 rounded-2xl bg-emerald text-[#0A0A0F] hover:bg-emerald-dark"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
