from fastapi import APIRouter, HTTPException
from db import get_db
from pipelines import runner

router = APIRouter(prefix="/api/analytics")


@router.get("/summary")
def summary():
    try:
        with get_db() as conn:
            total_plants = conn.execute("SELECT COUNT(*) FROM plants_raw").fetchone()[0]
            total_events = conn.execute("SELECT COUNT(*) FROM care_events").fetchone()[0]
            completed = conn.execute(
                "SELECT COUNT(*) FROM care_events WHERE completed IS NOT NULL"
            ).fetchone()[0]
            overdue = conn.execute(
                "SELECT COUNT(*) FROM care_events WHERE days_overdue > 1"
            ).fetchone()[0]
            avg_health = conn.execute(
                "SELECT AVG(h.health_score) FROM plant_health_metrics h "
                "INNER JOIN (SELECT plant_id, MAX(computed_at) AS latest FROM plant_health_metrics GROUP BY plant_id) m "
                "ON h.plant_id = m.plant_id AND h.computed_at = m.latest"
            ).fetchone()[0]

        return {
            "total_plants": total_plants,
            "total_events": total_events,
            "completed_events": completed,
            "overdue_events": overdue,
            "compliance_rate": round(completed / total_events, 4) if total_events else 0,
            "avg_health_score": round(avg_health, 4) if avg_health else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
def trends():
    try:
        with get_db() as conn:
            rows = conn.execute("""
                SELECT DATE(scheduled) AS day, COUNT(*) AS events,
                       SUM(CASE WHEN completed IS NOT NULL THEN 1 ELSE 0 END) AS completed
                FROM care_events
                GROUP BY day
                ORDER BY day DESC
                LIMIT 28
            """).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-pipeline")
def trigger_pipeline():
    try:
        result = runner.run_pipeline()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
def export():
    try:
        with get_db() as conn:
            plants = [dict(r) for r in conn.execute("SELECT * FROM plants_raw").fetchall()]
            events = [dict(r) for r in conn.execute("SELECT * FROM care_events").fetchall()]
            metrics = [dict(r) for r in conn.execute("SELECT * FROM plant_health_metrics").fetchall()]
        return {"plants": plants, "events": events, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pipeline-runs")
def pipeline_runs():
    try:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT 50"
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
