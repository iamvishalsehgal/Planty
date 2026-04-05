from fastapi import APIRouter
from models import SyncEventsRequest
from pipelines import runner

router = APIRouter(prefix="/api/events")


@router.post("/sync")
def sync_events(body: SyncEventsRequest):
    events = [e.model_dump() for e in body.events]
    result = runner.run_pipeline(plants=[], events=events)
    return {"ok": True, "staged": result["events_staged"]}
