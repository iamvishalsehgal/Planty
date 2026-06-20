import { useId } from 'react';

const PALETTE = {
  healthy:  { stroke: "#059669", strokeEnd: "#34d399", bg: "#d1fae5" },
  warning:  { stroke: "#d97706", strokeEnd: "#fbbf24", bg: "#fef3c7" },
  dry:      { stroke: "#3b82f6", strokeEnd: "#60a5fa", bg: "#dbeafe" },
  overdue:  { stroke: "#dc2626", strokeEnd: "#ef4444", bg: "#fee2e2" },
};

export function BreathRing({ progress = 1, size = 120, strokeWidth = 7, status = "healthy", totalDays }) {
  const colors = PALETTE[status] || PALETTE.healthy;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalDays && totalDays > 0
    ? Math.min(Math.max(progress / totalDays, 0), 1)
    : Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - ratio);
  const gradientId = useId() + `-rg-${status}-${size}`;
  const days = Math.max(Math.round(progress), 0);
  const percentage = Math.round(ratio * 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={colors.strokeEnd} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={colors.bg} strokeWidth={strokeWidth}
          opacity="0.5"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        {progress <= 0 ? (
          <span
            className="text-[11px] font-bold tracking-tight leading-none"
            style={{ color: colors.stroke }}
          >
            NOW
          </span>
        ) : (
          <>
            <span
              className="font-extrabold tracking-tighter leading-none tabular-nums"
              style={{ color: colors.stroke, fontSize: size * 0.30 }}
            >
              {days}
            </span>
            <span
              className="text-[10px] font-medium tracking-wide uppercase opacity-50 mt-0.5 leading-none"
              style={{ color: colors.stroke }}
            >
              {days === 1 ? "day" : "days"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function BreathRingSimple({ size = 56, progress = 1, status = "healthy", totalDays }) {
  return (
    <BreathRing
      progress={progress}
      size={size}
      strokeWidth={5}
      status={status}
      totalDays={totalDays}
    />
  );
}
