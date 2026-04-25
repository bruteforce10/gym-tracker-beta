"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import BottomNav from "@/components/bottom-nav";
import AddWorkoutSheet from "@/components/add-workout-sheet";
import ContinueWorkoutBanner from "@/components/continue-workout-banner";
import FabMenuSheet from "@/components/fab-menu-sheet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const pathname = usePathname();
  const hideBottomNav =
    pathname === "/workout/start" || pathname === "/workout/session";
  const shellPaddingClass = hideBottomNav
    ? "pb-6"
    : "pb-[calc(10rem+env(safe-area-inset-bottom,0px))]";

  return (
    <div className="min-h-screen gradient-mesh">
      <NextTopLoader
        color="#10B981"
        height={3}
        showSpinner={false}
        easing="ease"
        speed={220}
      />
      <main
        className={`max-w-md mx-auto px-4 pt-6 ${shellPaddingClass}`}
      >
        {children}
      </main>
      {!hideBottomNav && <ContinueWorkoutBanner />}
      {!hideBottomNav && <BottomNav onFabClick={() => setFabMenuOpen(true)} />}
      <FabMenuSheet
        open={fabMenuOpen}
        onOpenChange={setFabMenuOpen}
        onManualLog={() => setManualSheetOpen(true)}
      />
      <AddWorkoutSheet
        open={manualSheetOpen}
        onOpenChange={setManualSheetOpen}
      />
    </div>
  );
}
