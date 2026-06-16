import { useCallback, useState, useMemo } from "react";
import { usePlantStore, WATERING_COOLDOWN_MS } from "@/stores/plantStore";
import { daysUntil } from "@/lib/date";

export function useWatering(plantId) {
  const plant = usePlantStore((s) => s.plants.find((p) => p.id === plantId));
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

  // Cooldown status — single source of truth from store constant
  const inCooldown = useMemo(() => {
    if (!plant?.lastWatered) return false;
    return Date.now() - new Date(plant.lastWatered).getTime() < WATERING_COOLDOWN_MS;
  }, [plant?.lastWatered]);

  return {
    plant,
    daysLeft,
    nextWatering,
    lastWatered,
    waterPlant: handleWater,
    cooldown: justWatered || inCooldown,
  };
}
