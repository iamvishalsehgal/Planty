import { create } from "zustand";

const STORAGE_KEY = "planty-settings";

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to save settings:", e.message);
  }
};

export const useSettingsStore = create((set, get) => ({
  darkMode: false,
  notificationsEnabled: true,
  wateringReminderHour: 8,
  useCelsius: true,
  hasOnboarded: false,

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    persistSettings({ darkMode: next });
  },

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

  completeOnboarding: () => {
    set({ hasOnboarded: true });
    persistSettings({ hasOnboarded: true });
  },

  loadSettings: () => {
    const saved = loadFromStorage();
    set(saved);
  },
}));
