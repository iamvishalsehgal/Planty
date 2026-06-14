"""Weather endpoint."""

from fastapi import APIRouter, Query, HTTPException

from models import WeatherResponse
from services.weather import get_weather

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather", response_model=WeatherResponse)
async def weather(
    lat: float = Query(52.3676, description="Latitude"),
    lon: float = Query(4.9041, description="Longitude"),
):
    """Get current weather for plant care decisions."""
    try:
        data = await get_weather(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather fetch failed: {str(e)}")
