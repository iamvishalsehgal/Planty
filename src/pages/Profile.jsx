import { useRef } from "react";
import { usePlants } from "@/hooks/usePlants";
import { useSettingsStore } from "@/stores/settingsStore";
import { PLANTS_STORAGE_KEY, MEMORIAL_STORAGE_KEY, usePlantStore } from "@/stores/plantStore";
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

  const migrateLegacyData = (data) => {
    // Detect legacy format: has storeVersion, or plants have 'interval' instead of 'wateringIntervalDays'
    const isLegacy = data.storeVersion !== undefined ||
      (data.plants && data.plants[0] && data.plants[0].interval !== undefined);

    if (!isLegacy) return data;

    const plants = (data.plants || []).map((p) => {
      // Find last watering from history
      let lastWatered = p.created || new Date().toISOString();
      if (data.history) {
        const plantHistory = data.history
          .filter((h) => h.plantId === p.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (plantHistory.length > 0) lastWatered = plantHistory[0].date;
      }

      const intervalDays = p.interval || 7;
      const nextWatering = new Date(lastWatered);
      nextWatering.setDate(nextWatering.getDate() + intervalDays);

      return {
        id: `import-${p.id}`,
        name: p.name || "Unknown plant",
        species: p.normalized || "Unknown",
        room: p.location || "Living Room",
        photoUri: p.photoCount > 0 ? null : null,
        wateringIntervalDays: intervalDays,
        lastWatered,
        nextWatering: nextWatering.toISOString(),
        adjustedInterval: intervalDays,
        createdAt: p.created || new Date().toISOString(),
        synced: false,
      };
    });

    // Migrate dead plants to memorial
    const memorial = (data.deadPlants || []).map((dp) => ({
      id: `memorial-${dp.id}`,
      name: dp.name || "Unknown",
      species: dp.normalized || "Unknown",
      room: dp.location || "",
      removedAt: dp.deathDate || new Date().toISOString(),
    }));

    return { plants, memorial };
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

        // Check for valid data in either format
        const hasPlants = data.plants && Array.isArray(data.plants);
        const hasSettings = data.settings && typeof data.settings === "object";
        const isLegacy = data.storeVersion !== undefined;
        if (!hasPlants && !hasSettings && !isLegacy) throw new Error("No valid plant or settings data found");
        if (!confirm("This will replace all current data. Continue?")) return;

        // Migrate legacy data
        const migrated = migrateLegacyData(data);
        const plants = migrated.plants;
        const memorial = migrated.memorial || [];

        if (plants && plants.length > 0) {
          localStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
        }
        if (memorial.length > 0) {
          localStorage.setItem(MEMORIAL_STORAGE_KEY, JSON.stringify(memorial));
        }
        if (hasSettings) {
          const settingsStr = typeof data.settings === "string" ? data.settings : JSON.stringify(data.settings);
          localStorage.setItem(SETTINGS_STORAGE_KEY, settingsStr);
        }

        // Store reload + navigate to home (defer nav until React re-renders)
        usePlantStore.getState().loadFromDisk();
        useSettingsStore.getState().loadSettings();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.location.hash = "#/";
          });
        });
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
        <h1 className="text-display-lg text-gray-800 tracking-tight leading-none">Profile</h1>
        <p className="text-[15px] text-gray-400 mt-1.5">
          Garden stats &amp; settings
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-8 space-y-4">
        {/* Garden stats */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-gray-800 mb-4">Garden</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatBox value={plants.length} label="Total" color="sage" />
            <StatBox value={healthyPlants.length} label="Healthy" color="soil" />
            <StatBox value={thirstyPlants.length} label="Need water" color="clay" />
            <StatBox value={rooms.length} label="Rooms" color="sky" />
          </div>
        </GlassCard>

        {/* Settings */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-gray-800 mb-3">Settings</h3>
          <div className="divide-y divide-gray-200">
            <label className="flex items-center justify-between py-3 cursor-pointer">
              <span className="text-[15px] text-gray-600">Notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={settings.toggleNotifications}
                className="toggle-switch"
              />
            </label>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-gray-600">Temperature</span>
              <button
                onClick={settings.toggleTemperatureUnit}
                className="text-[14px] font-semibold text-green-600 bg-green-100 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
              >
                {settings.useCelsius ? "°C" : "°F"}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] text-gray-600">Reminder hour</span>
              <select
                value={settings.wateringReminderHour}
                onChange={(e) => settings.setWateringReminderHour(Number(e.target.value))}
                className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-[15px] text-gray-800 focus:outline-none focus:border-green-400"
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
          <h3 className="text-title-sm text-gray-800 mb-3">Data</h3>
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
          <p className="text-[12px] text-gray-400 mt-2">
            Export your plant data as JSON, or restore from a backup.
          </p>
        </GlassCard>

        {/* About */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-gray-800 mb-3">About</h3>
          <p className="text-[15px] text-gray-600 mb-3 leading-relaxed">
            Planty v3.0 -- smart plant care, beautifully designed. Weather-aware watering, plant diagnosis, and zero server costs.
          </p>
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <span>v3.0.0</span>
            <span>&middot;</span>
            <a
              href="https://github.com/iamvishalsehgal/Planty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-medium hover:underline"
            >
              GitHub &rarr;
            </a>
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-blue-600 mb-2">Danger zone</h3>
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
    sage: { bg: "bg-green-50", border: "border-green-200/40", text: "text-green-600", subtext: "text-green-500" },
    soil: { bg: "bg-gray-50", border: "border-gray-200/40", text: "text-gray-600", subtext: "text-gray-500" },
    clay: { bg: "bg-blue-50", border: "border-blue-200/40", text: "text-blue-600", subtext: "text-blue-500" },
    sky: { bg: "bg-blue-50", border: "border-blue-200/40", text: "text-blue-600", subtext: "text-blue-500" },
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
