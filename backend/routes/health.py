"""Health check endpoint with request counting and DB status."""

import time

from fastapi import APIRouter

from models import HealthResponse
from db import check_db_health

router = APIRouter(prefix="/api", tags=["health"])

_start_time = time.time()
_request_count: int = 0


def increment_request_count():
    """Called by middleware to track request volume."""
    global _request_count
    _request_count += 1


@router.get("/health", response_model=HealthResponse)
def health_check():
    """API health check — includes DB connectivity status."""
    db_healthy = check_db_health()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "request_count": _request_count,
        "uptime_seconds": round(time.time() - _start_time, 1),
    }
