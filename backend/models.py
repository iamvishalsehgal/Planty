"""Pydantic v2 models for Planty API."""

from datetime import datetime
from typing import Optional, Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


# ── Plant ──

class PlantCreate(BaseModel):
    """Request to create a plant."""
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., min_length=1, max_length=100)
    room: str = Field(..., min_length=1, max_length=100)
    photo_url: Optional[str] = None
    watering_interval_days: int = Field(default=3, ge=1, le=30)

    @field_validator("name", "species", "room")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class PlantUpdate(BaseModel):
    """Partial update for a plant."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=100)
    room: Optional[str] = Field(None, min_length=1, max_length=100)
    photo_url: Optional[str] = None
    watering_interval_days: Optional[int] = Field(None, ge=1, le=30)


class PlantResponse(BaseModel):
    """Plant as returned by the API."""
    id: str
    name: str
    species: str
    room: str
    photo_url: Optional[str] = None
    watering_interval_days: int
    last_watered: str
    next_watering: str
    health_status: Literal["healthy", "warning", "dry", "overdue"]
    created_at: str


# ── Watering ──

class WateringCreate(BaseModel):
    """Log a watering event."""
    amount_ml: Optional[int] = Field(None, ge=0, le=10000)
    notes: Optional[str] = Field(None, max_length=500)


class WateringResponse(BaseModel):
    """Watering event as returned by the API."""
    id: str
    plant_id: str
    timestamp: str
    amount_ml: Optional[int] = None
    notes: Optional[str] = None


# ── Diagnosis ──

class DiagnosisRequest(BaseModel):
    """Request to diagnose a plant from a photo."""
    image: str = Field(..., description="Base64-encoded image data")

    @field_validator("image")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        if len(v) < 100:
            raise ValueError("Image data too short")
        # Strip data URL prefix if present
        if v.startswith("data:"):
            v = v.split(",", 1)[1]
        return v


class DiagnosisResponse(BaseModel):
    """Diagnosis result."""
    condition: str
    confidence: int = Field(ge=0, le=100)
    description: str
    treatment: str


# ── Weather ──

class WeatherResponse(BaseModel):
    """Current weather relevant to plant care."""
    temp_c: float
    humidity: int
    condition: str
    icon: str
    is_rainy: bool


# ── Health ──

class HealthResponse(BaseModel):
    """API health check."""
    status: Literal["healthy", "degraded"]
    database: Literal["connected", "disconnected"]
    request_count: int
    uptime_seconds: float
