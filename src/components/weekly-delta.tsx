import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeeklyDeltaProps {
  delta: number;
  className?: string;
}

export default function WeeklyDelta({ delta, className = "" }: WeeklyDeltaProps) {
  if (delta === 0) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-text-muted text-xs font-medium ${className}`}>
        <Minus className="w-3 h-3" />
        <span className="font-data">0</span>
      </div>
    );
  }

  const isPositive = delta > 0;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPositive
          ? "bg-emerald/10 text-emerald"
          : "bg-danger/10 text-danger"
      } ${className}`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span className="font-data">
        {isPositive ? "+" : ""}
        {delta.toFixed(1)}
      </span>
    </div>
  );
}
