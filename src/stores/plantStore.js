import { create } from "zustand";

// ── Core Plant type ──

const STORAGE_KEY = "planty-plants";

const persistPlants = (plants) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
};

const loadPlants = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// ── Store ──

function computeNextWatering(intervalDays, fromDate) {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString();
}

function computeHealthStatus(nextWatering) {
  const now = new Date();
  const next = new Date(nextWatering);
  const daysUntil = Math.ceil((next.getTime() - now.getTime()) / 86400000);

  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "dry";
  if (daysUntil <= 2) return "warning";
  return "healthy";
}

let nextId = 0;

export const usePlantStore = create((set, get) => ({
  plants: [],
  isLoading: true,

  loadFromDisk: () => {
    const plants = loadPlants();
    const updated = plants.map((p) => ({
      ...p,
      healthStatus: computeHealthStatus(p.nextWatering),
    }));
    set({ plants: updated, isLoading: false });
  },

  addPlant: (data) => {
    const now = new Date().toISOString();
    const plant = {
      id: `local-${Date.now()}-${nextId++}`,
      ...data,
      lastWatered: now,
      nextWatering: computeNextWatering(data.wateringIntervalDays),
      healthStatus: "healthy",
      createdAt: now,
      synced: false,
    };
    const plants = [...get().plants, plant];
    persistPlants(plants);
    set({ plants });
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
    const plants = get().plants.map((p) => {
      if (p.id !== id) return p;
      const now = new Date().toISOString();
      const nextWatering = computeNextWatering(p.wateringIntervalDays, now);
      return {
        ...p,
        lastWatered: now,
        nextWatering,
        healthStatus: "healthy",
        synced: false,
      };
    });
    persistPlants(plants);
    set({ plants });
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
