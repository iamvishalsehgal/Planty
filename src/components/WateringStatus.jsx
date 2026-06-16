import { formatDate } from "@/lib/date";

const STATUS_CONFIG = {
  healthy: { emoji: "✅", label: "Healthy", colors: "from-sage-400 to-sage-600" },
  warning: { emoji: "💧", label: "Water soon", colors: "from-soil-400 to-soil-600" },
  dry: { emoji: "🥀", label: "Needs water", colors: "from-clay-400 to-clay-500" },
  overdue: { emoji: "🆘", label: "Overdue", colors: "from-clay-500 to-clay-600" },
};

export function WateringStatus({ plant, daysLeft }) {
  const config = STATUS_CONFIG[plant.healthStatus] || STATUS_CONFIG.healthy;
  const totalDays = plant.wateringIntervalDays;
  const barProgress = totalDays <= 0 ? 0 : Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  return (
    <div className="p-4 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-lg shadow-glass-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label-md text-text-secondary">
          {config.emoji} {config.label}
        </span>
        <span className="text-body-sm text-text-tertiary">
          {daysLeft > 0 ? `${daysLeft} days until watering` : daysLeft === 0 ? "Water today" : `${Math.abs(daysLeft)} days overdue`}
        </span>
      </div>

      {/* Gradient progress bar */}
      <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden mb-3 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.colors} transition-all duration-700 ease-out`}
          style={{ width: `${barProgress}%` }}
        />
      </div>

      {/* Weather-adjusted notice */}
      {plant.adjustedInterval && plant.adjustedInterval !== plant.wateringIntervalDays && (
        <div className="mb-3 px-3 py-2 bg-sky-50/80 border border-sky-200 rounded-md text-label-sm text-sky-700 flex items-center gap-2">
          <span>🌤️</span>
          <span>Weather-adjusted: every <strong>{plant.adjustedInterval}d</strong> (base: {plant.wateringIntervalDays}d)</span>
        </div>
      )}

      <div className="flex justify-between text-body-sm text-text-tertiary">
        <span>{plant.lastWatered ? `Last watered: ${formatDate(plant.lastWatered)}` : "Not watered yet"}</span>
        <span>Next: {formatDate(plant.nextWatering)}</span>
      </div>
    </div>
  );
}
