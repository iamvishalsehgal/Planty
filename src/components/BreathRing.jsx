const PALETTE = {
  healthy: {
    stroke: "#4F7A42",
    strokeEnd: "#84B075",
    bg: "#E5EDE0",
    glow: "rgba(79,122,66,0.25)",
  },
  warning: {
    stroke: "#B08041",
    strokeEnd: "#CDB080",
    bg: "#F0E8D8",
    glow: "rgba(176,128,65,0.25)",
  },
  dry: {
    stroke: "#D67B5B",
    strokeEnd: "#E29C82",
    bg: "#F5DBD3",
    glow: "rgba(214,123,91,0.3)",
  },
  overdue: {
    stroke: "#C46240",
    strokeEnd: "#D67B5B",
    bg: "#F5DBD3",
    glow: "rgba(196,98,64,0.35)",
  },
};

export function BreathRing({ progress = 1, size = 120, strokeWidth = 8, status = "healthy" }) {
  const colors = PALETTE[status] || PALETTE.healthy;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clampedProgress);
  const isPulsing = status === "dry" || status === "overdue";
  const days = Math.max(Math.round(progress), 0);
  const gradientId = `ring-grad-${status}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`absolute inset-0 -rotate-90 ${isPulsing ? "animate-pulse" : ""}`}
        style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={colors.strokeEnd} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {progress <= 0 ? (
          <span className="text-2xl drop-shadow-sm">⚠️</span>
        ) : (
          <>
            <span
              className="text-display-md font-extrabold tracking-tight leading-none"
              style={{ color: colors.stroke }}
            >
              {days}
            </span>
            <span className="text-label-sm text-text-tertiary mt-0.5">
              {days === 1 ? "day" : "days"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function BreathRingSimple({ size = 56, progress = 1, status = "healthy" }) {
  return <BreathRing progress={progress} size={size} strokeWidth={6} status={status} />;
}
