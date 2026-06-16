import { useRef } from "react";
import { usePlants } from "@/hooks/usePlants";
import { useSettingsStore } from "@/stores/settingsStore";
import { PLANTS_STORAGE_KEY } from "@/stores/plantStore";
import { SETTINGS_STORAGE_KEY } from "@/stores/settingsStore";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { CountUp } from "@/components/CountUp";

export default function Profile() {
  const { plants, thirstyPlants, healthyPlants, removePlant } = usePlants();
  const settings = useSettingsStore();
  const importRef = useRef(null);

  const rooms = [...new Set(plants.map((p) => p.room))];

  const handleRemoveAll = () => {
    if (confirm("Remove all plants? This cannot be undone.")) {
      plants.forEach((p) => removePlant(p.id));
    }
  };

  const handleExport = () => {
    try {
      const plantsRaw = localStorage.getItem(PLANTS_STORAGE_KEY);
      const settingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const data = {
        plants: plantsRaw ? JSON.parse(plantsRaw) : [],
        settings: settingsRaw ? JSON.parse(settingsRaw) : {},
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planty-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result;
        if (!raw || typeof raw !== "string") throw new Error("Empty file");
        const data = JSON.parse(raw);

        // Validate structure before overwriting
        const hasPlants = data.plants && (Array.isArray(data.plants) || typeof data.plants === "string");
        const hasSettings = data.settings && typeof data.settings === "object";

        if (!hasPlants && !hasSettings) throw new Error("No valid plant or settings data found");

        if (!confirm("This will replace all current data. Continue?")) return;

        if (hasPlants) {
          const plantsStr = Array.isArray(data.plants) ? JSON.stringify(data.plants) : data.plants;
          localStorage.setItem(PLANTS_STORAGE_KEY, plantsStr);
        }
        if (hasSettings) {
          const settingsStr = typeof data.settings === "string" ? data.settings : JSON.stringify(data.settings);
          localStorage.setItem(SETTINGS_STORAGE_KEY, settingsStr);
        }
        window.location.reload();
      } catch (e) {
        alert("Invalid backup file: " + e.message);
      }
    };
    reader.onerror = () => {
      alert("Could not read file. Please try again.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full animate-page-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-display-lg text-text-primary">Profile</h1>
        <p className="text-body-md text-text-tertiary mt-1">
          Garden stats & settings
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        {/* Garden stats */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-4">🌿 Garden</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-sage-50 rounded-xl text-center border border-sage-200/30">
              <div className="text-display-xl text-sage-600 font-bold"><CountUp end={plants.length} /></div>
              <div className="text-label-sm text-sage-500 mt-1 flex items-center justify-center gap-1">🪴 Total</div>
            </div>
            <div className="p-4 bg-soil-50 rounded-xl text-center border border-soil-200/30">
              <div className="text-display-xl text-soil-600 font-bold"><CountUp end={healthyPlants.length} /></div>
              <div className="text-label-sm text-soil-500 mt-1 flex items-center justify-center gap-1">💚 Healthy</div>
            </div>
            <div className="p-4 bg-clay-50 rounded-xl text-center border border-clay-200/30">
              <div className="text-display-xl text-clay-600 font-bold"><CountUp end={thirstyPlants.length} /></div>
              <div className="text-label-sm text-clay-500 mt-1 flex items-center justify-center gap-1">💧 Need water</div>
            </div>
            <div className="p-4 bg-sky-50 rounded-xl text-center border border-sky-200/30">
              <div className="text-display-xl text-sky-600 font-bold"><CountUp end={rooms.length} /></div>
              <div className="text-label-sm text-sky-500 mt-1 flex items-center justify-center gap-1">🏠 Rooms</div>
            </div>
          </div>
        </GlassCard>

        {/* Settings */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">⚙️ Settings</h3>

          <div className="divide-y divide-cream-200/50">
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-body-md text-text-secondary">🌙 Dark mode</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={settings.toggleDarkMode}
                className="toggle-switch"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-body-md text-text-secondary">🔔 Notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={settings.toggleNotifications}
                className="toggle-switch"
              />
            </label>

            <div className="flex items-center justify-between py-3">
              <span className="text-body-md text-text-secondary">🌡️ Temperature</span>
              <button
                onClick={settings.toggleTemperatureUnit}
                className="text-label-md font-semibold text-sage-600 bg-sage-100 px-3 py-1.5 rounded-full hover:bg-sage-200 transition-colors"
              >
                {settings.useCelsius ? "°C" : "°F"}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-body-md text-text-secondary">⏰ Reminder hour</span>
              <select
                value={settings.wateringReminderHour}
                onChange={(e) => settings.setWateringReminderHour(Number(e.target.value))}
                className="bg-cream-200 border border-cream-400 rounded-lg px-3 py-1.5 text-body-md text-text-primary focus:outline-none focus:border-sage-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Import / Export */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">💾 Data</h3>
          <div className="flex gap-3">
            <Button
              label="Export backup"
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="flex-1"
            />
            <input
              type="file"
              accept=".json"
              ref={importRef}
              onChange={handleImport}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />
            <Button
              label="Import backup"
              variant="secondary"
              size="sm"
              onClick={() => importRef.current?.click()}
              className="flex-1"
            />
          </div>
          <p className="text-label-sm text-text-tertiary mt-2">
            Export your plant data as JSON, or restore from a backup.
          </p>
        </GlassCard>

        {/* About */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">📱 About</h3>
          <p className="text-body-md text-text-secondary mb-3">
            Planty v3.0 — smart plant care, beautifully designed. Weather-aware watering, plant diagnosis, and zero server costs.
          </p>
          <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
            <span>🪴 v3.0.0</span>
            <span>·</span>
            <a
              href="https://github.com/iamvishalsehgal/Planty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage-600 hover:underline"
            >
              GitHub →
            </a>
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-clay-600 mb-2">⚠️ Danger zone</h3>
          <Button
            label="Remove all plants"
            variant="destructive"
            size="md"
            onClick={handleRemoveAll}
            className="w-full"
          />
        </GlassCard>
      </div>
    </div>
  );
}
