import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

import { getAdminExercises } from "@/actions/exercises";
import AdminCustomExercisesTable from "@/components/admin-custom-exercises-table";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminExercisesPage() {
  await requireAdmin();
  const exercises = await getAdminExercises();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke dashboard
        </Link>

        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald/15 bg-emerald/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Admin Only
          </div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Dashboard Exercise
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Lihat semua exercise dalam satu tabel, filter visibility untuk menemukan private submission user, lalu moderasi exercise custom bila perlu.
          </p>
        </div>
      </div>

      <AdminCustomExercisesTable exercises={exercises} />
    </div>
  );
}
