"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dumbbell, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

interface FabMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManualLog: () => void;
}

export default function FabMenuSheet({ open, onOpenChange, onManualLog }: FabMenuSheetProps) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#0A0A0F] border-t border-white/6 rounded-t-3xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle
            className="text-lg font-bold text-foreground text-left"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Mulai Workout
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-6">
          {/* Guided Plan */}
          <button
            onClick={() => {
              onOpenChange(false);
              router.push("/workout/start");
            }}
            className="w-full glass-card p-4 flex items-center gap-4 text-left group"
            id="fab-guided-plan"
          >
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald/20 to-emerald/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-emerald" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">Mulai Plan</p>
              <p className="text-text-muted text-xs mt-0.5">Guided workout step-by-step</p>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center">
                <span className="text-emerald text-lg">→</span>
              </div>
            </div>
          </button>

          {/* Manual Log */}
          <button
            onClick={() => {
              onOpenChange(false);
              onManualLog();
            }}
            className="w-full glass-card p-4 flex items-center gap-4 text-left group"
            id="fab-manual-log"
          >
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">Log Manual</p>
              <p className="text-text-muted text-xs mt-0.5">Input latihan bebas</p>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-blue-400 text-lg">→</span>
              </div>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
