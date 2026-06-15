import { formatDate } from "@/lib/date";

const STATUS_CONFIG = {
  healthy: { emoji: "✅", label: "Healthy", color: "bg-sage-500" },
  warning: { emoji: "💧", label: "Water soon", color: "bg-soil-500" },
  dry: { emoji: "🥀", label: "Needs water", color: "bg-clay-500" },
  overdue: { emoji: "🆘", label: "Overdue", color: "bg-clay-600" },
};

export function WateringStatus({ plant, daysLeft }) {
  const config = STATUS_CONFIG[plant.healthStatus] || STATUS_CONFIG.healthy;
  const totalDays = plant.wateringIntervalDays;
  const barProgress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

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

      {/* Progress bar */}
      <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.color}`}
          style={{ width: `${barProgress}%` }}
        />
      </div>

      {/* Weather-adjusted notice */}
      {plant.adjustedInterval && plant.adjustedInterval !== plant.wateringIntervalDays && (
        <div className="mb-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-md text-label-sm text-sky-700">
          🌤️ Weather-adjusted: every {plant.adjustedInterval}d (base: {plant.wateringIntervalDays}d)
        </div>
      )}

      <div className="flex justify-between text-body-sm text-text-tertiary">
        <span>Last watered: {formatDate(plant.lastWatered)}</span>
        <span>Next: {formatDate(plant.nextWatering)}</span>
      </div>
    </div>
  );
}
