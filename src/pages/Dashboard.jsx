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
      <div className="p-5 space-y-5">
        <div className="h-24 bg-cream-50/50 rounded-2xl animate-pulse" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <EmptyState
        title="Your garden awaits"
        description="Add your first plant to start tracking watering schedules and keeping them thriving."
        action={{ label: "Add a plant", onClick: () => navigate("/add") }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-page-in">
      {/* Header */}
      <div className="px-5 pt-8 pb-3">
        <h1 className="text-display-lg text-text-primary tracking-tight leading-none">
          Plants
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-tertiary">
            <span className="w-2 h-2 rounded-full bg-sage-500" />
            {healthyPlants.length} healthy
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-tertiary">
            <span className="w-2 h-2 rounded-full bg-clay-500" />
            {thirstyPlants.length} thirsty
          </span>
        </div>
      </div>

      {/* Weather */}
      <div className="px-5 mb-4">
        <WeatherStrip />
      </div>

      {/* Thirsty alert */}
      {thirstyPlants.length > 0 && (
        <div className="px-5 mb-4">
          <div className="p-4 bg-clay-50/80 backdrop-blur-sm border border-clay-200/50 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-clay-500 animate-pulse flex-shrink-0" />
              <span className="text-[14px] font-semibold text-clay-700">
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
        <div className="px-5 mb-4">
          <div className="p-4 bg-sage-50/80 backdrop-blur-sm border border-sage-200/50 rounded-2xl flex items-center gap-3 animate-page-in">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 flex-shrink-0" />
            <span className="text-[14px] font-semibold text-sage-700">
              {wateredCount} plant{wateredCount > 1 ? "s" : ""} watered
            </span>
          </div>
        </div>
      )}

      {/* Plant list */}
      <div className="flex-1 overflow-auto px-5 pb-8">
        <div className="space-y-3.5">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </div>
  );
}
