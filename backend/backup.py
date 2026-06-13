"""Automated SQLite backup with retention and uptime monitoring."""

import os
import shutil
import time
import threading
from datetime import datetime, timezone
from pathlib import Path

# ── Backup Configuration ──────────────────────────────────────────

BACKUP_KEEP_DAYS = 7  # Rolling window
BACKUP_DIR = Path(os.environ.get("PLANTY_BACKUP_DIR", "/var/data/backups"))
# Fall back to backend/backups/ if /var/data isn't writable
if not BACKUP_DIR.exists() or not os.access(BACKUP_DIR, os.W_OK):
    BACKUP_DIR = Path(os.environ.get("PLANTY_DB_PATH", "planty.db")).parent / "backups"

_last_backup: dict = {
    "timestamp": None,
    "path": None,
    "size_kb": 0,
    "success": True,
    "error": None,
}
_backup_lock = threading.Lock()


def _get_db_path() -> str:
    return os.environ.get("PLANTY_DB_PATH", "planty.db")


def run_backup() -> dict:
    """Copy the database to a timestamped backup file. Keeps last 7 days."""
    global _last_backup
    db_path = _get_db_path()

    if not os.path.exists(db_path):
        result = {"success": False, "error": f"DB not found: {db_path}"}
        with _backup_lock:
            _last_backup = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": None,
                "size_kb": 0,
                "success": False,
                "error": result["error"],
            }
        return result

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc)
    fname = f"planty-backup-{now.strftime('%Y-%m-%d')}.db"
    dest = BACKUP_DIR / fname

    try:
        # Use SQLite backup API for safe copy (won't corrupt mid-transaction)
        import sqlite3
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(str(dest))
        src.backup(dst)
        src.close()
        dst.close()
    except Exception:
        # Fallback: file copy
        shutil.copy2(db_path, str(dest))

    size_kb = round(os.path.getsize(str(dest)) / 1024, 1)

    # Prune old backups
    for old in sorted(BACKUP_DIR.glob("planty-backup-*.db")):
        try:
            age_days = (now - datetime.fromtimestamp(old.stat().st_mtime, tz=timezone.utc)).days
            if age_days > BACKUP_KEEP_DAYS:
                old.unlink()
        except Exception:
            pass

    result = {
        "success": True,
        "path": str(dest),
        "size_kb": size_kb,
        "backups_kept": len(list(BACKUP_DIR.glob("planty-backup-*.db"))),
    }

    with _backup_lock:
        _last_backup = {
            "timestamp": now.isoformat(),
            "path": str(dest),
            "size_kb": size_kb,
            "success": True,
            "error": None,
        }

    return result


def get_last_backup() -> dict:
    with _backup_lock:
        return dict(_last_backup)


# ── Uptime / Health Tracking ──────────────────────────────────────

_health_history: list[dict] = []  # last 100 health check outcomes
HEALTH_HISTORY_MAX = 100
_history_lock = threading.Lock()


def record_health_check(healthy: bool, status: str, checks: dict):
    """Record a health check outcome for uptime tracking."""
    global _health_history
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "healthy": healthy,
        "status": status,
        "checks_summary": checks,
    }
    with _history_lock:
        _health_history.append(entry)
        if len(_health_history) > HEALTH_HISTORY_MAX:
            _health_history = _health_history[-HEALTH_HISTORY_MAX:]


def get_uptime_stats() -> dict:
    """Return uptime statistics from recorded health check history."""
    with _history_lock:
        history = list(_health_history)

    if not history:
        return {"total_checks": 0, "healthy_pct": 100.0, "message": "No health check history yet"}

    total = len(history)
    healthy = sum(1 for h in history if h["healthy"])
    unhealthy = total - healthy

    # Find last unhealthy period
    last_unhealthy = None
    for h in reversed(history):
        if not h["healthy"]:
            last_unhealthy = h["timestamp"]
            break

    # Consecutive failures at end (current state)
    consecutive_failures = 0
    for h in reversed(history):
        if not h["healthy"]:
            consecutive_failures += 1
        else:
            break

    return {
        "total_checks": total,
        "healthy": healthy,
        "unhealthy": unhealthy,
        "healthy_pct": round(healthy / total * 100, 2) if total else 100.0,
        "consecutive_failures": consecutive_failures,
        "last_unhealthy_at": last_unhealthy,
        "status": "degraded" if consecutive_failures > 0 else "ok",
    }
