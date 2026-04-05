import { SeasonalConfig, WeatherData } from '../types';

// Determine season based on date and hemisphere
export function getSeason(date: Date = new Date(), isNorthern: boolean = true): SeasonalConfig['season'] {
  const month = date.getMonth();

  if (isNorthern) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  } else {
    if (month >= 2 && month <= 4) return 'fall';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }
}

// Calculate watering multiplier based on temperature and season
export function getSeasonalConfig(temperature: number, date: Date = new Date()): SeasonalConfig {
  const season = getSeason(date);

  // Base multipliers by season
  const seasonMultipliers = {
    spring: { water: 1.0, fertilize: 1.2 },
    summer: { water: 1.4, fertilize: 1.0 },
    fall: { water: 0.8, fertilize: 0.5 },
    winter: { water: 0.6, fertilize: 0.2 }
  };

  // Temperature adjustment (-10°C to 40°C range)
  // Higher temp = more frequent watering (lower interval multiplier)
  let tempMultiplier = 1.0;
  if (temperature > 30) {
    tempMultiplier = 0.7; // Hot: water more often
  } else if (temperature > 25) {
    tempMultiplier = 0.85;
  } else if (temperature > 20) {
    tempMultiplier = 1.0;
  } else if (temperature > 15) {
    tempMultiplier = 1.15;
  } else if (temperature > 10) {
    tempMultiplier = 1.3;
  } else {
    tempMultiplier = 1.5; // Cold: water less often
  }

  // Combined multiplier (inverse for watering - lower = more frequent)
  const wateringMultiplier = seasonMultipliers[season].water * tempMultiplier;
  const fertilizingMultiplier = seasonMultipliers[season].fertilize;

  return {
    season,
    temperatureC: temperature,
    humidity: 50, // Default
    wateringMultiplier: Math.max(0.5, Math.min(2.0, wateringMultiplier)),
    fertilizingMultiplier: Math.max(0.1, Math.min(1.5, fertilizingMultiplier))
  };
}

// Fetch weather from Open-Meteo (free, no API key needed)
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current;

    const weatherCodes: Record<number, { desc: string; icon: string }> = {
      0: { desc: 'Clear', icon: '☀️' },
      1: { desc: 'Mainly clear', icon: '🌤️' },
      2: { desc: 'Partly cloudy', icon: '⛅' },
      3: { desc: 'Overcast', icon: '☁️' },
      45: { desc: 'Foggy', icon: '🌫️' },
      48: { desc: 'Icy fog', icon: '🌫️' },
      51: { desc: 'Light drizzle', icon: '🌧️' },
      53: { desc: 'Drizzle', icon: '🌧️' },
      55: { desc: 'Heavy drizzle', icon: '🌧️' },
      61: { desc: 'Light rain', icon: '🌧️' },
      63: { desc: 'Rain', icon: '🌧️' },
      65: { desc: 'Heavy rain', icon: '⛈️' },
      80: { desc: 'Showers', icon: '🌦️' },
      95: { desc: 'Thunderstorm', icon: '⛈️' }
    };

    const weather = weatherCodes[current.weather_code] || { desc: 'Unknown', icon: '🌡️' };

    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      description: weather.desc,
      icon: weather.icon,
      location: `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`
    };
  } catch {
    return null;
  }
}

// Get user's location
export function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => resolve(null),
      { timeout: 10000 }
    );
  });
}

// Get season emoji
export function getSeasonEmoji(season: SeasonalConfig['season']): string {
  const emojis = {
    spring: '🌸',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️'
  };
  return emojis[season];
}

// Format temperature
export function formatTemp(temp: number): string {
  return `${temp}°C`;
}
