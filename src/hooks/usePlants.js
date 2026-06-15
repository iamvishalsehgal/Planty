import { useCallback, useEffect, useMemo } from "react";
import { usePlantStore } from "@/stores/plantStore";

export function usePlants() {
  const store = usePlantStore();

  useEffect(() => {
    store.loadFromDisk();
  }, []);

  const addPlant = useCallback(
    (data) => store.addPlant(data),
    []
  );

  const sortedPlants = useMemo(
    () => [...store.plants].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [store.plants]
  );

  const thirstyPlants = store.getPlantsNeedingWater();
  const healthyPlants = store.plants.filter((p) => p.healthStatus === "healthy");

  return {
    plants: sortedPlants,
    thirstyPlants,
    healthyPlants,
    isLoading: store.isLoading,
    addPlant,
    updatePlant: store.updatePlant,
    removePlant: store.removePlant,
    waterPlant: store.waterPlant,
    getPlant: store.getPlant,
  };
}
