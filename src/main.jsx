import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePlantStore } from "@/stores/plantStore";
import { useSettingsStore } from "@/stores/settingsStore";
import "./index.css";

// Hydrate stores from localStorage ONCE at boot — before any component renders
usePlantStore.getState().loadFromDisk();
useSettingsStore.getState().loadSettings();

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
