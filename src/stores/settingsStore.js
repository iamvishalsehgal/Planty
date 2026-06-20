import { create } from "zustand";

export const SETTINGS_STORAGE_KEY = "planty-settings";

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const persistSettings = (partial) => {
  try {
    const existing = loadFromStorage();
    const merged = { ...existing, ...partial };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to save settings:", e.message);
  }
};

export const useSettingsStore = create((set, get) => ({
  notificationsEnabled: true,
  wateringReminderHour: 8,
  useCelsius: true,
  toggleNotifications: () => {
    const next = !get().notificationsEnabled;
    set({ notificationsEnabled: next });
    persistSettings({ notificationsEnabled: next });
  },

  setWateringReminderHour: (hour) => {
    set({ wateringReminderHour: hour });
    persistSettings({ wateringReminderHour: hour });
  },

  toggleTemperatureUnit: () => {
    const next = !get().useCelsius;
    set({ useCelsius: next });
    persistSettings({ useCelsius: next });
  },

  loadSettings: () => {
    const saved = loadFromStorage();
    set(saved);
  },
}));
