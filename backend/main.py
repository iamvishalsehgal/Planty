"""Planty v2 — FastAPI backend for smart plant care."""

import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from config import config
from db import init_db, SessionLocal, check_db_health
from routes.plants import router as plants_router
from routes.diagnosis import router as diagnosis_router
from routes.health import router as health_router
from routes.weather_route import router as weather_router

# ── Logging ──
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("planty")


# ── Rate limiter (token bucket, 10 req/s per IP) ──
_rate_buckets: dict[str, tuple[float, int]] = defaultdict(lambda: (time.time(), config.RATE_LIMIT_REQ_PER_SEC))
RATE_REFILL = 1.0


# ── Recompute health statuses periodically ──
def recompute_health_statuses():
    """Update health_status for all plants based on current time."""
    from sqlalchemy import text

    db = SessionLocal()
    try:
        plants = db.execute(text("SELECT id, next_watering FROM plants")).fetchall()
        now = datetime.utcnow()
        updated = 0
        for plant in plants:
            next_dt = datetime.fromisoformat(plant.next_watering)
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
            updated += 1
        db.commit()
        if updated:
            logger.debug("Health recompute: %d plants updated", updated)
    except Exception:
        logger.exception("Health recompute failed")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, start scheduler. Shutdown: stop scheduler."""
    logger.info("Planty %s starting — %s", config.VERSION, "TESTING" if config.TESTING else "PRODUCTION")
    init_db()

    # Verify DB connectivity
    if not check_db_health():
        logger.critical("Database health check failed on startup")
    else:
        logger.info("Database health check passed")

    scheduler = None
    if not config.TESTING:
        scheduler = BackgroundScheduler()
        scheduler.add_job(
            recompute_health_statuses,
            "interval",
            minutes=config.HEALTH_RECOMPUTE_MINUTES,
            id="health-check",
        )
        scheduler.start()
        logger.info("Scheduler started — health recompute every %d min", config.HEALTH_RECOMPUTE_MINUTES)

    yield

    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")
    logger.info("Planty stopped")


app = FastAPI(
    title=config.TITLE,
    description="Smart plant care API",
    version=config.VERSION,
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
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request middleware ──
@app.middleware("http")
async def process_request(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    t0 = time.perf_counter()

    # Rate limit (skip health endpoint and test mode)
    if not config.TESTING and not request.url.path.startswith("/api/health"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        last_refill, tokens = _rate_buckets[client_ip]
        elapsed = now - last_refill
        tokens = min(config.RATE_LIMIT_REQ_PER_SEC, tokens + elapsed * RATE_REFILL)
        if tokens < 1:
            logger.warning("Rate limit hit for %s on %s", client_ip, request.url.path)
            raise HTTPException(status_code=429, detail="Too many requests")
        _rate_buckets[client_ip] = (now, tokens - 1)

    from routes.health import increment_request_count
    increment_request_count()

    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time-Ms"] = str(elapsed_ms)

    logger.debug("%s %s → %s (%sms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


# ── Routes ──
app.include_router(plants_router)
app.include_router(diagnosis_router)
app.include_router(health_router)
app.include_router(weather_router)


@app.get("/")
def root():
    return {"name": config.TITLE, "status": "healthy", "version": config.VERSION}


# ── Global exception handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    detail = {"detail": "Internal server error"}
    if config.DEBUG or config.TESTING:
        detail["error"] = str(exc)
        detail["type"] = type(exc).__name__
    return JSONResponse(status_code=500, content=detail)
