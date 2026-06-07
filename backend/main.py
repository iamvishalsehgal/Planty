import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from collections import defaultdict

# Make backend/ importable as root package
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from db import init_db
from pipelines.runner import run_pipeline
from routes.plants import router as plants_router
from routes.events import router as events_router
from routes.analytics import router as analytics_router
from routes.health import router as health_router

FRONTEND = Path(__file__).parent.parent / "frontend"

# ── Rate limiter (simple token bucket, 10 req/s per IP) ──────────
_rate_buckets: dict[str, tuple[float, int]] = defaultdict(lambda: (time.time(), 10))
RATE_LIMIT = 10  # requests per second per IP
RATE_REFILL = 1.0  # tokens per second


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB, start ETL scheduler. Shutdown: stop scheduler."""
    init_db()
    scheduler = None
    if not os.environ.get("PLANTY_TESTING"):
        scheduler = BackgroundScheduler()
        scheduler.add_job(run_pipeline, "interval", minutes=5, id="etl")
        scheduler.start()
        print("Planty started — ETL pipeline running every 5 minutes")
    yield
    if scheduler:
        scheduler.shutdown(wait=False)
        print("Planty stopped — scheduler shut down")


app = FastAPI(title="Planty", lifespan=lifespan)

# ── Security Headers ─────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=self"
        if request.url.scheme == "https" or "render" in str(request.url):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants_router)
app.include_router(events_router)
app.include_router(analytics_router)
app.include_router(health_router)

# ── Request middleware (rate limit + count + request ID) ──────────
@app.middleware("http")
async def process_request(request: Request, call_next):
    # Request ID
    req_id = str(uuid.uuid4())[:8]
    request.state.req_id = req_id

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
    return response


@app.get("/")
def serve_frontend():
    return FileResponse(FRONTEND / "index.html")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    static_file = FRONTEND / "public" / full_path
    if static_file.is_file():
        return FileResponse(static_file)
    return FileResponse(FRONTEND / "index.html")
