"""Health check and monitoring endpoint.

The main ``/api/health`` endpoint now performs three tiers of database
verification (not just file-existence).  This means Render's health check
will correctly take a DB-broken-but-process-alive instance out of rotation.
"""

import os
import time
import threading
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from db import get_db, get_conn
from backup import run_backup, get_last_backup, get_uptime_stats, record_health_check

router = APIRouter(prefix="/api", tags=["health"])

# ── Module-level state ────────────────────────────────────────────
STARTED_AT = datetime.now(timezone.utc)
REQUEST_COUNT = 0

# Writeability check: cached for 60 s so the health endpoint stays fast
# even under frequent Render probes.  Value is
#   (checked_at_monotonic_s, is_writable: bool, error_message: str | None)
_write_check_lock = threading.Lock()
_write_check_cache: tuple[float, bool, Optional[str]] = (0.0, True, None)
_WRITE_CHECK_INTERVAL_S = 60.0

# Expected schema — every table and its columns.  If a migration goes
# wrong or a table is dropped, the health endpoint will catch it.
_EXPECTED_SCHEMA = {
    "plants_raw":          {"id", "name", "location", "interval", "last_watered",
                             "is_dead", "synced_at"},
    "events_raw":          {"id", "plant_id", "event_type", "scheduled", "completed",
                             "feedback", "synced_at"},
    "care_events":         {"id", "plant_id", "event_type", "scheduled", "completed",
                             "feedback", "days_overdue", "was_on_time", "processed_at"},
    "plant_health_metrics": {"id", "plant_id", "computed_at", "health_score",
                              "compliance_rate", "avg_days_overdue", "total_events",
                              "completed_events"},
    "pipeline_runs":       {"id", "started_at", "finished_at", "status", "plants_staged",
                             "events_staged", "events_transformed", "metrics_computed",
                             "error"},
    "error_log":           {"id", "timestamp", "endpoint", "error_type", "message",
                             "source", "traceback"},
}


# ── Public helpers ────────────────────────────────────────────────

def increment_request_count():
    global REQUEST_COUNT
    REQUEST_COUNT += 1


def _reset_writeability_cache_for_test():
    """Reset the cached writeability check (for test use only)."""
    global _write_check_cache
    with _write_check_lock:
        _write_check_cache = (0.0, True, None)


# ── Internal health-check helpers ─────────────────────────────────

def _check_writeability() -> tuple[bool, Optional[str]]:
    """Test DB writeability via INSERT + ROLLBACK.  Cached for 60 s."""
    global _write_check_cache
    now = time.monotonic()

    # In test mode, never use the cache — each call probes the real FS.
    testing = os.environ.get("PLANTY_TESTING") == "1"

    # Fast path: cached result is still fresh (skipped in test mode)
    if not testing and now - _write_check_cache[0] < _WRITE_CHECK_INTERVAL_S:
        return _write_check_cache[1], _write_check_cache[2]

    with _write_check_lock:
        # Double-check inside the lock (another thread may have refreshed)
        if not testing and now - _write_check_cache[0] < _WRITE_CHECK_INTERVAL_S:
            return _write_check_cache[1], _write_check_cache[2]
        try:
            conn = get_conn()
            conn.execute(
                "CREATE TABLE IF NOT EXISTS _health_write_test (t TEXT)"
            )
            conn.execute(
                "INSERT INTO _health_write_test (t) VALUES (?)",
                (datetime.now(timezone.utc).isoformat(),),
            )
            conn.rollback()  # Never persist test data
            conn.close()
            _write_check_cache = (time.monotonic(), True, None)
            return True, None
        except Exception as e:
            _write_check_cache = (time.monotonic(), False, str(e))
            return False, str(e)


def _check_schema(conn) -> list[str]:
    """Verify every expected table and column exists.

    Returns a list of ``"missing_table:<name>"`` or
    ``"missing_column:<table>.<col>"`` strings.  An empty list means
    the schema matches expectations.
    """
    issues: list[str] = []

    cursor = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' "
        "  AND name NOT LIKE 'sqlite_%' "
        "  AND name NOT LIKE '_health_%'"
    )
    actual_tables = {row[0] for row in cursor.fetchall()}

    for table, expected_cols in _EXPECTED_SCHEMA.items():
        if table not in actual_tables:
            issues.append(f"missing_table:{table}")
            continue
        cols = conn.execute(f"PRAGMA table_info({table})").fetchall()
        actual_cols = {row[1] for row in cols}  # column name is index 1
        missing = expected_cols - actual_cols
        for col in sorted(missing):
            issues.append(f"missing_column:{table}.{col}")

    return issues


def _disk_warning() -> Optional[str]:
    """Return a warning string if free disk space is below 100 MB."""
    try:
        import shutil
        usage = shutil.disk_usage(".")
        free_mb = usage.free / (1024 * 1024)
        if free_mb < 100:
            return f"Low disk space: {free_mb:.0f}MB free"
    except Exception:
        pass
    return None


def _get_db_size_kb(conn) -> float:
    """Read the database file size in KB from an open connection."""
    try:
        row = conn.execute("PRAGMA database_list").fetchone()
        db_path = row[2] if row else None
        if db_path and os.path.exists(db_path):
            return round(os.path.getsize(db_path) / 1024, 1)
    except Exception:
        pass
    return 0.0


