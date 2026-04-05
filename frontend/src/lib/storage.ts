import { Plant, CareEvent, UserSettings, WeatherData } from '../types';
import { createInitialLearningState } from './rlAgent';

const STORAGE_KEYS = {
  PLANTS: 'plantcare_plants',
  SETTINGS: 'plantcare_settings',
  WEATHER_CACHE: 'plantcare_weather'
};

export function loadPlants(): Plant[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLANTS);
    if (!data) return [];

    const plants = JSON.parse(data);
    return plants.map((p: Plant) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      lastWatered: p.lastWatered ? new Date(p.lastWatered) : null,
      lastFertilized: p.lastFertilized ? new Date(p.lastFertilized) : null,
      history: p.history.map((e: CareEvent) => ({
        ...e,
        scheduledDate: new Date(e.scheduledDate),
        completedDate: e.completedDate ? new Date(e.completedDate) : null
      }))
    }));
  } catch {
    return [];
  }
}

export function savePlants(plants: Plant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
  } catch (e) {
    console.error('Failed to save plants:', e);
  }
}

export function loadSettings(): UserSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}

  return {
    location: null,
    manualTemperature: null,
    useAutoWeather: true,
    notifications: true,
    darkMode: false
  };
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function createPlant(name: string, emoji: string, wateringInterval: number): Plant {
  return {
    id: crypto.randomUUID(),
    name,
    emoji,
    createdAt: new Date(),
    lastWatered: null,
    lastFertilized: null,
    wateringInterval,
    fertilizingInterval: 30, // Default monthly
    history: [],
    learningState: createInitialLearningState()
  };
}

export function cacheWeather(weather: WeatherData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify({
      ...weather,
      timestamp: Date.now()
    }));
  } catch {}
}

export function getCachedWeather(): WeatherData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
    if (!data) return null;

    const cached = JSON.parse(data);
    // Cache valid for 30 minutes
    if (Date.now() - cached.timestamp > 30 * 60 * 1000) {
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

export function exportData(plants: Plant[], settings: UserSettings): string {
  return JSON.stringify({ plants, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export function generateICS(events: CareEvent[], plants: Plant[]): string {
  const plantMap = new Map(plants.map(p => [p.id, p]));

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PlantCare AI//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  events.forEach(event => {
    const plant = plantMap.get(event.plantId);
    if (!plant) return;

    const date = new Date(event.scheduledDate);
    const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(date.getTime() + 30 * 60 * 1000);
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    ics += `BEGIN:VEVENT
UID:${event.id}@plantcare
DTSTART:${dateStr}
DTEND:${endDateStr}
SUMMARY:${plant.emoji} ${event.type === 'water' ? 'Water' : 'Fertilize'} ${plant.name}
DESCRIPTION:Bottom watering - ${event.type === 'water' ? 'Water' : 'Fertilize'} your ${plant.name}
STATUS:${event.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}
END:VEVENT
`;
  });

  ics += 'END:VCALENDAR';
  return ics;
}
