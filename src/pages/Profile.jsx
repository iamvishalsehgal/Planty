import { usePlants } from "@/hooks/usePlants";
import { useSettingsStore } from "@/stores/settingsStore";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";

export default function Profile() {
  const { plants, thirstyPlants, healthyPlants, removePlant } = usePlants();
  const settings = useSettingsStore();

  const rooms = [...new Set(plants.map((p) => p.room))];

  const handleRemoveAll = () => {
    if (confirm("Remove all plants? This cannot be undone.")) {
      plants.forEach((p) => removePlant(p.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-display-lg text-text-primary">Profile</h1>
        <p className="text-body-md text-text-tertiary mt-1">
          Garden stats & settings
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 space-y-4">
        {/* Garden stats */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">🌿 Garden</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-sage-100 rounded-md text-center">
              <div className="text-display-md text-sage-700">{plants.length}</div>
              <div className="text-label-sm text-sage-600">Total</div>
            </div>
            <div className="p-3 bg-soil-100 rounded-md text-center">
              <div className="text-display-md text-soil-700">{healthyPlants.length}</div>
              <div className="text-label-sm text-soil-600">Healthy</div>
            </div>
            <div className="p-3 bg-clay-100 rounded-md text-center">
              <div className="text-display-md text-clay-700">{thirstyPlants.length}</div>
              <div className="text-label-sm text-clay-600">Need water</div>
            </div>
            <div className="p-3 bg-sky-100 rounded-md text-center">
              <div className="text-display-md text-sky-700">{rooms.length}</div>
              <div className="text-label-sm text-sky-600">Rooms</div>
            </div>
          </div>
        </GlassCard>

        {/* Settings */}
        <GlassCard variant="md">
          <h3 className="text-title-sm text-text-primary mb-3">⚙️ Settings</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-body-md text-text-secondary">Dark mode</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={settings.toggleDarkMode}
                className="w-10 h-6 rounded-full bg-cream-400 checked:bg-sage-500 appearance-none cursor-pointer relative before:absolute before:inset-0.5 before:rounded-full before:bg-white before:w-5 before:h-5 before:transition-transform checked:before:translate-x-4"
              />
            </label>

            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-body-md text-text-secondary">Notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={settings.toggleNotifications}
                className="w-10 h-6 rounded-full bg-cream-400 checked:bg-sage-500 appearance-none cursor-pointer relative before:absolute before:inset-0.5 before:rounded-full before:bg-white before:w-5 before:h-5 before:transition-transform checked:before:translate-x-4"
              />
            </label>

            <div className="flex items-center justify-between py-1">
              <span className="text-body-md text-text-secondary">Temperature</span>
              <button
                onClick={settings.toggleTemperatureUnit}
                className="text-label-md font-medium text-sage-600 bg-sage-100 px-3 py-1 rounded-md hover:bg-sage-200 transition-colors"
              >
                {settings.useCelsius ? "°C" : "°F"}
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-body-md text-text-secondary">Reminder hour</span>
              <select
                value={settings.wateringReminderHour}
                onChange={(e) => settings.setWateringReminderHour(Number(e.target.value))}
                className="bg-cream-200 border border-cream-400 rounded-md px-3 py-1.5 text-body-md text-text-primary"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}:00</option>
                ))}
              </select>
            </div>
          </div>
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
