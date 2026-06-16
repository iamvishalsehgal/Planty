import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { BreathRing } from "@/components/BreathRing";
import { SpeciesBadge } from "@/components/SpeciesBadge";
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
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cream-200 animate-pulse" />
          <div className="h-8 bg-cream-200 rounded w-40 animate-pulse" />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
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
      <EmptyState emoji="🔍" title="Plant not found" description="This plant may have been removed."
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

  const progress = Math.max(daysLeft, 0);
  const totalDays = plant.wateringIntervalDays;
  const barPct = totalDays <= 0 ? 0 : Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  const statusEmoji = { healthy: "✅", warning: "💧", dry: "🥀", overdue: "🆘" }[plant.healthStatus] || "✅";

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/")} aria-label="Back to plants"
          className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-400 transition-all hover:scale-105 active:scale-95 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-display-md text-text-primary truncate">{plant.name}</h1>
          <SpeciesBadge species={plant.species} room={plant.room} size="sm" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-3">
        {/* Hero + watering combined */}
        <GlassCard variant="lg" className="flex items-center gap-5 py-5">
          {/* Left: photo + ring */}
          <div className="flex-shrink-0 relative">
            {plant.photoUri ? (
              <img src={plant.photoUri} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-cream-200/50" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sage-200 to-sage-400 flex items-center justify-center ring-2 ring-cream-200/50">
                <span className="text-2xl">🪴</span>
              </div>
            )}
          </div>

          {/* Center: ring */}
          <div className="flex-shrink-0">
            <BreathRing progress={progress} size={100} strokeWidth={8} status={plant.healthStatus} totalDays={totalDays} />
          </div>

          {/* Right: quick stats */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-1.5 text-label-sm">
              <span>{statusEmoji}</span>
              <span className="text-text-secondary capitalize">{plant.healthStatus}</span>
            </div>
            <div className="text-body-sm text-text-tertiary">
              {daysLeft > 0 ? `${daysLeft}d until water` : daysLeft === 0 ? "Water today" : `${Math.abs(daysLeft)}d overdue`}
            </div>
            <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                plant.healthStatus === "healthy" ? "bg-sage-500" :
                plant.healthStatus === "warning" ? "bg-soil-500" :
                plant.healthStatus === "dry" ? "bg-clay-500" : "bg-clay-600"
              }`} style={{ width: `${barPct}%` }} />
            </div>
            {plant.adjustedInterval && plant.adjustedInterval !== totalDays && (
              <div className="text-label-sm text-sky-600">🌤️ {plant.adjustedInterval}d adjusted</div>
            )}
          </div>
        </GlassCard>

        {/* Water button */}
        {justWatered ? (
          <div className="p-4 bg-sage-100 border border-sage-300 rounded-2xl text-center animate-page-in">
            <span className="text-label-md text-sage-700">✅ Watered! {plant.name} is happy 🌱</span>
          </div>
        ) : cooldown ? (
          <div className="p-4 bg-soil-100 border border-soil-300 rounded-2xl text-center">
            <span className="text-label-md text-soil-700">⏳ 48h cooldown</span>
          </div>
        ) : (
          <Button label={daysLeft <= 0 ? "Water now! 💧" : `Water early`} variant={daysLeft <= 0 ? "primary" : "secondary"}
            size="lg" onClick={handleWater}
            className={`w-full ${daysLeft <= 0 ? "animate-pulse shadow-[0_0_24px_rgba(79,122,66,0.4)]" : ""}`} />
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
        <button onClick={handleDelete}
          className="w-full py-3 text-label-md text-clay-500 hover:text-clay-600 transition-colors">
          Remove plant
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-body-sm text-text-tertiary">{label}</span>
      <span className="text-body-sm text-text-primary font-medium">{value}</span>
    </div>
  );
}
