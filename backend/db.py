import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "planty.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


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

        CREATE TABLE IF NOT EXISTS weather_snapshots (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            captured_at TEXT NOT NULL,
            temp_c      REAL,
            humidity    REAL,
            condition   TEXT
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
    """)
    conn.commit()
    conn.close()
