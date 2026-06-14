import { useCallback, useEffect } from "react";
import { usePlantStore } from "@stores/plantStore";
import type { PlantCreate } from "@stores/plantStore";

export function usePlants() {
  const store = usePlantStore();

  useEffect(() => {
    store.loadFromDisk();
  }, []);

  const addPlant = useCallback(
    (data: PlantCreate) => store.addPlant(data),
    []
  );

  const sortedPlants = [...store.plants].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
