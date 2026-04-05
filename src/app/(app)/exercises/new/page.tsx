import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import CustomExerciseForm from "@/components/custom-exercise-form";

export default function NewExercisePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke katalog
        </Link>

        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Tambah Custom Exercise
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Buat exercise versimu sendiri dan simpan langsung ke katalog pribadi.
          </p>
        </div>
      </div>

      <CustomExerciseForm />
    </div>
  );
}
