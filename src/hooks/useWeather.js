import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWeather } from "@/lib/weather";

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      if (mounted.current) setIsLoading(true);
      const data = await fetchWeather();
      if (mounted.current) setWeather(data);
    } catch (err) {
      if (mounted.current) setError(err.message || "Could not load weather");
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { weather, isLoading, error, refresh };
}
