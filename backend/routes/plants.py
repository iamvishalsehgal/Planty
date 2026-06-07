"""Plant routes — thin HTTP layer delegating to pipeline + plant_store."""

from fastapi import APIRouter, HTTPException
from models import SyncPlantsRequest
from pipelines import runner
from stores.plant_store import list_plants
from db import get_db

router = APIRouter(prefix="/api/plants")


@router.post("/sync")
def sync_plants(body: SyncPlantsRequest):
    try:
        plants_data = [p.model_dump() for p in body.plants]
        result = runner.run_pipeline(plants=plants_data, events=[])
        return {"ok": True, "staged": result["plants_staged"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_plants():
    try:
        with get_db() as conn:
            return list_plants(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
