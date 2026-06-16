import { formatDate } from "@/lib/date";

const STATUS_CONFIG = {
  healthy: { label: "Healthy", colors: "from-sage-400 to-sage-600", dot: "bg-sage-500" },
  warning: { label: "Water soon", colors: "from-soil-400 to-soil-600", dot: "bg-soil-500" },
  dry: { label: "Needs water", colors: "from-clay-400 to-clay-500", dot: "bg-clay-500" },
  overdue: { label: "Overdue", colors: "from-clay-500 to-clay-600", dot: "bg-clay-600" },
};

export function WateringStatus({ plant, daysLeft }) {
  const config = STATUS_CONFIG[plant.healthStatus] || STATUS_CONFIG.healthy;
  const totalDays = plant.wateringIntervalDays;
  const barProgress = totalDays <= 0 ? 0 : Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  return (
    <div className="p-4 bg-cream-50/60 backdrop-blur-lg border border-white/30 rounded-2xl shadow-card-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-[14px] font-semibold text-text-secondary">{config.label}</span>
        </div>
        <span className="text-[13px] text-text-tertiary">
          {daysLeft > 0 ? `${daysLeft} days until watering` : daysLeft === 0 ? "Water today" : `${Math.abs(daysLeft)} days overdue`}
        </span>
      </div>

      <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.colors} transition-all duration-700 ease-out`}
          style={{ width: `${barProgress}%` }}
        />
      </div>

      {plant.adjustedInterval && plant.adjustedInterval !== plant.wateringIntervalDays && (
        <div className="mb-3 px-3 py-2 bg-sky-50/80 border border-sky-200/50 rounded-xl text-[12px] font-medium text-sky-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span>Weather-adjusted: every <strong>{plant.adjustedInterval}d</strong> (base: {plant.wateringIntervalDays}d)</span>
        </div>
      )}

      <div className="flex justify-between text-[12px] font-medium text-text-tertiary">
        <span>{plant.lastWatered ? `Last watered: ${formatDate(plant.lastWatered)}` : "Not watered yet"}</span>
        <span>Next: {formatDate(plant.nextWatering)}</span>
      </div>
    </div>
  );
}
