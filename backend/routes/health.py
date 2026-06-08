"""Health check and monitoring endpoint."""

import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
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

    # Disk usage warning for Render free tier (ephemeral storage)
    disk_warning = None
    try:
        import shutil
        usage = shutil.disk_usage(".")
        free_mb = usage.free / (1024 * 1024)
        if free_mb < 100:
            disk_warning = f"Low disk space: {free_mb:.0f}MB free"
    except Exception:
        pass

    return {
        "status": "ok",
        "version": "4.0",
        "uptime_seconds": uptime_seconds,
        "request_count": REQUEST_COUNT,
        "db_size_kb": db_size_kb,
        "started_at": STARTED_AT.isoformat(),
        "disk_warning": disk_warning,
    }


@router.get("/health/metrics")
def pipeline_metrics():
    """Pipeline performance: last 5 runs with durations, error rate."""
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
    try:
        with get_db() as conn:
            plants = conn.execute("SELECT COUNT(*) FROM plants_raw").fetchone()[0]
            events_raw = conn.execute("SELECT COUNT(*) FROM events_raw").fetchone()[0]
            care = conn.execute("SELECT COUNT(*) FROM care_events").fetchone()[0]
            metrics = conn.execute("SELECT COUNT(*) FROM plant_health_metrics").fetchone()[0]
            pipeline = conn.execute("SELECT COUNT(*) FROM pipeline_runs").fetchone()[0]
            errors = conn.execute("SELECT COUNT(*) FROM error_log").fetchone()[0]
        return {
            "plants_raw": plants,
            "events_raw": events_raw,
            "care_events": care,
            "health_metrics": metrics,
            "pipeline_runs": pipeline,
            "error_log": errors,
            "events_unprocessed": max(0, events_raw - care),
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/health/errors")
def recent_errors(limit: int = 50):
    """Return recent errors from the error_log table."""
    from error_tracker import get_recent_errors
    try:
        return get_recent_errors(limit)
    except Exception as e:
        return {"error": str(e)}


@router.get("/health/pipeline-health")
def pipeline_health():
    """Pipeline health: last run, consecutive failures, avg duration, is_healthy flag."""
    from error_tracker import get_pipeline_health
    try:
        return get_pipeline_health()
    except Exception as e:
        return {"is_healthy": False, "error": str(e)}


@router.get("/health/performance")
def performance():
    """Request performance: avg, p95, max latency per endpoint."""
    from error_tracker import get_performance_stats
    try:
        return get_performance_stats()
    except Exception as e:
        return {"error": str(e)}


# ── Client error reporting ────────────────────────────────────────

class ClientError(BaseModel):
    message: str
    stack: Optional[str] = None
    url: Optional[str] = None
    timestamp: Optional[str] = None


@router.post("/health/client-error")
def report_client_error(error: ClientError):
    """Accept client-side error reports for monitoring."""
    from error_tracker import log_error
    try:
        log_error(
            endpoint=error.url or "client",
            error_type="ClientError",
            message=error.message,
            source="client",
            traceback_str=error.stack,
        )
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.get("/health/db-backup")
def db_backup():
    """Download the SQLite database as a backup file."""
    import os as _os
    from fastapi.responses import FileResponse
    db_path = _os.environ.get("PLANTY_DB_PATH", "planty.db")
    if not _os.path.exists(db_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(
        db_path,
        media_type="application/octet-stream",
        filename=f"planty-backup-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.db"
    )
