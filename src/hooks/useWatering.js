import { useCallback } from "react";
import { usePlantStore } from "@/stores/plantStore";
import { daysUntil } from "@/lib/date";

export function useWatering(plantId) {
  const plant = usePlantStore((s) => s.plants.find((p) => p.id === plantId));
  const waterPlant = usePlantStore((s) => s.waterPlant);

  const handleWater = useCallback(() => {
    waterPlant(plantId);
  }, [plantId, waterPlant]);

  const daysLeft = plant ? daysUntil(plant.nextWatering) : 0;
  const nextWatering = plant?.nextWatering ?? null;
  const lastWatered = plant?.lastWatered ?? null;

  return {
    plant,
    daysLeft,
    nextWatering,
    lastWatered,
    waterPlant: handleWater,
  };
}
