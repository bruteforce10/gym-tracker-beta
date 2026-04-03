import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  delay?: number;
}

export default function StatCard({ icon, label, value, suffix, delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass-card p-4 flex flex-col gap-2 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald">
          {icon}
        </div>
        <span className="text-xs text-text-muted font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-data text-2xl font-bold text-foreground">{value}</span>
        {suffix && (
          <span className="text-sm text-text-muted font-medium">{suffix}</span>
        )}
      </div>
    </div>
  );
}
