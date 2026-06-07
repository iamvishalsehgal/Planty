import sqlite3
import time
import logging
from contextlib import contextmanager
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("planty.db")

SLOW_QUERY_MS = 100  # Log queries slower than this

import os as _os
DB_PATH = Path(_os.environ.get("PLANTY_DB_PATH", str(Path(__file__).parent / "planty.db")))


def timed_execute(conn, sql, params=(), label=""):
    """Execute SQL with timing — logs slow queries."""
    start = time.perf_counter()
    cursor = conn.execute(sql, params)
    elapsed_ms = (time.perf_counter() - start) * 1000
    if elapsed_ms > SLOW_QUERY_MS:
        logger.warning(f"Slow query ({elapsed_ms:.1f}ms) {label}: {sql[:120]}")
    return cursor


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    """Context manager that ensures connection is always closed."""
    conn = get_conn()
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS plants_raw (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            location    TEXT,
            interval    INTEGER NOT NULL,
            last_watered TEXT,
            is_dead     INTEGER DEFAULT 0,
            synced_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS events_raw (
            id          TEXT PRIMARY KEY,
            plant_id    TEXT NOT NULL,
            event_type  TEXT NOT NULL,
            scheduled   TEXT NOT NULL,
            completed   TEXT,
            feedback    TEXT,
            synced_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS care_events (
            id              TEXT PRIMARY KEY,
            plant_id        TEXT NOT NULL,
            event_type      TEXT NOT NULL,
            scheduled       TEXT NOT NULL,
            completed       TEXT,
            feedback        TEXT,
            days_overdue    REAL,
            was_on_time     INTEGER,
            processed_at    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plant_health_metrics (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            plant_id        TEXT NOT NULL,
            computed_at     TEXT NOT NULL,
            health_score    REAL,
            compliance_rate REAL,
            avg_days_overdue REAL,
            total_events    INTEGER,
            completed_events INTEGER
        );

        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at      TEXT NOT NULL,
            finished_at     TEXT,
            status          TEXT,
            plants_staged   INTEGER DEFAULT 0,
            events_staged   INTEGER DEFAULT 0,
            events_transformed INTEGER DEFAULT 0,
            metrics_computed INTEGER DEFAULT 0,
            error           TEXT
        );

        -- Indexes for analytics queries
        CREATE INDEX IF NOT EXISTS idx_events_raw_plant ON events_raw(plant_id);
        CREATE INDEX IF NOT EXISTS idx_care_events_plant ON care_events(plant_id);
        CREATE INDEX IF NOT EXISTS idx_health_plant_computed ON plant_health_metrics(plant_id, computed_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);
    """)
    conn.commit()
    conn.close()
