"use client";

export default function OfflineRefreshButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.reload();
      }}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald/30 bg-emerald/10 px-4 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/20"
    >
      Coba lagi
    </button>
  );
}
