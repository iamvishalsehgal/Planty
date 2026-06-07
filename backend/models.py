from pydantic import BaseModel, field_validator
from typing import Optional


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
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        if len(v) > 50:
            raise ValueError("name must be 50 characters or fewer")
        return v

    @field_validator("interval")
    @classmethod
    def interval_in_range(cls, v: int) -> int:
        if not (2 <= v <= 30):
            raise ValueError("interval must be between 2 and 30 days")
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


class SyncPlantsRequest(BaseModel):
    plants: list[PlantIn]


class SyncEventsRequest(BaseModel):
    events: list[EventIn]
