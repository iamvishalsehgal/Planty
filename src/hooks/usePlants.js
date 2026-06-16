import { useCallback, useMemo } from "react";
import { usePlantStore } from "@/stores/plantStore";

export function usePlants() {
  const plants = usePlantStore((s) => s.plants);
  const isLoading = usePlantStore((s) => s.isLoading);

  const addPlant = useCallback(
    (data) => usePlantStore.getState().addPlant(data),
    []
  );

  // ISO strings are lexicographically sortable — no Date allocation needed
  const sortedPlants = useMemo(
    () => [...plants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [plants]
  );

  // Single-pass partition — avoids two separate filter passes
  const { thirstyPlants, healthyPlants } = useMemo(() => {
    const thirsty = [];
    const healthy = [];
    for (const p of plants) {
      if (p.healthStatus === "dry" || p.healthStatus === "overdue") thirsty.push(p);
      else if (p.healthStatus === "healthy") healthy.push(p);
    }
    return { thirstyPlants: thirsty, healthyPlants: healthy };
  }, [plants]);

  // Store actions are stable references — safe to pull once
  const store = usePlantStore.getState();

  return {
    plants: sortedPlants,
    thirstyPlants,
    healthyPlants,
    isLoading,
    addPlant,
    updatePlant: store.updatePlant,
    removePlant: store.removePlant,
    waterPlant: store.waterPlant,
    getPlant: store.getPlant,
  };
}
