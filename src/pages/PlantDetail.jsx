import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { usePlantStore } from "@/stores/plantStore";
import { BreathRing } from "@/components/BreathRing";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/date";

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { removePlant, updatePlant, isLoading } = usePlants();
  const { plant: subPlant, daysLeft, nextWatering, lastWatered, waterPlant, cooldown } = useWatering(id);

  // Fallback: direct synchronous lookup if subscription hasn't fired yet
  const plant = useMemo(() => {
    if (subPlant) return subPlant;
    if (!id || isLoading) return undefined;
    // Direct store read bypasses subscription timing
    return usePlantStore.getState().plants.find((p) => p.id === id) || null;
  }, [subPlant, id, isLoading]);
  const [justWatered, setJustWatered] = useState(false);
  const waterTimer = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => () => clearTimeout(waterTimer.current), []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full animate-page-in">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="flex-1 overflow-auto px-4 pb-8 space-y-4">
          <div className="p-8 rounded-2xl bg-gray-100/30 animate-pulse">
            <div className="w-36 h-36 rounded-full bg-gray-200 mx-auto" />
            <div className="w-32 h-6 bg-gray-200 rounded mx-auto mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!plant || plant === null) {
    return (
      <EmptyState title="Plant not found" description="This plant may have been removed."
        action={{ label: "Back to plants", onClick: () => navigate("/") }} />
    );
  }

  const handleWater = () => {
    const result = waterPlant();
    if (result === "ok") {
      setJustWatered(true);
      waterTimer.current = setTimeout(() => setJustWatered(false), 2000);
    }
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
  const healthPercent = totalDays > 0 ? Math.round((progress / totalDays) * 100) : 0;

  const handleFertilize = () => {
    updatePlant(id, { lastFertilized: new Date().toISOString() });
  };
  const handleRepot = () => {
    updatePlant(id, { lastRepotted: new Date().toISOString() });
  };
  const handleAddPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePlant(id, { photoUri: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} aria-label="Back"
          className="w-10 h-10 rounded-full bg-gray-200/80 flex items-center justify-center pressable flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-display-md text-gray-900 truncate">{plant.name}</h1>
          <p className="text-sm text-gray-500">{plant.species} · {plant.room}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-8 space-y-4">
        {/* Hero — ring + action together */}
        <div className="flex flex-col items-center py-6 px-4 bg-white/40 backdrop-blur-xl border border-gray-200/30 rounded-3xl shadow-card">
          {/* Photo */}
          {plant.photoUri ? (
            <img src={plant.photoUri} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200/50 mb-3" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center ring-2 ring-gray-200/50 mb-3 text-2xl">
              🪴
            </div>
          )}
          {/* Ring — 130px (agent-recommended sweet spot) */}
          <BreathRing progress={progress} size={130} strokeWidth={8} status={plant.healthStatus} totalDays={totalDays} />
          {/* Health Score — prominent labeled indicator */}
          <div className="mt-3 flex flex-col items-center">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Health Score</span>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${
              plant.healthStatus === "healthy"
                ? "bg-green-50/60 border-green-200/50"
                : plant.healthStatus === "warning"
                  ? "bg-gray-50/60 border-gray-200/50"
                  : "bg-blue-50/60 border-blue-200/50"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                plant.healthStatus === "healthy" ? "bg-green-500" :
                plant.healthStatus === "warning" ? "bg-gray-500" : "bg-blue-500"
              }`} />
              <span className={`text-sm font-bold capitalize ${
                plant.healthStatus === "healthy" ? "text-green-700" :
                plant.healthStatus === "warning" ? "text-gray-700" : "text-blue-700"
              }`}>{plant.healthStatus}</span>
              <span className="text-xs font-medium text-gray-500">· {healthPercent}%</span>
            </div>
          </div>
          {/* Weather note */}
          {plant.adjustedInterval && plant.adjustedInterval !== totalDays && (
            <div className="mt-2 text-xs text-blue-600 font-medium">🌤️ Weather-adjusted: {plant.adjustedInterval}d</div>
          )}

          {/* Action button — INSIDE the hero card, visually connected to ring */}
          <div className="w-full mt-5">
            {justWatered ? (
              <div className="p-3 bg-green-100/80 border border-green-300/50 rounded-2xl text-center animate-page-in">
                <span className="text-sm font-semibold text-green-700">Watered! 🌱</span>
              </div>
            ) : cooldown ? (
              <div className="p-3 bg-gray-100/80 border border-gray-300/50 rounded-2xl text-center">
                <span className="text-sm font-semibold text-gray-700">48h cooldown — watered recently</span>
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
          </div>
        </div>

        {/* Care needs — water, light, humidity */}
        <div className="grid grid-cols-3 gap-3">
          <CareNeedCard
            label="Water"
            value={`Every ${totalDays}d`}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            }
            color="blue"
          />
          <CareNeedCard
            label="Light"
            value={plant.lightNeeds || "Bright indirect"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            }
            color="gray"
          />
          <CareNeedCard
            label="Humidity"
            value={plant.humidity || "Moderate"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 5 0" />
                <path d="M4 13c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 5 0" />
                <path d="M4 18c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 5 0" />
              </svg>
            }
            color="green"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          <QuickActionButton
            label={justWatered ? "Done!" : "Watered"}
            onClick={!cooldown && !justWatered ? handleWater : undefined}
            disabled={cooldown || justWatered}
            active={justWatered}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill={justWatered ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            }
          />
          <QuickActionButton
            label="Fertilized"
            onClick={handleFertilize}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5z" />
                <line x1="12" y1="9" x2="12" y2="3" />
                <line x1="8" y1="6" x2="16" y2="6" />
              </svg>
            }
          />
          <QuickActionButton
            label="Repotted"
            onClick={handleRepot}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 10h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10z" />
                <path d="M5 10V6a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v2" />
              </svg>
            }
          />
          <QuickActionButton
            label="Add photo"
            onClick={() => fileInputRef.current?.click()}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="16" rx="2" />
                <circle cx="8.5" cy="10.5" r="1.5" />
                <path d="M22 15l-5-4-4 3-3-3-8 6" />
              </svg>
            }
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAddPhoto}
            className="hidden"
          />
        </div>

        {/* Stats — prioritized hierarchy */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Last watered" value={lastWatered ? formatDate(lastWatered) : "—"} primary />
          <StatBox label="Next watering" value={formatDate(nextWatering)} primary />
          <StatBox label="Water every" value={intervalLabel} />
          <StatBox label="Added" value={formatDate(plant.createdAt)} />
        </div>

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full py-3 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">
          Remove plant
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, primary }) {
  return (
    <div className={`${primary ? "p-4" : "p-3"} bg-white/40 backdrop-blur-sm border border-gray-200/30 rounded-2xl`}>
      <div className={`${primary ? "text-xs" : "text-[11px]"} text-gray-500 mb-1`}>{label}</div>
      <div className={`${primary ? "text-base font-bold" : "text-sm font-semibold"} text-gray-900 leading-snug`}>{value}</div>
    </div>
  );
}

function CareNeedCard({ label, value, icon, color }) {
  const colors = {
    blue: { bg: "bg-blue-50/60", border: "border-blue-200/40", text: "text-blue-700", icon: "text-blue-500" },
    gray: { bg: "bg-gray-50/60", border: "border-gray-200/40", text: "text-gray-700", icon: "text-gray-500" },
    green: { bg: "bg-green-50/60", border: "border-green-200/40", text: "text-green-700", icon: "text-green-500" },
  };
  const c = colors[color] || colors.green;

  return (
    <div className={`flex flex-col items-center gap-2 p-4 ${c.bg} backdrop-blur-sm border ${c.border} rounded-2xl`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-center">{label}</div>
        <div className={`text-[13px] font-bold ${c.text} text-center leading-tight mt-0.5`}>{value}</div>
      </div>
    </div>
  );
}

function QuickActionButton({ label, onClick, disabled, active, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 pressable ${
        active
          ? "bg-green-100/80 border border-green-300/50 shadow-card-sm"
          : disabled
            ? "bg-gray-50/30 border border-gray-200/20 opacity-40 cursor-not-allowed"
            : "bg-white/40 backdrop-blur-sm border border-gray-200/30 hover:bg-green-50/60 hover:border-green-200/50 hover:shadow-card-sm"
      }`}
    >
      <span className={active ? "text-green-600" : "text-gray-600"}>{icon}</span>
      <span className={`text-[11px] font-semibold leading-tight ${
        active ? "text-green-700" : "text-gray-500"
      }`}>{label}</span>
    </button>
  );
}
