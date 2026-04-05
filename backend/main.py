import sys
from pathlib import Path

# Make backend/ importable as root package
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from db import init_db
from pipelines.runner import run_pipeline
from routes.plants import router as plants_router
from routes.events import router as events_router
from routes.analytics import router as analytics_router

app = FastAPI(title="Planty")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants_router)
app.include_router(events_router)
app.include_router(analytics_router)


@app.on_event("startup")
def startup():
    init_db()
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_pipeline, "interval", minutes=5, id="etl")
    scheduler.start()
    print("Planty backend running on :3001")
    print("ETL pipeline scheduled every 5 minutes")


@app.get("/")
def root():
    return {"status": "ok", "app": "Planty"}
