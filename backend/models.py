import re
from pydantic import BaseModel, field_validator
from typing import Optional

# ── XSS sanitization ────────────────────────────────────────────────
_SCRIPT_PATTERN = re.compile(r"<\s*script[\s/>]", re.IGNORECASE)
_HTML_TAG_PATTERN = re.compile(r"<[^>]*>")

def _sanitize_text(v: str) -> str:
    """Strip HTML tags and script injection attempts from user text."""
    if not v:
        return v
    # Remove script tags and their contents
    v = _SCRIPT_PATTERN.sub("", v)
    # Remove remaining HTML tags
    v = _HTML_TAG_PATTERN.sub("", v)
    return v.strip()


class PlantIn(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    interval: int
    lastWatered: Optional[str] = None
    isDead: Optional[bool] = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = _sanitize_text(v)
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 50:
            raise ValueError("name must be 50 characters or fewer")
        return v

    @field_validator("location")
    @classmethod
    def location_sanitize(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = _sanitize_text(v)
        if len(v) > 50:
            raise ValueError("location must be 50 characters or fewer")
        return v if v else None

    @field_validator("interval")
    @classmethod
    def interval_in_range(cls, v: int) -> int:
        if not (2 <= v <= 30):
            raise ValueError("interval must be between 2 and 30 days")
        return v

    @field_validator("id")
    @classmethod
    def id_sanitize(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("id must not be empty")
        if len(v) > 100:
            raise ValueError("id must be 100 characters or fewer")
        # Only allow alphanumeric, dash, underscore
        if not re.match(r'^[a-zA-Z0-9\-_]+$', v):
            raise ValueError("id must only contain letters, numbers, dashes, and underscores")
        return v


class EventIn(BaseModel):
    id: str
    plantId: str
    eventType: str
    scheduled: str
    completed: Optional[str] = None
    feedback: Optional[str] = None

    @field_validator("eventType")
    @classmethod
    def event_type_valid(cls, v: str) -> str:
        allowed = {"water", "fertilize", "repot", "prune", "note"}
        if v.lower() not in allowed:
            raise ValueError(f"eventType must be one of: {', '.join(sorted(allowed))}")
        return v.lower()

    @field_validator("feedback")
    @classmethod
    def feedback_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        allowed = {"happy", "sad", "overwatered"}
        if v.lower() not in allowed:
            return None  # Silently drop invalid feedback
        return v.lower()

    @field_validator("id", "plantId")
    @classmethod
    def ids_sanitize(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("id must not be empty")
        if len(v) > 200:
            raise ValueError("id must be 200 characters or fewer")
        return v


class SyncPlantsRequest(BaseModel):
    plants: list[PlantIn]


class SyncEventsRequest(BaseModel):
    events: list[EventIn]
