"""Weather service — fetches from Open-Meteo (free, no API key)."""

import httpx
from datetime import datetime

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

# Default: Amsterdam coordinates (user can configure later)
DEFAULT_LAT = 52.3676
DEFAULT_LON = 4.9041

WEATHER_CODES = {
    0: ("Clear sky", "☀️"),
    1: ("Mainly clear", "🌤️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Foggy", "🌫️"),
    48: ("Depositing rime fog", "🌫️"),
    51: ("Light drizzle", "🌦️"),
    53: ("Moderate drizzle", "🌦️"),
    55: ("Dense drizzle", "🌧️"),
    61: ("Slight rain", "🌦️"),
    63: ("Moderate rain", "🌧️"),
    65: ("Heavy rain", "🌧️"),
    71: ("Slight snow", "🌨️"),
    73: ("Moderate snow", "🌨️"),
    75: ("Heavy snow", "❄️"),
    80: ("Slight rain showers", "🌦️"),
    81: ("Moderate rain showers", "🌧️"),
    82: ("Violent rain showers", "⛈️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm with slight hail", "⛈️"),
    99: ("Thunderstorm with heavy hail", "⛈️"),
}

RAIN_CODES = {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99}


async def get_weather(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    """Fetch current weather from Open-Meteo."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "relative_humidity_2m", "weather_code"],
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(OPEN_METEO_URL, params=params)
        response.raise_for_status()
        data = response.json()

    current = data["current"]
    weather_code = current["weather_code"]
    condition, icon = WEATHER_CODES.get(weather_code, ("Unknown", "🌡️"))

    return {
        "temp_c": current["temperature_2m"],
        "humidity": current["relative_humidity_2m"],
        "condition": condition,
        "icon": icon,
        "is_rainy": weather_code in RAIN_CODES,
    }
