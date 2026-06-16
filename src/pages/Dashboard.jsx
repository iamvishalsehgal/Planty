import { useState, useEffect, useRef } from "react";
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
  const [wateredCount, setWateredCount] = useState(0);
  const waterTimer = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(waterTimer.current), []);

  const handleWaterAll = () => {
    setRefreshing(true);
    const count = thirstyPlants.length;
    thirstyPlants.forEach((p) => waterPlant(p.id));
    setWateredCount(count);
    waterTimer.current = setTimeout(() => {
      setRefreshing(false);
      setWateredCount(0);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-cream-50/50 rounded-lg animate-pulse" />
        <DashboardSkeleton />
      </div>
    );
  }

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
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-display-lg text-text-primary tracking-tight">Plants</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-1.5 text-label-sm text-text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
            {healthyPlants.length}
          </span>
          <span className="inline-flex items-center gap-1.5 text-label-sm text-text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-clay-500" />
            {thirstyPlants.length}
          </span>
        </div>
      </div>

      {/* Weather */}
      <div className="px-4 mb-4">
        <WeatherStrip />
      </div>

      {/* Thirsty alert */}
      {thirstyPlants.length > 0 && (
        <div className="px-4 mb-4">
          <div className="p-4 bg-clay-100/80 border border-clay-200/60 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="text-label-md text-clay-700">
                {thirstyPlants.length} plant{thirstyPlants.length > 1 ? "s" : ""} need{thirstyPlants.length === 1 ? "s" : ""} water
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

      {/* Watered success */}
      {wateredCount > 0 && (
        <div className="px-4 mb-4">
          <div className="p-4 bg-sage-100/80 border border-sage-300/60 rounded-xl flex items-center gap-2 animate-page-in">
            <span className="text-xl">✅</span>
            <span className="text-label-md text-sage-700">
              {wateredCount} plant{wateredCount > 1 ? "s" : ""} watered!
            </span>
          </div>
        </div>
      )}

      {/* Plant grid */}
      <div className="flex-1 overflow-auto px-4 pb-6">
        <div className="space-y-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </div>
  );
}
