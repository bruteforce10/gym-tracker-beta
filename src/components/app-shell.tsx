"use client";

import { useState } from "react";
import BottomNav from "@/components/bottom-nav";
import AddWorkoutSheet from "@/components/add-workout-sheet";
import FabMenuSheet from "@/components/fab-menu-sheet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-mesh">
      <main className="max-w-md mx-auto px-4 pt-6 pb-nav">{children}</main>
      <BottomNav onFabClick={() => setFabMenuOpen(true)} />
      <FabMenuSheet
        open={fabMenuOpen}
        onOpenChange={setFabMenuOpen}
        onManualLog={() => setManualSheetOpen(true)}
      />
      <AddWorkoutSheet open={manualSheetOpen} onOpenChange={setManualSheetOpen} />
    </div>
  );
}
