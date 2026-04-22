import Link from "next/link";
import { WifiOff } from "lucide-react";

import OfflineRefreshButton from "@/components/offline-refresh-button";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] px-5 py-8 text-[#F5F5F7]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/12 text-emerald">
            <WifiOff className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Koneksi lagi tidak stabil
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Grynx masih bisa membuka sebagian halaman yang pernah kamu akses,
            tapi request yang butuh internet baru saja gagal. Coba lagi saat
            sinyal membaik.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <OfflineRefreshButton />
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white/6"
            >
              Kembali ke Dashboard
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4 text-xs leading-5 text-text-muted">
            Tip: setelah halaman exercise, plan, atau workout pernah terbuka,
            asset utama dan beberapa data terakhirnya akan lebih mudah dimuat
            lagi saat koneksi naik turun.
          </div>
        </div>
      </div>
    </main>
  );
}
