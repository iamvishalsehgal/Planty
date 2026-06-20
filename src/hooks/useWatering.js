import { useCallback, useState, useMemo } from "react";
import { usePlantStore, WATERING_COOLDOWN_MS } from "@/stores/plantStore";
import { daysUntil } from "@/lib/date";

export function useWatering(plantId) {
  const plant = usePlantStore((s) => {
    if (!plantId) return undefined;
    return s.plants.find((p) => p.id === plantId);
  });
  const [justWatered, setJustWatered] = useState(false);

  const handleWater = useCallback(() => {
    const result = usePlantStore.getState().waterPlant(plantId);
    if (result === "cooldown") {
      setJustWatered(true);
      setTimeout(() => setJustWatered(false), 3000);
    }
    return result;
  }, [plantId]);

  const daysLeft = plant ? daysUntil(plant.nextWatering) : 0;
  const nextWatering = plant?.nextWatering ?? null;
  const lastWatered = plant?.lastWatered ?? null;

  // Cooldown status — cheap computation, recalculates each render
  const inCooldown = plant?.lastWatered
    ? Date.now() - new Date(plant.lastWatered).getTime() < WATERING_COOLDOWN_MS
    : false;

  return {
    plant,
    daysLeft,
    nextWatering,
    lastWatered,
    waterPlant: handleWater,
    cooldown: justWatered || inCooldown,
  };
}
