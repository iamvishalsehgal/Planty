import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { BreathRing } from "@/components/BreathRing";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/date";

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
        <div className="flex-1 overflow-auto px-4 pb-8 space-y-4">
          <div className="p-8 rounded-2xl bg-cream-100/30 animate-pulse">
            <div className="w-36 h-36 rounded-full bg-cream-200 mx-auto" />
            <div className="w-32 h-6 bg-cream-200 rounded mx-auto mt-4" />
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

  const progress = Math.max(daysLeft, 0);
  const totalDays = plant.wateringIntervalDays;
  const intervalLabel = plant.adjustedInterval && plant.adjustedInterval !== totalDays
    ? `${plant.adjustedInterval}d (base: ${totalDays}d)`
    : `${totalDays} days`;

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} aria-label="Back"
          className="w-10 h-10 rounded-full bg-cream-200/80 flex items-center justify-center pressable flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-display-md text-text-primary truncate">{plant.name}</h1>
          <p className="text-sm text-text-tertiary">{plant.species} · {plant.room}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-8 space-y-4">
        {/* Hero — centered ring */}
        <div className="flex flex-col items-center py-8 px-4 bg-cream-50/40 backdrop-blur-xl border border-cream-200/30 rounded-[28px] shadow-glass">
          {/* Photo */}
          {plant.photoUri ? (
            <img src={plant.photoUri} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-cream-200/50 mb-4" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-200 to-sage-400 flex items-center justify-center ring-2 ring-cream-200/50 mb-4 text-3xl">
              🪴
            </div>
          )}
          {/* Ring */}
          <BreathRing progress={progress} size={144} strokeWidth={9} status={plant.healthStatus} totalDays={totalDays} />
          {/* Status label */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              plant.healthStatus === "healthy" ? "bg-sage-500" :
              plant.healthStatus === "warning" ? "bg-soil-500" :
              plant.healthStatus === "dry" ? "bg-clay-500" : "bg-clay-600"
            }`} />
            <span className="text-sm font-semibold text-text-secondary capitalize">{plant.healthStatus}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Water every" value={intervalLabel} />
          <StatBox label="Last watered" value={lastWatered ? formatDate(lastWatered) : "—"} />
          <StatBox label="Next watering" value={formatDate(nextWatering)} />
          <StatBox label="Added" value={formatDate(fullPlant.createdAt)} />
        </div>

        {/* Weather adjustment notice */}
        {plant.adjustedInterval && plant.adjustedInterval !== totalDays && (
          <div className="px-4 py-3 bg-sky-50/80 border border-sky-200/50 rounded-2xl flex items-center gap-2 text-sm">
            <span className="text-base">🌤️</span>
            <span className="text-sky-700">Weather-adjusted from {totalDays}d to <strong>{plant.adjustedInterval}d</strong></span>
          </div>
        )}

        {/* Water button */}
        {justWatered ? (
          <div className="p-5 bg-sage-100/80 border border-sage-300/50 rounded-2xl text-center animate-page-in">
            <span className="text-base font-semibold text-sage-700">Watered! 🌱</span>
          </div>
        ) : cooldown ? (
          <div className="p-5 bg-soil-100/80 border border-soil-300/50 rounded-2xl text-center">
            <span className="text-base font-semibold text-soil-700">48h cooldown — watered recently</span>
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

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full py-3 text-sm font-medium text-clay-500 hover:text-clay-600 transition-colors">
          Remove plant
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="p-4 bg-cream-50/40 backdrop-blur-sm border border-cream-200/30 rounded-2xl">
      <div className="text-xs text-text-tertiary mb-1">{label}</div>
      <div className="text-sm font-semibold text-text-primary leading-snug">{value}</div>
    </div>
  );
}
