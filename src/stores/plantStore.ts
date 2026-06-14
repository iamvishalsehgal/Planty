import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

// ── Core Plant type (local mirror of API) ──

export interface Plant {
  id: string;
  name: string;
  species: string;
  room: string;
  photoUri?: string;
  wateringIntervalDays: number;
  lastWatered: string; // ISO date
  nextWatering: string; // ISO date
  healthStatus: "healthy" | "warning" | "dry" | "overdue";
  createdAt: string;
  synced: boolean; // true when persisted to server
}

export type PlantCreate = Omit<Plant, "id" | "createdAt" | "synced" | "healthStatus" | "nextWatering" | "lastWatered">;

// ── MMKV Storage ──

const storage = new MMKV({ id: "planty-plants" });

const persistPlants = (plants: Plant[]) => {
  storage.set("plants", JSON.stringify(plants));
};

const loadPlants = (): Plant[] => {
  const raw = storage.getString("plants");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Plant[];
  } catch {
    return [];
  }
};

// ── Store ──

interface PlantStore {
  plants: Plant[];
  isLoading: boolean;

  // Actions
  loadFromDisk: () => void;
  addPlant: (data: PlantCreate) => Plant;
  updatePlant: (id: string, data: Partial<Plant>) => void;
  removePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  markSynced: (id: string) => void;
  getPlant: (id: string) => Plant | undefined;
  getPlantsByRoom: (room: string) => Plant[];
  getPlantsNeedingWater: () => Plant[];
}

function computeNextWatering(intervalDays: number, fromDate?: string): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString();
}

function computeHealthStatus(nextWatering: string): Plant["healthStatus"] {
  const now = new Date();
  const next = new Date(nextWatering);
  const daysUntil = Math.ceil((next.getTime() - now.getTime()) / 86400000);

  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "dry";
  if (daysUntil <= 2) return "warning";
  return "healthy";
}

let nextId = 0;

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  isLoading: true,

  loadFromDisk: () => {
    const plants = loadPlants();
    // Recompute health statuses on load
    const updated = plants.map((p) => ({
      ...p,
      healthStatus: computeHealthStatus(p.nextWatering),
    }));
    set({ plants: updated, isLoading: false });
  },

  addPlant: (data) => {
    const now = new Date().toISOString();
    const plant: Plant = {
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
        healthStatus: "healthy" as const,
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
