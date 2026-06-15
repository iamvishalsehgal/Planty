import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/hooks/usePlants";
import { WeatherStrip } from "@/components/WeatherStrip";
import { PlantCard } from "@/components/PlantCard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function Dashboard() {
  const navigate = useNavigate();
  const { plants, thirstyPlants, healthyPlants, isLoading, waterPlant } = usePlants();
  const [refreshing, setRefreshing] = useState(false);

  const handleWaterAll = async () => {
    setRefreshing(true);
    thirstyPlants.forEach((p) => waterPlant(p.id));
    setTimeout(() => setRefreshing(false), 500);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-cream-50/50 rounded-lg animate-pulse" />
        <DashboardSkeleton />
      </div>
    );
  }

  // Empty
  if (plants.length === 0) {
    return (
      <EmptyState
        emoji="🪴"
        title="No plants yet"
        description="Add your first plant to start tracking watering schedules and keeping them healthy."
        action={{ label: "Add a plant", onClick: () => navigate("/add") }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-display-lg text-text-primary">My Plants</h1>
        <p className="text-body-md text-text-tertiary mt-1">
          {healthyPlants.length} healthy · {thirstyPlants.length} need water
        </p>
      </div>

      {/* Weather */}
      <div className="px-4 mb-3">
        <WeatherStrip />
      </div>

      {/* Thirsty alert */}
      {thirstyPlants.length > 0 && (
        <div className="px-4 mb-3">
          <div className="p-4 bg-clay-100/80 border border-clay-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-label-md text-clay-700">
                🚨 {thirstyPlants.length} plant{thirstyPlants.length > 1 ? "s" : ""} need{thirstyPlants.length === 1 ? "s" : ""} water
              </span>
            </div>
            <Button
              label="Water all"
              variant="primary"
              size="sm"
              onClick={handleWaterAll}
              loading={refreshing}
            />
          </div>
        </div>
      )}

      {/* Plant grid */}
      <div className="flex-1 overflow-auto px-4 pb-24">
        <div className="space-y-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </div>
  );
}
