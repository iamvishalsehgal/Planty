import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await api.getWeather();
      setWeather(data);
    } catch (err) {
      setError(err.message || "Could not load weather");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, isLoading, error, refresh: fetchWeather };
}
