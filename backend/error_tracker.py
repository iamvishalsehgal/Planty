"""Error tracking — structured error logging, pipeline health, request performance.

Stores errors in SQLite error_log table. Performance metrics are in-memory only.
"""

import time
import traceback
from datetime import datetime, timezone
from collections import defaultdict, deque
from db import get_conn, get_db

# ── In-memory performance tracking (rolling window of last 1000 requests) ──
_perf_window: deque = deque(maxlen=1000)
_endpoint_times: dict[str, deque] = defaultdict(lambda: deque(maxlen=100))


def record_request(endpoint: str, duration_ms: float):
    """Record a completed request for performance tracking."""
    now = time.time()
    _perf_window.append((endpoint, duration_ms, now))
    _endpoint_times[endpoint].append(duration_ms)


def get_performance_stats() -> dict:
    """Return aggregate performance stats from the rolling window."""
    if not _perf_window:
        return {"total_requests": 0, "avg_ms": 0, "p95_ms": 0, "max_ms": 0}

    durations = sorted(d[1] for d in _perf_window)
    total = len(durations)
    avg = sum(durations) / total
    p95_idx = int(total * 0.95)
    p95 = durations[p95_idx] if p95_idx < total else durations[-1]
    max_ms = durations[-1]

    by_endpoint = {}
    for ep, times in _endpoint_times.items():
        if times:
            t = sorted(times)
            by_endpoint[ep] = {
                "count": len(t),
                "avg_ms": round(sum(t) / len(t), 2),
                "p95_ms": round(t[int(len(t) * 0.95)] if int(len(t) * 0.95) < len(t) else t[-1], 2),
                "max_ms": round(max(t), 2),
            }

    return {
        "total_requests": total,
        "avg_ms": round(avg, 2),
        "p95_ms": round(p95, 2),
        "max_ms": round(max_ms, 2),
        "by_endpoint": by_endpoint,
    }


# ── Error logging ──────────────────────────────────────────────────────────


def log_error(endpoint: str, error_type: str, message: str, source: str = "server",
              traceback_str: str = None):
    """Persist an error to the error_log table. Safe to call from any context."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        conn = get_conn()
        conn.execute("""
            INSERT INTO error_log (timestamp, endpoint, error_type, message, source, traceback)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (now, endpoint, error_type, message, source, traceback_str))
        conn.commit()
        conn.close()
    except Exception:
        # Don't let error logging cause more errors
        pass


def get_recent_errors(limit: int = 50) -> list[dict]:
    """Return recent errors from the error_log table."""
    try:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM error_log ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def get_pipeline_health() -> dict:
    """Compute pipeline health: last run, consecutive failures, avg duration."""
    try:
        with get_db() as conn:
            runs = conn.execute("""
                SELECT status, error,
                       (julianday(finished_at) - julianday(started_at)) * 86400 * 1000 AS duration_ms
                FROM pipeline_runs
                WHERE finished_at IS NOT NULL
                ORDER BY started_at DESC LIMIT 10
            """).fetchall()
    except Exception:
        return {"is_healthy": False, "error": "Could not query pipeline_runs"}

    if not runs:
        return {
            "is_healthy": True,
            "last_run_status": "no_data",
            "message": "No pipeline runs recorded yet",
            "consecutive_failures": 0,
            "avg_duration_ms": 0,
            "total_runs_checked": 0,
            "issues": None,
        }

    last = runs[0]
    consecutive_failures = 0
    for r in runs:
        if r["status"] == "error":
            consecutive_failures += 1
        else:
            break

    durations = [r["duration_ms"] for r in runs if r["duration_ms"] is not None]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0

    is_healthy = True
    issues = []

    if consecutive_failures >= 3:
        is_healthy = False
        issues.append(f"{consecutive_failures} consecutive failures")
    elif last["status"] == "error":
        is_healthy = False
        issues.append(f"Last run errored: {last.get('error', 'unknown')}")

    return {
        "is_healthy": is_healthy,
        "last_run_status": last["status"],
        "last_run_error": last.get("error"),
        "consecutive_failures": consecutive_failures,
        "avg_duration_ms": avg_duration,
        "total_runs_checked": len(runs),
        "issues": issues if issues else None,
    }