def _build_payload(
    status: str,
    checks: dict,
    db_size_kb: float,
    failure: Optional[str] = None,
) -> dict:
    """Assemble the common health response body."""
    uptime_seconds = round(
        (datetime.now(timezone.utc) - STARTED_AT).total_seconds()
    )
    body: dict = {
        "status": status,
        "version": "4.0",
        "uptime_seconds": uptime_seconds,
        "request_count": REQUEST_COUNT,
        "db_size_kb": db_size_kb,
        "started_at": STARTED_AT.isoformat(),
        "disk_warning": _disk_warning(),
        "checks": checks,
    }
    if failure:
        body["failure"] = failure
    return body


# ── Main health endpoint ──────────────────────────────────────────

@router.get("/health")
def health():
    """System health — verifies DB connectivity, schema, and writeability.

    **Checks performed (in order)**

    1. **Liveness** — ``PRAGMA integrity_check``.  Catches corrupt or
       locked databases that ``SELECT 1`` would miss.
    2. **Schema** — confirms all 6 expected tables and their columns
       exist.  Catches partial migrations or dropped tables.
    3. **Writeability** — ``INSERT`` + ``ROLLBACK`` test, cached for
       60 s so the endpoint stays fast.

    **Response codes**

    =====  ================  ==========================================
    HTTP   ``status`` field  Meaning
    =====  ================  ==========================================
    200    ``"healthy"``     All checks passed.
    200    ``"degraded"``    DB is readable but not writable
                             (e.g. read-only filesystem, disk full).
                             Reads continue to work.
    503    ``"unhealthy"``   DB is unreachable, corrupt, or the schema
                             is broken.  Render will take the instance
                             out of rotation.
    =====  ================  ==========================================

    **Sub-endpoints** (still separate for deep-dive diagnostics):
    ``/health/metrics``, ``/health/consistency``, ``/health/errors``,
    ``/health/pipeline-health``, ``/health/performance``.
    """
    checks: dict[str, object] = {}
    failure_reason: Optional[str] = None
    db_size_kb: float = 0.0

    # ── 1. Liveness: PRAGMA integrity_check ───────────────────────
    try:
        conn = get_conn()
        integrity = conn.execute("PRAGMA integrity_check").fetchone()
        if integrity[0] != "ok":
            failure_reason = f"integrity_check: {integrity[0]}"
            checks["db_integrity"] = failure_reason
            conn.close()
            record_health_check(False, "unhealthy", checks)
            return JSONResponse(
                content=_build_payload(
                    "unhealthy", checks, 0.0, failure_reason
                ),
                status_code=503,
            )
        checks["db_integrity"] = "ok"
    except Exception as e:
        failure_reason = f"cannot_connect: {e}"
        record_health_check(False, "unhealthy", {"db_integrity": failure_reason})
        return JSONResponse(
            content=_build_payload(
                "unhealthy",
                {"db_integrity": failure_reason},
                0.0,
                failure_reason,
            ),
            status_code=503,
        )

    # ── 2. Schema integrity ───────────────────────────────────────
    try:
        schema_issues = _check_schema(conn)
        if schema_issues:
            checks["db_schema"] = schema_issues
            failure_reason = f"schema_issues: {schema_issues}"
            db_size_kb = _get_db_size_kb(conn)
            conn.close()
            record_health_check(False, "unhealthy", checks)
            return JSONResponse(
                content=_build_payload(
                    "unhealthy", checks, db_size_kb, failure_reason
                ),
                status_code=503,
            )
        checks["db_schema"] = "ok"
    except Exception as e:
        failure_reason = f"schema_check_failed: {e}"
        conn.close()
        record_health_check(False, "unhealthy", checks)
        return JSONResponse(
            content=_build_payload(
                "unhealthy", checks, 0.0, failure_reason
            ),
            status_code=503,
        )

    # ── 3. DB file size ───────────────────────────────────────────
    db_size_kb = _get_db_size_kb(conn)
    conn.close()

    # ── 4. Writeability (cached 60 s) ─────────────────────────────
    writable, write_err = _check_writeability()
    checks["db_writeability"] = "ok" if writable else (write_err or "unknown")

    if not writable:
        record_health_check(True, "degraded", checks)
        return JSONResponse(
            content=_build_payload("degraded", checks, db_size_kb),
            status_code=200,
        )

    record_health_check(True, "healthy", checks)
    return JSONResponse(
        content=_build_payload("healthy", checks, db_size_kb),
        status_code=200,
    )


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


# ── Backup & Uptime Monitoring ────────────────────────────────────

@router.post("/health/backup/trigger")
def trigger_backup(token: Optional[str] = None):
    """Trigger an on-demand database backup. Optional token for cron auth."""
    expected = os.environ.get("PLANTY_BACKUP_TOKEN", "")
    if expected and token != expected:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Invalid backup token")
    result = run_backup()
    if result["success"]:
        return {"ok": True, **result}
    return {"ok": False, **result}


@router.get("/health/backup/status")
def backup_status():
    """Return info about the most recent backup."""
    return get_last_backup()


@router.get("/health/uptime")
def uptime_stats():
    """Return uptime statistics from health check history."""
    return get_uptime_stats()
