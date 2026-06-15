import { useWeather } from "@/hooks/useWeather";
import WeatherIcon from "@/components/WeatherIcon";

export function WeatherStrip() {
  const { weather, isLoading, error, refresh } = useWeather();

  if (error) {
    return (
      <button
        onClick={refresh}
        className="w-full px-4 py-2.5 bg-soil-50/80 border border-soil-200/50 rounded-2xl text-label-sm text-text-tertiary hover:bg-soil-100 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-sm">⚠️</span>
        <span>Weather unavailable — tap to retry</span>
      </button>
    );
  }

  if (isLoading || !weather) {
    return (
      <div className="p-4 bg-cream-50/50 rounded-2xl animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-2xl shadow-glass-sm flex items-center gap-3">
      <WeatherIcon condition={weather.condition} size={32} />
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
