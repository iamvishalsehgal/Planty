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
  const temp = weather.temp_c;

  return (
    <div className="px-4 py-3 bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 rounded-lg shadow-glass-sm flex items-center gap-3">
      <span className="text-2xl">{emoji}</span>
      <div>
        <span className="text-title-md text-text-primary">{temp}°C</span>
        <span className="text-body-sm text-text-tertiary ml-2">{weather.condition}</span>
      </div>
      <span className="text-body-sm text-text-tertiary ml-auto">💧 {weather.humidity}%</span>
      {weather.is_rainy && (
        <span className="text-label-sm text-sky-600 bg-sky-100 px-2 py-0.5 rounded-xs">
          Skip watering
        </span>
      )}
    </div>
  );
}
