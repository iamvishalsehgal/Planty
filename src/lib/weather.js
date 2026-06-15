// Free weather via Open-Meteo — no API key, no server, no cost
// Caches in localStorage for 30 min

const CACHE_KEY = "planty-weather";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function weatherCodeToCondition(code) {
  if (code <= 3) return "Clear";
  if (code <= 48) return "Cloudy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function isRainyCode(code) {
  // 51-55 drizzle, 61-67 rain, 80-82 rain showers (excludes 71-77 snow)
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
}

/** Sync read of cached weather — null if stale or missing */
export function getWeather() {
  return getCachedWeather();
}

function getCachedWeather() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._ts > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function cacheWeather(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
  } catch { /* noop */ }
}

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 52.3676, lon: 4.9041 }); // Amsterdam fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 52.3676, lon: 4.9041 }),
      { timeout: 5000 }
    );
  });
}

export async function fetchWeather() {
  // Return cached if fresh
  const cached = getCachedWeather();
  if (cached) return cached;

  const { lat, lon } = await getPosition();

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,rain`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");

  const json = await res.json();
  const current = json.current;

  const data = {
    temp_c: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    condition: weatherCodeToCondition(current.weather_code),
    is_rainy: isRainyCode(current.weather_code),
  };

  cacheWeather(data);
  return data;
}
