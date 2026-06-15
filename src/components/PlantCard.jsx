import { useNavigate } from "react-router-dom";
import { BreathRingSimple } from "@/components/BreathRing";
import { SpeciesBadge } from "@/components/SpeciesBadge";
import { cn } from "@/lib/cn";
import { daysUntil } from "@/lib/date";

const STATUS_MAP = {
  healthy: { emoji: "✅", label: "Healthy", color: "text-sage-600 bg-sage-100" },
  warning: { emoji: "💧", label: "Water soon", color: "text-soil-600 bg-soil-100" },
  dry: { emoji: "🥀", label: "Needs water", color: "text-clay-500 bg-clay-100" },
  overdue: { emoji: "🆘", label: "Overdue", color: "text-clay-600 bg-clay-200" },
};

export function PlantCard({ plant }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[plant.healthStatus] || STATUS_MAP.healthy;
  const daysLeft = daysUntil(plant.nextWatering);
  const progress = Math.max(daysLeft, 0);

  return (
    <button
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="w-full text-left p-4 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-lg shadow-glass-sm hover:shadow-glass-md active:scale-[0.99] transition-all flex items-center gap-3"
    >
      {/* Status emoji */}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", status.color)}>
        {status.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-lg font-semibold text-text-primary truncate">{plant.name}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <SpeciesBadge species={plant.species} room={plant.room} size="sm" />
        </div>
      </div>

      {/* Breath ring */}
      <BreathRingSimple progress={progress} status={plant.healthStatus} />
    </button>
  );
}
