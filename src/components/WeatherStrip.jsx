import { useWeather } from "@/hooks/useWeather";
import { useSettingsStore } from "@/stores/settingsStore";
import WeatherIcon from "@/components/WeatherIcon";

function toFahrenheit(celsius) {
  return Math.round(celsius * 9 / 5 + 32);
}

export function WeatherStrip() {
  const { weather, isLoading, error, refresh } = useWeather();
  const useCelsius = useSettingsStore((s) => s.useCelsius);

  if (error) {
    return (
      <button
        onClick={refresh}
        className="w-full px-4 py-3 bg-gray-50/60 backdrop-blur-sm border border-gray-200/40 rounded-2xl text-[13px] font-medium text-text-tertiary hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Weather unavailable -- tap to retry
      </button>
    );
  }

  if (isLoading || !weather) {
    return (
      <div className="p-4 bg-white/40 rounded-2xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl shadow-card-sm flex items-center gap-3">
      <WeatherIcon condition={weather.condition} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-title-md text-text-primary font-semibold tracking-tight">{useCelsius ? weather.temp_c : toFahrenheit(weather.temp_c)}&deg;{useCelsius ? "C" : "F"}</span>
          <span className="text-[13px] text-text-tertiary truncate">{weather.condition}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[13px] font-medium text-text-tertiary tabular-nums">{weather.humidity}%</span>
        {weather.is_rainy && (
          <span className="text-[12px] font-semibold text-blue-600 bg-blue-100/80 px-3 py-1 rounded-full">
            Skip
          </span>
        )}
      </div>
    </div>
  );
}
