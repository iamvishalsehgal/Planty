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
        "version": "2.5",
        "uptime_seconds": uptime_seconds,
        "request_count": REQUEST_COUNT,
        "db_size_kb": db_size_kb,
        "started_at": STARTED_AT.isoformat(),
    }
