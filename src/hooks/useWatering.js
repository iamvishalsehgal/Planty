import { useCallback, useState } from "react";
import { usePlantStore } from "@/stores/plantStore";
import { daysUntil } from "@/lib/date";

const COOLDOWN_HOURS = 48;

export function useWatering(plantId) {
  const plant = usePlantStore((s) => s.plants.find((p) => p.id === plantId));
  const [cooldown, setCooldown] = useState(false);

  const handleWater = useCallback(() => {
    const result = usePlantStore.getState().waterPlant(plantId);
    if (result === "cooldown") {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    }
    return result;
  }, [plantId]);

  const daysLeft = plant ? daysUntil(plant.nextWatering) : 0;
  const nextWatering = plant?.nextWatering ?? null;
  const lastWatered = plant?.lastWatered ?? null;

  // Check if currently in cooldown
  const inCooldown = plant?.lastWatered
    ? Date.now() - new Date(plant.lastWatered).getTime() < COOLDOWN_HOURS * 60 * 60 * 1000
    : false;

  return {
    plant,
    daysLeft,
    nextWatering,
    lastWatered,
    waterPlant: handleWater,
    cooldown: cooldown || inCooldown,
  };
}
