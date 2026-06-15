const COLORS = {
  healthy: { stroke: "#4F7A42", bg: "#E5EDE0" },
  warning: { stroke: "#B08041", bg: "#F9F6F0" },
  dry: { stroke: "#D67B5B", bg: "#FBEEEA" },
  overdue: { stroke: "#C46240", bg: "#FBEEEA" },
};

const STATUS_LABELS = {
  healthy: "Healthy",
  warning: "Water soon",
  dry: "Needs water",
  overdue: "Overdue!",
};

export function BreathRing({ progress = 1, size = 120, strokeWidth = 8, status = "healthy" }) {
  const { stroke, bg } = COLORS[status] || COLORS.healthy;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const isPulsing = status === "dry" || status === "overdue";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`absolute inset-0 -rotate-90 ${isPulsing ? "animate-pulse" : ""}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {progress <= 0 ? (
          <span className="text-2xl">⚠️</span>
        ) : (
          <>
            <span className="text-display-md" style={{ color: stroke }}>
              {Math.max(progress, 0)}
            </span>
            <span className="text-label-sm text-text-tertiary">
              {progress === 1 ? "day" : "days"}
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
