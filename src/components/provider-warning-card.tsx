import { AlertTriangle } from "lucide-react";

type ProviderWarningCardProps = {
  title?: string;
  message: string;
};

export default function ProviderWarningCard({
  title = "Sumber Data Sedang Tidak Tersedia",
  message,
}: ProviderWarningCardProps) {
  return (
    <div className="glass-card border border-amber-500/20 bg-amber-500/8 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-text-muted">{message}</p>
        </div>
      </div>
    </div>
  );
}
