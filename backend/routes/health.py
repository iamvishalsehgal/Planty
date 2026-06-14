"""Health check endpoint with request counting."""

import time
from collections import defaultdict

from fastapi import APIRouter

from models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])

_start_time = time.time()
_request_count: defaultdict[str, int] = defaultdict(int)


def increment_request_count():
    """Called by middleware to track request volume."""
    _request_count["total"] += 1


@router.get("/health", response_model=HealthResponse)
def health_check():
    """API health check."""
    return {
        "status": "healthy",
        "request_count": _request_count["total"],
        "uptime_seconds": time.time() - _start_time,
    }
