import { useCallback, useMemo } from "react";
import { usePlantStore } from "@/stores/plantStore";

export function usePlants() {
  const plants = usePlantStore((s) => s.plants);
  const isLoading = usePlantStore((s) => s.isLoading);

  const addPlant = useCallback(
    (data) => usePlantStore.getState().addPlant(data),
    []
  );

  const sortedPlants = useMemo(
    () => [...plants].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [plants]
  );

  const thirstyPlants = useMemo(
    () => plants.filter((p) => p.healthStatus === "dry" || p.healthStatus === "overdue"),
    [plants]
  );

  const healthyPlants = useMemo(
    () => plants.filter((p) => p.healthStatus === "healthy"),
    [plants]
  );

  return {
    plants: sortedPlants,
    thirstyPlants,
    healthyPlants,
    isLoading,
    addPlant,
    updatePlant: usePlantStore.getState().updatePlant,
    removePlant: usePlantStore.getState().removePlant,
    waterPlant: usePlantStore.getState().waterPlant,
    getPlant: usePlantStore.getState().getPlant,
  };
}
