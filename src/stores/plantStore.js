import { create } from "zustand";
import { getWeather } from "@/lib/weather";
import { adjustWateringInterval, daysUntil } from "@/lib/date";

export const PLANTS_STORAGE_KEY = "planty-plants";
export const WATERING_COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

const persistPlants = (plants) => {
  try {
    localStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
    return true;
  } catch (e) {
    console.error("Failed to save plants:", e.message);
    return false;
  }
};

const loadPlants = () => {
  try {
    const raw = localStorage.getItem(PLANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function computeNextWatering(intervalDays, fromDate) {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString();
}

function computeHealthStatus(nextWatering) {
  const d = daysUntil(nextWatering);
  if (d < 0) return "overdue";
  if (d === 0) return "dry";
  if (d <= 2) return "warning";
  return "healthy";
}

let nextId = 0;

export const usePlantStore = create((set, get) => ({
  plants: [],
  isLoading: true,

  loadFromDisk: () => {
    try {
      const plants = loadPlants();
      const updated = plants.map((p) => ({
        ...p,
        lastWatered: p.lastWatered || p.createdAt, // repair old plants missing this field
        healthStatus: computeHealthStatus(p.nextWatering),
      }));
      set({ plants: updated });
    } catch (e) {
      console.error("Failed to load plants:", e);
      set({ plants: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addPlant: (data) => {
    const now = new Date().toISOString();
    const weather = getWeather();
    const adjustedInterval = adjustWateringInterval(data.wateringIntervalDays, weather);
    const plant = {
      id: `local-${Date.now()}-${nextId++}`,
      ...data,
      wateringIntervalDays: data.wateringIntervalDays,
      lastWatered: now,
      nextWatering: computeNextWatering(adjustedInterval, now),
      adjustedInterval,
      healthStatus: "healthy",
      createdAt: now,
      synced: false,
    };
    const plants = [...get().plants, plant];
    const saved = persistPlants(plants);
    set({ plants });
    if (!saved && data.photoUri) {
      // Photo likely caused quota error — plant is in memory but not on disk
      console.warn("Plant saved in memory only — storage may be full (photo too large?)");
    }
    return plant;
  },

  updatePlant: (id, data) => {
    const plants = get().plants.map((p) =>
      p.id === id ? { ...p, ...data, synced: false } : p
    );
    persistPlants(plants);
    set({ plants });
  },

  removePlant: (id) => {
    const plants = get().plants.filter((p) => p.id !== id);
    persistPlants(plants);
    set({ plants });
  },

  waterPlant: (id) => {
    const plant = get().plants.find((p) => p.id === id);
    if (!plant) return "notfound";

    // 48-hour cooldown — prevent over-watering
    const now = Date.now();
    if (plant.lastWatered) {
      const lastTime = new Date(plant.lastWatered).getTime();
      if (now - lastTime < WATERING_COOLDOWN_MS) {
        return "cooldown";
      }
    }

    const nowISO = new Date().toISOString();
    const weather = getWeather();
    const adjustedInterval = adjustWateringInterval(plant.wateringIntervalDays, weather);
    const nextWatering = computeNextWatering(adjustedInterval, nowISO);

    const plants = get().plants.map((p) =>
      p.id !== id ? p : {
        ...p,
        lastWatered: nowISO,
        nextWatering,
        adjustedInterval,
        healthStatus: "healthy",
        synced: false,
      }
    );
    persistPlants(plants);
    set({ plants });
    return "ok";
  },

  markSynced: (id) => {
    const plants = get().plants.map((p) =>
      p.id === id ? { ...p, synced: true } : p
    );
    persistPlants(plants);
    set({ plants });
  },

  getPlant: (id) => get().plants.find((p) => p.id === id),

  getPlantsByRoom: (room) => get().plants.filter((p) => p.room === room),

  getPlantsNeedingWater: () =>
    get().plants.filter((p) => p.healthStatus === "dry" || p.healthStatus === "overdue"),
}));
