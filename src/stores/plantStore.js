import { create } from "zustand";
import { getWeather } from "@/lib/weather";
import { adjustWateringInterval, daysUntil } from "@/lib/date";

export const PLANTS_STORAGE_KEY = "planty-plants";
export const PLANTS_BACKUP_KEY = "planty-plants-backup";
export const MEMORIAL_STORAGE_KEY = "planty-memorial";
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
  const raw = localStorage.getItem(PLANTS_STORAGE_KEY);
  if (!raw) return [];
  if (!raw.startsWith("[")) {
    try { localStorage.setItem(PLANTS_BACKUP_KEY, raw); } catch {}
    throw new Error("Corrupted plant data — backup saved. Check planty-plants-backup in localStorage.");
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    try { localStorage.setItem(PLANTS_BACKUP_KEY, raw); } catch {}
    throw new Error("Failed to parse plant data — backup saved. Check planty-plants-backup in localStorage.");
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
  memorial: [],
  isLoading: true,
  loadError: null,

  loadFromDisk: () => {
    try {
      const plants = loadPlants();
      const now = new Date().toISOString();
      const updated = plants.map((p) => ({
        ...p,
        lastWatered: p.lastWatered || p.createdAt || now,
        nextWatering: p.nextWatering || p.createdAt || now,
        createdAt: p.createdAt || p.lastWatered || now,
        get healthStatus() { return computeHealthStatus(this.nextWatering); },
      }));
      // Load memorial
      let memorial = [];
      try {
        const raw = localStorage.getItem(MEMORIAL_STORAGE_KEY);
        if (raw) memorial = JSON.parse(raw);
      } catch {}
      set({ plants: updated, memorial, loadError: null });
    } catch (e) {
      console.error("Failed to load plants:", e);
      set({ loadError: e.message || "Failed to load plant data" });
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
      get healthStatus() { return computeHealthStatus(this.nextWatering); },
      createdAt: now,
      synced: false,
    };
    const plants = [...get().plants, plant];
    const saved = persistPlants(plants);
    set({ plants });
    if (!saved) {
      // Quota exceeded — plant in memory only, will be lost on refresh
      console.warn("Plant saved in memory only — storage may be full");
    }
    return { plant, persisted: saved };
  },

  updatePlant: (id, data) => {
    const plants = get().plants.map((p) =>
      p.id === id ? { ...p, ...data, synced: false, get healthStatus() { return computeHealthStatus(this.nextWatering); } } : p
    );
    if (!persistPlants(plants)) console.warn("Failed to persist plant update");
    set({ plants });
  },

  removePlant: (id) => {
    const plant = get().plants.find((p) => p.id === id);
    const plants = get().plants.filter((p) => p.id !== id);
    if (!persistPlants(plants)) console.warn("Failed to persist plant removal");
    // Save to memorial
    if (plant) {
      const memorial = [...get().memorial, { ...plant, removedAt: new Date().toISOString() }];
      try { localStorage.setItem(MEMORIAL_STORAGE_KEY, JSON.stringify(memorial)); } catch {}
      set({ plants, memorial });
    } else {
      set({ plants });
    }
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
        get healthStatus() { return computeHealthStatus(this.nextWatering); },
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
