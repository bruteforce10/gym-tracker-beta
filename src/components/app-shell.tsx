"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import BottomNav from "@/components/bottom-nav";
import AddWorkoutSheet from "@/components/add-workout-sheet";
import FabMenuSheet from "@/components/fab-menu-sheet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const pathname = usePathname();
  const hideBottomNav =
    pathname === "/workout/start" || pathname === "/workout/session";

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
        className={`max-w-md mx-auto px-4 pt-6 ${hideBottomNav ? "pb-6" : "pb-nav"}`}
      >
        {children}
      </main>
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
