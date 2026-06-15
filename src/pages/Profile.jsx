import { useRef } from "react";
import { usePlants } from "@/hooks/usePlants";
import { useSettingsStore } from "@/stores/settingsStore";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

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
    const data = {
      plants: localStorage.getItem("planty-plants"),
      settings: localStorage.getItem("planty-settings"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planty-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.plants) localStorage.setItem("planty-plants", data.plants);
        if (data.settings) localStorage.setItem("planty-settings", data.settings);
        window.location.reload();
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full">
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
              <div className="text-display-xl text-sage-600 font-bold">{plants.length}</div>
              <div className="text-label-sm text-sage-500 mt-1 flex items-center justify-center gap-1">🪴 Total</div>
            </div>
            <div className="p-4 bg-soil-50 rounded-xl text-center border border-soil-200/30">
              <div className="text-display-xl text-soil-600 font-bold">{healthyPlants.length}</div>
              <div className="text-label-sm text-soil-500 mt-1 flex items-center justify-center gap-1">💚 Healthy</div>
            </div>
            <div className="p-4 bg-clay-50 rounded-xl text-center border border-clay-200/30">
              <div className="text-display-xl text-clay-600 font-bold">{thirstyPlants.length}</div>
              <div className="text-label-sm text-clay-500 mt-1 flex items-center justify-center gap-1">💧 Need water</div>
            </div>
            <div className="p-4 bg-sky-50 rounded-xl text-center border border-sky-200/30">
              <div className="text-display-xl text-sky-600 font-bold">{rooms.length}</div>
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
              className="hidden"
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
          <h3 className="text-title-sm text-text-primary mb-2">📱 About</h3>
          <p className="text-body-md text-text-secondary">
            Planty v3.0 — Smart plant care web app. Keep your plants thriving with watering schedules, AI diagnosis, and weather-aware reminders.
          </p>
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
