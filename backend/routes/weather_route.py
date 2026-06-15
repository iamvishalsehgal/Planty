"""Weather endpoint."""

import logging

from fastapi import APIRouter, Query, HTTPException

from config import config
from models import WeatherResponse
from services.weather import get_weather

logger = logging.getLogger("planty.weather")
router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def weather(
    lat: float = Query(config.WEATHER_DEFAULT_LAT, description="Latitude"),
    lon: float = Query(config.WEATHER_DEFAULT_LON, description="Longitude"),
):
    """Get current weather for plant care decisions."""
    try:
        data = await get_weather(lat, lon)
        return data
    except Exception as e:
        logger.exception("Weather fetch failed for lat=%s lon=%s", lat, lon)
        raise HTTPException(status_code=502, detail=f"Weather service unavailable: {str(e)}")
