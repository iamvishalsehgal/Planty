import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { BreathRing } from "@/components/BreathRing";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatTime } from "@/lib/date";

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { removePlant, getPlant, isLoading } = usePlants();
  const { plant, daysLeft, nextWatering, lastWatered, waterPlant, cooldown } = useWatering(id);
  const fullPlant = getPlant(id);
  const [justWatered, setJustWatered] = useState(false);
  const waterTimer = useRef(null);
  useEffect(() => () => clearTimeout(waterTimer.current), []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full animate-page-in">
        <div className="px-5 pt-6 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cream-200 animate-pulse" />
          <div className="h-8 bg-cream-200 rounded w-40 animate-pulse" />
        </div>
        <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
          <div className="p-6 rounded-2xl bg-cream-50/50 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-cream-200 mx-auto" />
            <div className="w-28 h-28 rounded-full bg-cream-200 mx-auto mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!plant || !fullPlant) {
    return (
      <EmptyState title="Plant not found" description="This plant may have been removed."
        action={{ label: "Back to plants", onClick: () => navigate("/") }} />
    );
  }

  const handleWater = () => {
    waterPlant();
    setJustWatered(true);
    waterTimer.current = setTimeout(() => setJustWatered(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Remove ${plant.name}? This cannot be undone.`)) {
      removePlant(id);
      navigate("/");
    }
  };

  const totalDays = plant.wateringIntervalDays;
  const barPct = totalDays <= 0 ? 0 : Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  const statusColors = {
    healthy: "bg-sage-500",
    warning: "bg-soil-500",
    dry: "bg-clay-500",
    overdue: "bg-clay-600",
  };
  const barColor = statusColors[plant.healthStatus] || statusColors.healthy;

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          aria-label="Back to plants"
          className="w-10 h-10 rounded-full bg-cream-200/80 backdrop-blur-sm flex items-center justify-center pressable flex-shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-display-md text-text-primary truncate tracking-tight">{plant.name}</h1>
          <p className="text-[13px] text-text-tertiary mt-0.5">
            {plant.species}{plant.room ? ` · ${plant.room}` : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {/* Hero card with ring */}
        <GlassCard variant="lg" className="flex items-center gap-6 py-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {plant.photoUri ? (
              <img
                src={plant.photoUri}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage-200 to-sage-400 flex items-center justify-center ring-1 ring-black/5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                  <path d="M12 3v2" />
                  <path d="M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7" />
                  <path d="M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Ring */}
          <div className="flex-shrink-0">
            <BreathRing progress={Math.max(daysLeft, 0)} size={100} strokeWidth={7} status={plant.healthStatus} totalDays={totalDays} />
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${barColor}`} />
              <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide capitalize">
                {plant.healthStatus}
              </span>
            </div>
            <div className="text-[13px] text-text-tertiary">
              {daysLeft > 0 ? `${daysLeft}d until water` : daysLeft === 0 ? "Water today" : `${Math.abs(daysLeft)}d overdue`}
            </div>
            <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            {plant.adjustedInterval && plant.adjustedInterval !== totalDays && (
              <div className="text-[12px] font-medium text-sky-600">Adjusted: {plant.adjustedInterval}d</div>
            )}
          </div>
        </GlassCard>

        {/* Water button */}
        {justWatered ? (
          <div className="p-4 bg-sage-50/80 border border-sage-200/50 rounded-2xl text-center animate-page-in">
            <span className="text-[14px] font-semibold text-sage-700">Watered! {plant.name} is happy.</span>
          </div>
        ) : cooldown ? (
          <div className="p-4 bg-soil-50/80 border border-soil-200/50 rounded-2xl text-center">
            <span className="text-[14px] font-semibold text-soil-700">48h cooldown active</span>
          </div>
        ) : (
          <Button
            label={daysLeft <= 0 ? "Water now" : "Water early"}
            variant={daysLeft <= 0 ? "primary" : "secondary"}
            size="lg"
            onClick={handleWater}
            className={`w-full ${daysLeft <= 0 ? "shadow-[0_0_32px_rgba(79,122,66,0.3)]" : ""}`}
          />
        )}

        {/* Details */}
        <GlassCard variant="md">
          <div className="divide-y divide-cream-200/50">
            <DetailRow label="Water every" value={`${totalDays} days`} />
            <DetailRow label="Last watered" value={lastWatered ? `${formatDate(lastWatered)} — ${formatTime(lastWatered)}` : "Not yet"} />
            <DetailRow label="Next watering" value={formatDate(nextWatering)} />
            <DetailRow label="Added on" value={formatDate(fullPlant.createdAt)} />
          </div>
        </GlassCard>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full py-3.5 text-[14px] font-semibold text-clay-500 hover:text-clay-600 transition-colors"
        >
          Remove plant
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3">
      <span className="text-[13px] text-text-tertiary">{label}</span>
      <span className="text-[13px] text-text-primary font-semibold">{value}</span>
    </div>
  );
}
