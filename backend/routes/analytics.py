"""Analytics routes — thin HTTP layer delegating to analytics_store."""

from fastapi import APIRouter, HTTPException
from db import get_db
from pipelines import runner
from stores.analytics_store import get_summary, get_trends, export_all, get_pipeline_runs

router = APIRouter(prefix="/api/analytics")


@router.get("/summary")
def summary():
    try:
        with get_db() as conn:
            return get_summary(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
def trends():
    try:
        with get_db() as conn:
            return get_trends(conn)
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
            return export_all(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pipeline-runs")
def pipeline_runs():
    try:
        with get_db() as conn:
            return get_pipeline_runs(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
