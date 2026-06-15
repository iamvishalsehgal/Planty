import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { useWatering } from "@/hooks/useWatering";
import { BreathRing } from "@/components/BreathRing";
import { SpeciesBadge } from "@/components/SpeciesBadge";
import { WateringStatus } from "@/components/WateringStatus";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatTime } from "@/lib/date";

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { removePlant, getPlant } = usePlants();
  const { plant, daysLeft, nextWatering, lastWatered, waterPlant } = useWatering(id);
  const fullPlant = getPlant(id);

  if (!plant || !fullPlant) {
    return (
      <EmptyState
        emoji="🔍"
        title="Plant not found"
        description="This plant may have been removed."
        action={{ label: "Back to plants", onClick: () => navigate("/") }}
      />
    );
  }

  const handleDelete = () => {
    if (confirm(`Remove ${plant.name}? This cannot be undone.`)) {
      removePlant(id);
      navigate("/");
    }
  };

  const progress = Math.max(daysLeft, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header with back */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-400 transition-all hover:scale-105 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-display-md text-text-primary truncate flex-1">{plant.name}</h1>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        {/* Hero card */}
        <GlassCard variant="lg" className="flex flex-col items-center py-8">
          <div className="relative mb-2">
            {plant.photoUri ? (
              <img src={plant.photoUri} alt={plant.name} className="w-28 h-28 rounded-full object-cover ring-4 ring-cream-200/50 shadow-card" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-sage-200 to-sage-400 flex items-center justify-center ring-4 ring-cream-200/50 shadow-card">
                <span className="text-5xl">🪴</span>
              </div>
            )}
          </div>
          <BreathRing progress={progress} size={150} strokeWidth={10} status={plant.healthStatus} />
          <h2 className="text-title-lg text-text-primary mt-4">{plant.name}</h2>
          <div className="mt-1">
            <SpeciesBadge species={plant.species} room={plant.room} />
          </div>
        </GlassCard>

        {/* Watering status */}
        <WateringStatus plant={plant} daysLeft={daysLeft} />

        {/* Water button */}
        <Button
          label={daysLeft <= 0 ? "Water now! 💧" : `Water early? (${daysLeft}d left)`}
          variant={daysLeft <= 0 ? "primary" : "secondary"}
          size="lg"
          onClick={waterPlant}
          className="w-full"
        />

        {/* Details */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">📋 Details</h3>
          <div className="space-y-2">
            <DetailRow label="Species" value={plant.species} />
            <DetailRow label="Room" value={plant.room} />
            <DetailRow label="Water every" value={`${plant.wateringIntervalDays} days`} />
            <DetailRow label="Last watered" value={`${formatDate(lastWatered)} at ${formatTime(lastWatered)}`} />
            <DetailRow label="Added" value={formatDate(fullPlant.createdAt)} />
          </div>
        </GlassCard>

        {/* Delete */}
        <Button
          label="Remove plant"
          variant="destructive"
          size="md"
          onClick={handleDelete}
          className="w-full"
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-body-md text-text-tertiary">{label}</span>
      <span className="text-body-md text-text-primary font-medium">{value}</span>
    </div>
  );
}
