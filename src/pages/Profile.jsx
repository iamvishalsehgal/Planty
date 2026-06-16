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
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-display-lg text-text-primary tracking-tight leading-none">Profile</h1>
        <p className="text-[15px] text-text-tertiary mt-1.5">
          Garden stats &amp; settings
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {/* Garden stats */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-4">Garden</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatBox value={plants.length} label="Total" color="sage" />
            <StatBox value={healthyPlants.length} label="Healthy" color="soil" />
            <StatBox value={thirstyPlants.length} label="Need water" color="clay" />
            <StatBox value={rooms.length} label="Rooms" color="sky" />
          </div>
        </GlassCard>

        {/* Settings */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">Settings</h3>
          <div className="divide-y divide-cream-200/50">
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-[15px] text-text-secondary">Dark mode</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={settings.toggleDarkMode}
                className="toggle-switch"
              />
            </label>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-[15px] text-text-secondary">Notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={settings.toggleNotifications}
                className="toggle-switch"
              />
            </label>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-text-secondary">Temperature</span>
              <button
                onClick={settings.toggleTemperatureUnit}
                className="text-[14px] font-semibold text-sage-600 bg-sage-100 px-3 py-1.5 rounded-full hover:bg-sage-200 transition-colors"
              >
                {settings.useCelsius ? "°C" : "°F"}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-text-secondary">Reminder hour</span>
              <select
                value={settings.wateringReminderHour}
                onChange={(e) => settings.setWateringReminderHour(Number(e.target.value))}
                className="bg-cream-200 border border-cream-400 rounded-lg px-3 py-1.5 text-[15px] text-text-primary focus:outline-none focus:border-sage-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Data */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">Data</h3>
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
          <p className="text-[12px] text-text-tertiary mt-2">
            Export your plant data as JSON, or restore from a backup.
          </p>
        </GlassCard>

        {/* About */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">About</h3>
          <p className="text-[15px] text-text-secondary mb-3 leading-relaxed">
            Planty v3.0 -- smart plant care, beautifully designed. Weather-aware watering, plant diagnosis, and zero server costs.
          </p>
          <div className="flex items-center gap-2 text-[13px] text-text-tertiary">
            <span>v3.0.0</span>
            <span>&middot;</span>
            <a
              href="https://github.com/iamvishalsehgal/Planty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage-600 font-medium hover:underline"
            >
              GitHub &rarr;
            </a>
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-clay-600 mb-2">Danger zone</h3>
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

function StatBox({ value, label, color }) {
  const colorMap = {
    sage: { bg: "bg-sage-50", border: "border-sage-200/40", text: "text-sage-600", subtext: "text-sage-500" },
    soil: { bg: "bg-soil-50", border: "border-soil-200/40", text: "text-soil-600", subtext: "text-soil-500" },
    clay: { bg: "bg-clay-50", border: "border-clay-200/40", text: "text-clay-600", subtext: "text-clay-500" },
    sky: { bg: "bg-sky-50", border: "border-sky-200/40", text: "text-sky-600", subtext: "text-sky-500" },
  };
  const c = colorMap[color] || colorMap.sage;

  return (
    <div className={`p-4 ${c.bg} rounded-2xl text-center border ${c.border}`}>
      <div className={`text-display-xl ${c.text} font-extrabold tracking-tighter leading-none tabular-nums`}>
        <CountUp end={value} />
      </div>
      <div className={`text-[12px] font-semibold ${c.subtext} mt-1.5 tracking-wide uppercase`}>
        {label}
      </div>
    </div>
  );
}
