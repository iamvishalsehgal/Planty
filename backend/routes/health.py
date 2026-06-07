"""Health check and monitoring endpoint."""

import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from db import get_db

router = APIRouter(prefix="/api", tags=["health"])

# Startup timestamp
STARTED_AT = datetime.now(timezone.utc)
REQUEST_COUNT = 0


def increment_request_count():
    global REQUEST_COUNT
    REQUEST_COUNT += 1


@router.get("/health")
def health():
    """Returns system health: status, version, uptime, DB size, request count."""
    db_size_kb = 0
    try:
        db_path = os.environ.get("PLANTY_DB_PATH")
        if db_path and os.path.exists(db_path):
            db_size_kb = round(os.path.getsize(db_path) / 1024, 1)
        elif os.path.exists("planty.db"):
            db_size_kb = round(os.path.getsize("planty.db") / 1024, 1)
    except OSError:
        pass

    uptime_seconds = round((datetime.now(timezone.utc) - STARTED_AT).total_seconds())

    return {
        "status": "ok",
        "version": "2.8",
        "uptime_seconds": uptime_seconds,
        "request_count": REQUEST_COUNT,
        "db_size_kb": db_size_kb,
        "started_at": STARTED_AT.isoformat(),
    }


@router.get("/health/metrics")
def pipeline_metrics():
    """Pipeline performance: last 5 runs with durations, error rate."""
    from db import get_db, get_conn
    try:
        with get_db() as conn:
            recent = conn.execute("""
                SELECT started_at, finished_at, status
                FROM pipeline_runs
                ORDER BY started_at DESC LIMIT 20
            """).fetchall()
        runs = []
        for r in recent:
            duration_s = None
            if r["finished_at"]:
                from datetime import datetime
                try:
                    s = datetime.fromisoformat(r["started_at"].replace("Z", "+00:00"))
                    f = datetime.fromisoformat(r["finished_at"].replace("Z", "+00:00"))
                    duration_s = round((f - s).total_seconds(), 2)
                except Exception:
                    pass
            runs.append({
                "started_at": r["started_at"],
                "status": r["status"],
                "duration_s": duration_s,
            })
        total = len(runs)
        errors = sum(1 for r in runs if r["status"] == "error")
        return {
            "recent_runs": runs[:5],
            "total_recent": total,
            "error_count": errors,
            "error_rate": round(errors / total, 4) if total else 0,
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/health/consistency")
def consistency_check():
    """Data integrity: row counts across all tables."""
    from db import get_db
    try:
        with get_db() as conn:
            plants = conn.execute("SELECT COUNT(*) FROM plants_raw").fetchone()[0]
            events_raw = conn.execute("SELECT COUNT(*) FROM events_raw").fetchone()[0]
            care = conn.execute("SELECT COUNT(*) FROM care_events").fetchone()[0]
            metrics = conn.execute("SELECT COUNT(*) FROM plant_health_metrics").fetchone()[0]
            pipeline = conn.execute("SELECT COUNT(*) FROM pipeline_runs").fetchone()[0]
        return {
            "plants_raw": plants,
            "events_raw": events_raw,
            "care_events": care,
            "health_metrics": metrics,
            "pipeline_runs": pipeline,
            "events_unprocessed": max(0, events_raw - care),
        }
    except Exception as e:
        return {"error": str(e)}
