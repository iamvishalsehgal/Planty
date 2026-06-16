import { useWeather } from "@/hooks/useWeather";
import WeatherIcon from "@/components/WeatherIcon";

export function WeatherStrip() {
  const { weather, isLoading, error, refresh } = useWeather();

  if (error) {
    return (
      <button
        onClick={refresh}
        className="w-full px-4 py-3 bg-soil-50/60 backdrop-blur-sm border border-soil-200/40 rounded-2xl text-[13px] font-medium text-text-tertiary hover:bg-soil-100 transition-colors flex items-center justify-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-soil-400" />
        Weather unavailable -- tap to retry
      </button>
    );
  }

  if (isLoading || !weather) {
    return (
      <div className="p-4 bg-cream-50/40 rounded-2xl animate-pulse">
        <div className="h-8 bg-cream-200 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-cream-50/60 backdrop-blur-xl border border-white/30 rounded-2xl shadow-card-sm flex items-center gap-3">
      <WeatherIcon condition={weather.condition} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-title-md text-text-primary font-semibold tracking-tight">{weather.temp_c}&deg;C</span>
          <span className="text-[13px] text-text-tertiary truncate">{weather.condition}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[13px] font-medium text-text-tertiary tabular-nums">{weather.humidity}%</span>
        {weather.is_rainy && (
          <span className="text-[12px] font-semibold text-sky-600 bg-sky-100/80 px-3 py-1 rounded-full">
            Skip
          </span>
        )}
      </div>
    </div>
  );
}
