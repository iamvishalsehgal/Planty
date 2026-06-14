"""Planty v2 — FastAPI backend for smart plant care."""

import os
import time
import uuid
from contextlib import asynccontextmanager
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from db import init_db
from routes.plants import router as plants_router
from routes.diagnosis import router as diagnosis_router
from routes.health import router as health_router
from routes.weather_route import router as weather_router


# ── Rate limiter (token bucket, 10 req/s per IP) ──
_rate_buckets: dict[str, tuple[float, int]] = defaultdict(lambda: (time.time(), 10))
RATE_LIMIT = 10
RATE_REFILL = 1.0


# ── Recompute health statuses periodically ──
def recompute_health_statuses():
    """Update health_status for all plants based on current time."""
    from sqlalchemy import text
    from db import SessionLocal

    db = SessionLocal()
    try:
        plants = db.execute(text("SELECT id, next_watering FROM plants")).fetchall()
        now = __import__("datetime").datetime.utcnow()
        for plant in plants:
            next_dt = __import__("datetime").datetime.fromisoformat(plant.next_watering)
            days_until = (next_dt - now).days
            if days_until < 0:
                status = "overdue"
            elif days_until == 0:
                status = "dry"
            elif days_until <= 2:
                status = "warning"
            else:
                status = "healthy"
            db.execute(
                text("UPDATE plants SET health_status = :s WHERE id = :id"),
                {"s": status, "id": plant.id},
            )
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, start scheduler. Shutdown: stop scheduler."""
    init_db()
    scheduler = None
    if not os.environ.get("PLANTY_TESTING"):
        scheduler = BackgroundScheduler()
        scheduler.add_job(recompute_health_statuses, "interval", minutes=5, id="health-check")
        scheduler.start()
        print("Planty v2 started — health recompute every 5 min")
    yield
    if scheduler:
        scheduler.shutdown(wait=False)
        print("Planty stopped — scheduler shut down")


app = FastAPI(
    title="Planty v2",
    description="Smart plant care API",
    version="2.0.0",
    lifespan=lifespan,
)


# ── Security headers ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=self"
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request middleware ──
@app.middleware("http")
async def process_request(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    t0 = time.perf_counter()

    # Rate limit (skip health endpoint and test mode)
    if not os.environ.get("PLANTY_TESTING") and not request.url.path.startswith("/api/health"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        last_refill, tokens = _rate_buckets[client_ip]
        elapsed = now - last_refill
        tokens = min(RATE_LIMIT, tokens + elapsed * RATE_REFILL)
        if tokens < 1:
            raise HTTPException(status_code=429, detail="Too many requests")
        _rate_buckets[client_ip] = (now, tokens - 1)

    from routes.health import increment_request_count
    increment_request_count()

    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time-Ms"] = str(round((time.perf_counter() - t0) * 1000, 2))
    return response


# ── Routes ──
app.include_router(plants_router)
app.include_router(diagnosis_router)
app.include_router(health_router)
app.include_router(weather_router)


@app.get("/")
def root():
    return {"name": "Planty v2", "status": "healthy", "version": "2.0.0"}


# ── Global exception handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if __import__("os").environ.get("PLANTY_TESTING") else None},
    )
