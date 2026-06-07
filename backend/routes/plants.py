from fastapi import APIRouter, HTTPException
from models import SyncPlantsRequest
from pipelines import runner
from db import get_db

router = APIRouter(prefix="/api/plants")


@router.post("/sync")
def sync_plants(body: SyncPlantsRequest):
    try:
        plants = [p.model_dump() for p in body.plants]
        result = runner.run_pipeline(plants=plants, events=[])
        return {"ok": True, "staged": result["plants_staged"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_plants():
    try:
        with get_db() as conn:
            plants = conn.execute("SELECT * FROM plants_raw").fetchall()
            out = []
            for p in plants:
                metrics = conn.execute("""
                    SELECT health_score, compliance_rate, avg_days_overdue
                    FROM plant_health_metrics
                    WHERE plant_id = ?
                    ORDER BY computed_at DESC
                    LIMIT 1
                """, (p["id"],)).fetchone()
                row = dict(p)
                row["metrics"] = dict(metrics) if metrics else None
                out.append(row)
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
