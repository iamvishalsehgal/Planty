import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "planty-settings" });

interface SettingsStore {
  darkMode: boolean;
  notificationsEnabled: boolean;
  wateringReminderHour: number; // 0-23
  useCelsius: boolean;
  hasOnboarded: boolean;

  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  setWateringReminderHour: (hour: number) => void;
  toggleTemperatureUnit: () => void;
  completeOnboarding: () => void;
  loadSettings: () => void;
}

const loadFromStorage = (): Partial<SettingsStore> => {
  try {
    const raw = storage.getString("settings");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const persistSettings = (settings: Partial<SettingsStore>) => {
  storage.set("settings", JSON.stringify(settings));
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  darkMode: false,
  notificationsEnabled: true,
  wateringReminderHour: 8, // 8 AM default
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
