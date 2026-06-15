import { useNavigate } from "react-router-dom";
import { BreathRingSimple } from "@/components/BreathRing";
import { SpeciesBadge } from "@/components/SpeciesBadge";
import { cn } from "@/lib/cn";
import { daysUntil } from "@/lib/date";

const STATUS_MAP = {
  healthy: { emoji: "✅", label: "Healthy", ring: "ring-sage-300" },
  warning: { emoji: "💧", label: "Water soon", ring: "ring-soil-300" },
  dry: { emoji: "🥀", label: "Needs water", ring: "ring-clay-300" },
  overdue: { emoji: "🆘", label: "Overdue", ring: "ring-clay-400" },
};

export function PlantCard({ plant }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[plant.healthStatus] || STATUS_MAP.healthy;
  const daysLeft = daysUntil(plant.nextWatering);
  const progress = Math.max(daysLeft, 0);

  return (
    <button
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="w-full text-left p-4 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-xl shadow-glass-sm hover:shadow-glass-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ease-out flex items-center gap-4"
    >
      {/* Status indicator + photo */}
      <div className={cn("relative w-12 h-12 rounded-full flex items-center justify-center text-xl ring-2 ring-offset-1 ring-offset-transparent", status.ring)}>
        {plant.photoUri ? (
          <img src={plant.photoUri} alt={plant.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          status.emoji
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-lg font-semibold text-text-primary truncate">{plant.name}</h3>
        <div className="flex items-center gap-1 mt-1">
          <SpeciesBadge species={plant.species} room={plant.room} size="sm" />
        </div>
      </div>

      {/* Breath ring */}
      <div className="flex-shrink-0">
        <BreathRingSimple progress={progress} status={plant.healthStatus} />
      </div>
    </button>
  );
}
