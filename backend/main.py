import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Make backend/ importable as root package
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from db import init_db
from pipelines.runner import run_pipeline
from routes.plants import router as plants_router
from routes.events import router as events_router
from routes.analytics import router as analytics_router

FRONTEND = Path(__file__).parent.parent / "frontend"


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants_router)
app.include_router(events_router)
app.include_router(analytics_router)


@app.get("/")
def serve_frontend():
    return FileResponse(FRONTEND / "index.html")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    static_file = FRONTEND / "public" / full_path
    if static_file.is_file():
        return FileResponse(static_file)
    return FileResponse(FRONTEND / "index.html")
