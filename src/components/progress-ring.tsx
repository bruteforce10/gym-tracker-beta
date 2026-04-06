interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

function resolveProgressPalette(percentage: number) {
  if (percentage <= 30) {
    return {
      start: "#FB7185",
      end: "#DC2626",
      glow: "rgba(220, 38, 38, 0.45)",
    };
  }

  if (percentage >= 40 && percentage < 50) {
    return {
      start: "#FDE047",
      end: "#EAB308",
      glow: "rgba(234, 179, 8, 0.45)",
    };
  }

  if (percentage >= 50 && percentage <= 80) {
    return {
      start: "#FB923C",
      end: "#F97316",
      glow: "rgba(249, 115, 22, 0.45)",
    };
  }

  return {
    start: "#34D399",
    end: "#059669",
    glow: "rgba(16, 185, 129, 0.45)",
  };
}

export default function ProgressRing({
  percentage,
  size = 160,
  strokeWidth = 10,
  label,
  sublabel,
}: ProgressRingProps) {
  const normalizedPercentage = Math.max(0, Math.min(percentage, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedPercentage / 100) * circumference;
  const palette = resolveProgressPalette(normalizedPercentage);
  const gradientId = `progress-gradient-${size}-${strokeWidth}-${Math.round(normalizedPercentage)}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(42, 42, 58, 0.6)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.glow}
          strokeWidth={strokeWidth + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
          opacity={0.15}
          style={{ filter: "blur(8px)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.start} />
            <stop offset="100%" stopColor={palette.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data text-3xl font-bold text-foreground tracking-tight">
          {percentage}%
        </span>
        {label && <span className="text-xs text-text-muted mt-0.5 font-medium">{label}</span>}
        {sublabel && <span className="text-[10px] text-text-muted/60 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}
