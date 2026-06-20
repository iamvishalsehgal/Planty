export function SunIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#fcd34d" stroke="#f59e0b" strokeWidth="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12" y1="2" x2="12" y2="4"
          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}

export function CloudIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="13" cy="9" rx="4" ry="3" fill="#6ee7b7" />
      <ellipse cx="9" cy="10" rx="3" ry="2.5" fill="#a7f3d0" />
      <rect x="7" y="10" width="10" height="5" rx="2.5" fill="#6ee7b7" />
      <ellipse cx="9" cy="15" rx="3" ry="2" fill="#a7f3d0" />
    </svg>
  );
}

export function RainIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="6" rx="5" ry="3" fill="#93c5fd" />
      <ellipse cx="9" cy="7" rx="4" ry="2.5" fill="#bfdbfe" />
      <rect x="7" y="7" width="12" height="4" rx="2" fill="#93c5fd" />
      {[9, 12, 15].map((x) => (
        <line key={x} x1={x} y1="13" x2={x - 2} y2="17" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export default function WeatherIcon({ condition, size = 24 }) {
  if (!condition) return <SunIcon size={size} />;
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("thunder")) return <RainIcon size={size} />;
  if (c.includes("cloud") || c.includes("fog") || c.includes("overcast")) return <CloudIcon size={size} />;
  return <SunIcon size={size} />;
}
