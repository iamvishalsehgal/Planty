import { useState, useEffect, useCallback } from 'react';
import { Plant, CareEvent, UserSettings, WeatherData, SeasonalConfig } from './types';
import { loadPlants, savePlants, loadSettings, saveSettings, createPlant, generateICS } from './lib/storage';
import { fetchWeather, getUserLocation, getSeasonalConfig, getSeasonEmoji } from './lib/weather';
import {
  selectAction,
  updateQTable,
  calculateNextInterval,
  explainScheduleChange,
  getLearningProgress
} from './lib/rlAgent';
import {
  syncPlantsToBackend,
  getAnalyticsSummary,
  getTrends,
  runPipeline,
  getPipelineRuns,
  checkBackendHealth
} from './lib/api';
import type { AnalyticsSummary, WeeklyEvent } from './lib/api';

type Tab = 'plants' | 'calendar' | 'settings' | 'analytics';

const PLANT_EMOJIS = ['🌿', '🌱', '🪴', '🌵', '🌸', '🌺', '🌻', '🌷', '🍀', '🌳', '🌴', '🎋'];

export default function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [seasonalConfig, setSeasonalConfig] = useState<SeasonalConfig>(getSeasonalConfig(20));
  const [activeTab, setActiveTab] = useState<Tab>('plants');
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadedPlants = loadPlants();
    setPlants(loadedPlants);
    setLoading(false);
  }, []);

  // Save plants when changed
  useEffect(() => {
    if (!loading) {
      savePlants(plants);
    }
  }, [plants, loading]);

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Sync plants to backend whenever plants change (debounced 2s)
  useEffect(() => {
    if (loading || plants.length === 0) return;
    const timer = setTimeout(() => {
      syncPlantsToBackend(plants).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [plants, loading]);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  // Fetch weather
  useEffect(() => {
    async function loadWeather() {
      try {
        let location = settings.location;

        if (!location && settings.useAutoWeather) {
          location = await getUserLocation();
          if (location) {
            setSettings(prev => ({ ...prev, location }));
          }
        }

        if (location) {
          const weatherData = await fetchWeather(location.lat, location.lon);
          if (weatherData) {
            setWeather(weatherData);
            setSeasonalConfig(getSeasonalConfig(weatherData.temperature));
          }
        } else if (settings.manualTemperature !== null) {
          setSeasonalConfig(getSeasonalConfig(settings.manualTemperature));
        }
      } catch (e) {
        console.error('Failed to fetch weather:', e);
      }
    }

    loadWeather();
    const interval = setInterval(loadWeather, 30 * 60 * 1000); // Refresh every 30 min
    return () => clearInterval(interval);
  }, [settings.location, settings.useAutoWeather, settings.manualTemperature]);

  // Add a new plant
  const handleAddPlant = useCallback((name: string, emoji: string, interval: number) => {
    const newPlant = createPlant(name, emoji, interval);
    setPlants(prev => [...prev, newPlant]);
    setShowAddPlant(false);
  }, []);

  // Delete a plant
  const handleDeletePlant = useCallback((plantId: string) => {
    setPlants(prev => prev.filter(p => p.id !== plantId));
    setSelectedPlant(null);
  }, []);

  // Mark plant as watered
  const handleWater = useCallback((plantId: string, feedback?: 'happy' | 'thirsty' | 'overwatered') => {
    setPlants(prev => prev.map(plant => {
      if (plant.id !== plantId) return plant;

      const now = new Date();
      const event: CareEvent = {
        id: crypto.randomUUID(),
        plantId,
        type: 'water',
        scheduledDate: now,
        completedDate: now,
        status: 'completed',
        feedback
      };

      // Update learning state
      const newLearningState = updateQTable(plant, event, seasonalConfig);

      // Get new action and calculate next interval
      const { action } = selectAction(plant, seasonalConfig);
      const newInterval = calculateNextInterval(
        plant.wateringInterval,
        action,
        seasonalConfig,
        'water'
      );

      return {
        ...plant,
        lastWatered: now,
        wateringInterval: newInterval,
        history: [...plant.history, event],
        learningState: {
          ...newLearningState,
          lastAction: action
        }
      };
    }));
  }, [seasonalConfig]);

  // Skip watering
  const handleSkip = useCallback((plantId: string) => {
    setPlants(prev => prev.map(plant => {
      if (plant.id !== plantId) return plant;

      const now = new Date();
      const event: CareEvent = {
        id: crypto.randomUUID(),
        plantId,
        type: 'water',
        scheduledDate: now,
        completedDate: null,
        status: 'skipped'
      };

      const newLearningState = updateQTable(plant, event, seasonalConfig);

      return {
        ...plant,
        history: [...plant.history, event],
        learningState: newLearningState
      };
    }));
  }, [seasonalConfig]);

  // Fertilize plant
  const handleFertilize = useCallback((plantId: string) => {
    setPlants(prev => prev.map(plant => {
      if (plant.id !== plantId) return plant;

      const now = new Date();
      const event: CareEvent = {
        id: crypto.randomUUID(),
        plantId,
        type: 'fertilize',
        scheduledDate: now,
        completedDate: now,
        status: 'completed'
      };

      // Adjust fertilizing interval based on season
      const newFertInterval = Math.round(30 * seasonalConfig.fertilizingMultiplier);

      return {
        ...plant,
        lastFertilized: now,
        fertilizingInterval: Math.max(14, Math.min(90, newFertInterval)),
        history: [...plant.history, event]
      };
    }));
  }, [seasonalConfig]);

  // Export to calendar
  const handleExportCalendar = useCallback(() => {
    const allEvents = plants.flatMap(p => p.history);
    const ics = generateICS(allEvents, plants);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plant-care.ics';
    a.click();
    URL.revokeObjectURL(url);
  }, [plants]);

  // Calculate upcoming events
  const getUpcomingEvents = useCallback(() => {
    const events: Array<{ plant: Plant; type: 'water' | 'fertilize'; dueDate: Date; overdue: boolean }> = [];
    const now = new Date();

    plants.forEach(plant => {
      // Next watering
      const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : plant.createdAt;
      const nextWater = new Date(lastWatered);
      nextWater.setDate(nextWater.getDate() + plant.wateringInterval);

      events.push({
        plant,
        type: 'water',
        dueDate: nextWater,
        overdue: nextWater < now
      });

      // Next fertilizing
      const lastFert = plant.lastFertilized ? new Date(plant.lastFertilized) : plant.createdAt;
      const nextFert = new Date(lastFert);
      nextFert.setDate(nextFert.getDate() + plant.fertilizingInterval);

      events.push({
        plant,
        type: 'fertilize',
        dueDate: nextFert,
        overdue: nextFert < now
      });
    });

    return events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [plants]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <p className="text-emerald-700 font-medium">Loading your garden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <h1 className="text-lg font-bold text-emerald-800">PlantCare AI</h1>
            </div>

            {/* Weather badge */}
            {weather ? (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                <span>{weather.icon}</span>
                <span className="text-sm font-medium text-emerald-700">{weather.temperature}°C</span>
                <span className="text-xs text-emerald-600">{getSeasonEmoji(seasonalConfig.season)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                <span>{getSeasonEmoji(seasonalConfig.season)}</span>
                <span className="text-sm text-amber-700">{seasonalConfig.season}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'plants' && (
          <PlantsTab
            plants={plants}
            seasonalConfig={seasonalConfig}
            onAddPlant={() => setShowAddPlant(true)}
            onSelectPlant={setSelectedPlant}
            onWater={handleWater}
            onSkip={handleSkip}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            events={getUpcomingEvents()}
            onWater={handleWater}
            onSkip={handleSkip}
            onFertilize={handleFertilize}
            onExport={handleExportCalendar}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            weather={weather}
            seasonalConfig={seasonalConfig}
            onUpdateSettings={setSettings}
            plants={plants}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab backendOnline={backendOnline} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-200 z-50">
        <div className="max-w-lg mx-auto flex">
          <TabButton
            active={activeTab === 'plants'}
            onClick={() => setActiveTab('plants')}
            icon="🪴"
            label="Plants"
          />
          <TabButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon="📅"
            label="Schedule"
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon="📊"
            label="Analytics"
          />
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon="⚙️"
            label="Settings"
          />
        </div>
      </nav>

      {/* Add Plant Modal */}
      {showAddPlant && (
        <AddPlantModal
          onAdd={handleAddPlant}
          onClose={() => setShowAddPlant(false)}
          emojis={PLANT_EMOJIS}
        />
      )}

      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          seasonalConfig={seasonalConfig}
          onClose={() => setSelectedPlant(null)}
          onWater={(feedback) => {
            handleWater(selectedPlant.id, feedback);
            setSelectedPlant(null);
          }}
          onFertilize={() => {
            handleFertilize(selectedPlant.id);
            setSelectedPlant(null);
          }}
          onDelete={() => handleDeletePlant(selectedPlant.id)}
        />
      )}
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
        active
          ? 'text-emerald-600 bg-emerald-50'
          : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// Plants Tab
function PlantsTab({
  plants,
  seasonalConfig,
  onAddPlant,
  onSelectPlant,
  onWater,
  onSkip
}: {
  plants: Plant[];
  seasonalConfig: SeasonalConfig;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
  onWater: (id: string, feedback?: 'happy' | 'thirsty' | 'overwatered') => void;
  onSkip: (id: string) => void;
}) {
  if (plants.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-emerald-800 mb-2">No plants yet</h2>
        <p className="text-emerald-600 mb-6">Add your first plant to start tracking</p>
        <button
          onClick={onAddPlant}
          className="bg-emerald-600 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-700 transition-colors"
        >
          + Add Plant
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-800">Your Plants</h2>
        <button
          onClick={onAddPlant}
          className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Season Info Banner */}
      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getSeasonEmoji(seasonalConfig.season)}</span>
          <div>
            <p className="font-medium text-emerald-800 capitalize">{seasonalConfig.season} Mode</p>
            <p className="text-sm text-emerald-600">
              {seasonalConfig.wateringMultiplier < 1
                ? 'Watering less frequently'
                : seasonalConfig.wateringMultiplier > 1.2
                  ? 'Watering more frequently'
                  : 'Normal watering schedule'}
            </p>
          </div>
        </div>
      </div>

      {/* Plant Cards */}
      <div className="space-y-3">
        {plants.map(plant => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onClick={() => onSelectPlant(plant)}
            onWater={() => onWater(plant.id)}
            onSkip={() => onSkip(plant.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Plant Card
function PlantCard({
  plant,
  onClick,
  onWater,
  onSkip
}: {
  plant: Plant;
  onClick: () => void;
  onWater: () => void;
  onSkip: () => void;
}) {
  const now = new Date();
  const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : plant.createdAt;
  const daysSinceWater = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilWater = plant.wateringInterval - daysSinceWater;
  const isOverdue = daysUntilWater < 0;
  const isDueToday = daysUntilWater === 0;
  const isDueSoon = daysUntilWater === 1;

  const progress = getLearningProgress(plant);

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
        isOverdue
          ? 'border-red-300 bg-red-50/50'
          : isDueToday
            ? 'border-amber-300 bg-amber-50/50'
            : isDueSoon
              ? 'border-yellow-200'
              : 'border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        <button onClick={onClick} className="text-4xl hover:scale-110 transition-transform">
          {plant.emoji}
        </button>

        <div className="flex-1 min-w-0">
          <button onClick={onClick} className="text-left w-full">
            <h3 className="font-semibold text-gray-900 truncate">{plant.name}</h3>
            <p className="text-sm text-gray-500">
              {isOverdue
                ? `${Math.abs(daysUntilWater)} days overdue!`
                : isDueToday
                  ? 'Water today!'
                  : `Water in ${daysUntilWater} days`
              }
            </p>
          </button>

          {/* Learning Progress */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{progress.level}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          {(isOverdue || isDueToday || isDueSoon) && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onWater(); }}
                className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                title="Water now"
              >
                💧
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSkip(); }}
                className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                title="Skip"
              >
                ⏭️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Calendar Tab
function CalendarTab({
  events,
  onWater,
  onSkip,
  onFertilize,
  onExport
}: {
  events: Array<{ plant: Plant; type: 'water' | 'fertilize'; dueDate: Date; overdue: boolean }>;
  onWater: (id: string) => void;
  onSkip: (id: string) => void;
  onFertilize: (id: string) => void;
  onExport: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.dueDate);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString();

    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-800">Upcoming Care</h2>
        <button
          onClick={onExport}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          📤 Export
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-500">No upcoming events</p>
          <p className="text-sm text-gray-400">Add plants to see their schedule</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).slice(0, 14).map(([dateStr, dayEvents]) => (
            <div key={dateStr}>
              <h3 className={`text-sm font-medium mb-2 ${
                new Date(dateStr) < today ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatDate(dateStr)}
              </h3>

              <div className="space-y-2">
                {dayEvents.map((event, idx) => (
                  <div
                    key={`${event.plant.id}-${event.type}-${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      event.overdue
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-white border border-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{event.plant.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.plant.name}</p>
                      <p className="text-sm text-gray-500">
                        {event.type === 'water' ? '💧 Water' : '🌱 Fertilize'}
                      </p>
                    </div>

                    <button
                      onClick={() => event.type === 'water'
                        ? onWater(event.plant.id)
                        : onFertilize(event.plant.id)
                      }
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                    >
                      Done
                    </button>

                    {event.type === 'water' && (
                      <button
                        onClick={() => onSkip(event.plant.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Tab
function SettingsTab({
  settings,
  weather,
  seasonalConfig,
  onUpdateSettings,
  plants
}: {
  settings: UserSettings;
  weather: WeatherData | null;
  seasonalConfig: SeasonalConfig;
  onUpdateSettings: (settings: UserSettings) => void;
  plants: Plant[];
}) {
  const [manualTemp, setManualTemp] = useState(settings.manualTemperature?.toString() || '');

  const handleManualTempSave = () => {
    const temp = parseInt(manualTemp);
    if (!isNaN(temp) && temp >= -20 && temp <= 50) {
      onUpdateSettings({ ...settings, manualTemperature: temp, useAutoWeather: false });
    }
  };

  const totalEvents = plants.reduce((sum, p) => sum + p.history.length, 0);
  const avgStability = plants.length > 0
    ? plants.reduce((sum, p) => sum + p.learningState.stabilityScore, 0) / plants.length
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-emerald-800">Settings</h2>

      {/* Weather Settings */}
      <div className="bg-white rounded-xl p-4 space-y-4">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          🌡️ Temperature & Season
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Auto-detect weather</span>
          <button
            onClick={() => onUpdateSettings({
              ...settings,
              useAutoWeather: !settings.useAutoWeather
            })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.useAutoWeather ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.useAutoWeather ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {!settings.useAutoWeather && (
          <div className="flex gap-2">
            <input
              type="number"
              value={manualTemp}
              onChange={(e) => setManualTemp(e.target.value)}
              placeholder="Temperature °C"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              min="-20"
              max="50"
            />
            <button
              onClick={handleManualTempSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
            >
              Save
            </button>
          </div>
        )}

        {weather && settings.useAutoWeather && (
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <p className="font-medium">{weather.temperature}°C - {weather.description}</p>
                <p className="text-sm text-gray-500">{weather.location}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p><strong>Current season:</strong> {seasonalConfig.season} {getSeasonEmoji(seasonalConfig.season)}</p>
          <p><strong>Watering adjustment:</strong> {((1 - seasonalConfig.wateringMultiplier) * -100).toFixed(0)}%</p>
          <p><strong>Fertilizing adjustment:</strong> {((1 - seasonalConfig.fertilizingMultiplier) * -100).toFixed(0)}%</p>
        </div>
      </div>

      {/* AI Learning Stats */}
      <div className="bg-white rounded-xl p-4 space-y-4">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          🧠 AI Learning
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{plants.length}</p>
            <p className="text-xs text-gray-500">Plants</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalEvents}</p>
            <p className="text-xs text-gray-500">Events Logged</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{(avgStability * 100).toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Avg Stability</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {plants.reduce((sum, p) => sum + Object.keys(p.learningState.qTable).length, 0)}
            </p>
            <p className="text-xs text-gray-500">States Learned</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          The AI learns from your watering patterns and adjusts schedules based on season and temperature.
          The more you use the app, the smarter it gets!
        </p>
      </div>

      {/* Bottom Watering Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
          💧 Bottom Watering Mode
        </h3>
        <p className="text-sm text-blue-700">
          All schedules assume bottom watering with longer hydration times.
          Minimum 2-day cooldown between waterings is enforced.
        </p>
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-gray-400 py-4">
        <p>PlantCare AI v1.0</p>
        <p>Using reinforcement learning to optimize your plant care</p>
      </div>
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({ backendOnline }: { backendOnline: boolean }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<{ weeklyEvents: WeeklyEvent[]; healthTrend: any[] } | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    const [s, t, runs] = await Promise.all([
      getAnalyticsSummary(),
      getTrends(),
      getPipelineRuns()
    ]);
    if (s) setSummary(s);
    if (t) setTrends(t);
    if (runs) setPipelineRuns(runs);
    if (!s && !t) setLoadError(true);
  }, []);

  useEffect(() => {
    if (backendOnline) loadData();
  }, [backendOnline, loadData]);

  const handleRunPipeline = async () => {
    setRunning(true);
    await runPipeline();
    await loadData();
    setRunning(false);
  };

  if (!backendOnline) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-emerald-800">Analytics</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-3xl mb-2">🔌</div>
          <h3 className="font-semibold text-amber-800 mb-1">Backend Not Running</h3>
          <p className="text-sm text-amber-700 mb-3">Start the data engineering backend to view analytics:</p>
          <div className="bg-amber-100 rounded-lg p-3 font-mono text-xs text-amber-900 space-y-1">
            <div>cd backend</div>
            <div>npm install</div>
            <div>npm run dev</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-emerald-100">
          <h3 className="font-medium text-emerald-800 mb-2">What's included in the backend?</h3>
          <ul className="text-sm text-emerald-700 space-y-1.5">
            <li>🏗️ <strong>Ingestion Pipeline</strong> — stages raw plant & event data</li>
            <li>⚙️ <strong>Transform Pipeline</strong> — enriches events with computed metrics</li>
            <li>📊 <strong>Aggregation Pipeline</strong> — computes plant health scores</li>
            <li>🗄️ <strong>SQLite Data Warehouse</strong> — structured data storage</li>
            <li>📡 <strong>REST API</strong> — analytics, trends, export endpoints</li>
          </ul>
        </div>
      </div>
    );
  }

  // Find max for bar chart scaling
  const maxWeekly = trends?.weeklyEvents
    ? Math.max(...trends.weeklyEvents.map(w => w.total), 1)
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-800">Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">● Live</span>
          <button
            onClick={() => window.open('http://localhost:3001/api/analytics/export', '_blank')}
            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
            <div className="text-2xl font-bold text-emerald-700">{summary.totalPlants}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Plants</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
            <div className="text-2xl font-bold text-emerald-700">{summary.totalEvents}</div>
            <div className="text-xs text-gray-500 mt-0.5">Care Events</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{summary.avgHealthScore}</div>
            <div className="text-xs text-gray-500 mt-0.5">Avg Health Score</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{summary.avgCompliance}%</div>
            <div className="text-xs text-gray-500 mt-0.5">Care Compliance</div>
          </div>
          {summary.overdueCount > 0 && (
            <div className="col-span-2 bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="text-2xl font-bold text-red-600">{summary.overdueCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Overdue Plants</div>
            </div>
          )}
          {summary.mostActivePlant && (
            <div className="col-span-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-sm font-semibold text-amber-800">Most Active (30d)</div>
              <div className="text-base font-bold text-amber-700 mt-0.5">{summary.mostActivePlant}</div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Events Bar Chart */}
      {trends && trends.weeklyEvents.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Care Events</h3>
          <div className="flex items-end gap-1 h-24">
            {trends.weeklyEvents.slice(-8).map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full bg-emerald-200 rounded-t-sm"
                    style={{ height: `${(w.completed / maxWeekly) * 80}px` }}
                    title={`Completed: ${w.completed}`}
                  />
                  <div
                    className="w-full bg-red-200 rounded-t-sm -mt-0.5"
                    style={{ height: `${(w.skipped / maxWeekly) * 80}px` }}
                    title={`Skipped: ${w.skipped}`}
                  />
                </div>
                <span className="text-xs text-gray-400 rotate-45 origin-left">{w.week.split('-W')[1]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-200 rounded-sm inline-block"></span><span className="text-xs text-gray-500">Completed</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-200 rounded-sm inline-block"></span><span className="text-xs text-gray-500">Skipped</span></div>
          </div>
        </div>
      )}

      {/* No data yet */}
      {loadError && (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">No analytics data yet. Add plants and log care events to see insights here.</p>
        </div>
      )}

      {/* Pipeline Controls */}
      <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">ETL Pipeline</h3>
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
        {summary?.lastPipelineRun && (
          <p className="text-xs text-gray-500">
            Last run: {new Date(summary.lastPipelineRun).toLocaleString()}
          </p>
        )}
      </div>

      {/* Pipeline Run History */}
      {pipelineRuns.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pipeline History</h3>
          <div className="space-y-2">
            {pipelineRuns.slice(0, 5).map((run: any) => (
              <div key={run.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-green-500' : run.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-gray-600">{run.pipeline_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{run.records_processed} records</span>
                  <span>{run.started_at ? new Date(run.started_at).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add Plant Modal
function AddPlantModal({
  onAdd,
  onClose,
  emojis
}: {
  onAdd: (name: string, emoji: string, interval: number) => void;
  onClose: () => void;
  emojis: string[];
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(emojis[0]);
  const [interval, setInterval] = useState(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), emoji, interval);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Plant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose an icon</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monstera"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Watering Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current watering interval (days)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              How often do you currently water this plant?
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2"
                max="21"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value))}
                className="flex-1 accent-emerald-600"
              />
              <span className="text-lg font-semibold text-emerald-600 w-16 text-center">
                {interval} days
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Plant
          </button>
        </form>
      </div>
    </div>
  );
}

// Plant Detail Modal
function PlantDetailModal({
  plant,
  seasonalConfig,
  onClose,
  onWater,
  onFertilize,
  onDelete
}: {
  plant: Plant;
  seasonalConfig: SeasonalConfig;
  onClose: () => void;
  onWater: (feedback?: 'happy' | 'thirsty' | 'overwatered') => void;
  onFertilize: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);

  const progress = getLearningProgress(plant);
  const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
  const lastFertilized = plant.lastFertilized ? new Date(plant.lastFertilized) : null;

  // Get explanation for current schedule
  const { action, isExploration } = selectAction(plant, seasonalConfig);
  const projectedInterval = calculateNextInterval(plant.wateringInterval, action, seasonalConfig, 'water');
  const explanation = explainScheduleChange(plant.wateringInterval, projectedInterval, seasonalConfig, isExploration);

  const recentHistory = plant.history.slice(-10).reverse();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{plant.emoji}</span>
            <h2 className="text-lg font-semibold">{plant.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium">💧 Water every</p>
              <p className="text-xl font-bold text-blue-700">{plant.wateringInterval} days</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium">🌱 Fertilize every</p>
              <p className="text-xl font-bold text-green-700">{plant.fertilizingInterval} days</p>
            </div>
          </div>

          {/* Last Care */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Last watered:</strong> {lastWatered ? lastWatered.toLocaleDateString() : 'Never'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Last fertilized:</strong> {lastFertilized ? lastFertilized.toLocaleDateString() : 'Never'}
            </p>
          </div>

          {/* AI Learning */}
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">🧠 AI Learning</span>
              <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                {progress.level}
              </span>
            </div>
            <div className="bg-purple-200 rounded-full h-2 mb-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-xs text-purple-600">{progress.nextMilestone}</p>
            <p className="text-xs text-purple-500 mt-2">{explanation}</p>
          </div>

          {/* Quick Actions */}
          {!feedbackMode ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFeedbackMode(true)}
                className="py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                💧 Water
              </button>
              <button
                onClick={onFertilize}
                className="py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                🌱 Fertilize
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-center text-gray-700">How does your plant look?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onWater('happy')}
                  className="py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
                >
                  😊 Happy
                </button>
                <button
                  onClick={() => onWater('thirsty')}
                  className="py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors"
                >
                  🥵 Thirsty
                </button>
                <button
                  onClick={() => onWater('overwatered')}
                  className="py-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                >
                  💦 Too wet
                </button>
              </div>
              <button
                onClick={() => setFeedbackMode(false)}
                className="w-full py-2 text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {/* History */}
          {recentHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent History</h3>
              <div className="space-y-1 max-h-32 overflow-auto">
                {recentHistory.map(event => (
                  <div key={event.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-gray-600">
                      {event.type === 'water' ? '💧' : '🌱'} {event.type}
                    </span>
                    <span className="text-gray-400">
                      {new Date(event.scheduledDate).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.status === 'completed' ? 'bg-green-100 text-green-700' :
                      event.status === 'skipped' ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-4 border-t border-gray-100">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-2 text-red-500 text-sm hover:text-red-600"
              >
                Delete plant
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
