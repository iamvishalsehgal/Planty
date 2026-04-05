from pydantic import BaseModel
from typing import Optional


class PlantIn(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    interval: int
    lastWatered: Optional[str] = None
    isDead: Optional[bool] = False


class EventIn(BaseModel):
    id: str
    plantId: str
    eventType: str
    scheduled: str
    completed: Optional[str] = None
    feedback: Optional[str] = None


class SyncPlantsRequest(BaseModel):
    plants: list[PlantIn]


class SyncEventsRequest(BaseModel):
    events: list[EventIn]
