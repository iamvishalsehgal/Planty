import { useWeather } from "@/hooks/useWeather";

export function WeatherStrip() {
  const { weather, isLoading } = useWeather();

  if (isLoading || !weather) {
    return (
      <div className="px-4 py-3 bg-cream-50/50 rounded-lg animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-32" />
      </div>
    );
  }

  const emoji = weather.is_rainy ? "🌧️" : weather.condition?.toLowerCase().includes("cloud") ? "⛅" : "☀️";

  return (
    <div className="px-4 py-3 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-lg shadow-glass-sm flex items-center gap-3">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-title-md text-text-primary">{weather.temp_c}°C</span>
          <span className="text-body-sm text-text-tertiary">{weather.condition}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-body-sm text-text-tertiary">💧 {weather.humidity}%</span>
        {weather.is_rainy && (
          <span className="text-label-sm text-sky-600 bg-sky-100 px-2.5 py-1 rounded-full font-medium">
            Skip watering
          </span>
        )}
      </div>
    </div>
  );
}
