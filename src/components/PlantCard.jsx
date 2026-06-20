import { useNavigate } from "react-router-dom";
import { BreathRingSimple } from "@/components/BreathRing";
import { SpeciesBadge } from "@/components/SpeciesBadge";
import { daysUntil } from "@/lib/date";

const STATUS_COLORS = {
  healthy: { accent: "border-l-green-500", dot: "bg-green-500", label: "Healthy" },
  warning: { accent: "border-l-gray-500", dot: "bg-gray-500", label: "Water soon" },
  dry: { accent: "border-l-blue-500", dot: "bg-blue-500", label: "Needs water" },
  overdue: { accent: "border-l-blue-600", dot: "bg-blue-600", label: "Overdue" },
};

export function PlantCard({ plant }) {
  const navigate = useNavigate();
  const status = STATUS_COLORS[plant.healthStatus] || STATUS_COLORS.healthy;
  const daysLeft = daysUntil(plant.nextWatering);
  const daysAbs = Math.abs(daysLeft);
  const isUrgent = daysLeft <= 1;

  return (
    <button
      onClick={() => navigate(`/plant/${plant.id}`)}
      aria-label={`View ${plant.name} — ${daysLeft > 0 ? `${daysLeft} days until water` : daysLeft === 0 ? "Water today" : `${Math.abs(daysLeft)} days overdue`}`}
      className={`w-full text-left p-5 bg-white backdrop-blur-xl border border-gray-200 border-l-4 ${status.accent} rounded-2xl shadow-card pressable hover:shadow-card-lg transition-all duration-300 flex items-center gap-4`}
    >
      {/* Photo or placeholder */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-green-200 ring-1 ring-black/5">
        {plant.photoUri ? (
          <img
            src={plant.photoUri}
            alt=""
            role="presentation"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
              <path d="M12 3v2" />
              <path d="M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7" />
              <path d="M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name & species */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-semibold text-gray-800 truncate leading-tight tracking-tight">
          {plant.name}
        </h3>
        <div className="mt-1">
          <SpeciesBadge species={plant.species} room={plant.room} size="sm" />
        </div>
        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
            {status.label}
          </span>
        </div>
      </div>

      {/* Days count + mini ring — the visual anchor */}
      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
        <BreathRingSimple
          progress={Math.max(daysLeft, 0)}
          status={plant.healthStatus}
          totalDays={plant.wateringIntervalDays}
        />
        {daysLeft > 0 ? (
          <span className={`text-[11px] font-semibold tabular-nums tracking-tight ${isUrgent ? "text-blue-500" : "text-gray-400"}`}>
            {daysLeft}d
          </span>
        ) : daysLeft === 0 ? (
          <span className="text-[11px] font-semibold text-blue-500 tracking-tight">Today</span>
        ) : (
          <span className="text-[11px] font-semibold text-blue-600 tracking-tight">{daysAbs}d over</span>
        )}
      </div>
    </button>
  );
}
