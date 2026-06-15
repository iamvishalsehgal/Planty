import { useState, useEffect, useCallback } from "react";
import { fetchWeather } from "@/lib/weather";

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchWeather();
      setWeather(data);
    } catch (err) {
      setError(err.message || "Could not load weather");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { weather, isLoading, error, refresh };
}
