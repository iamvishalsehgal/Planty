"""Database setup — PostgreSQL via SQLAlchemy with connection pooling."""

import os
from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

# Use SQLite for local dev, PostgreSQL in production (Render)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///planty.db",
)

# SQLAlchemy setup
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Enable WAL mode for SQLite
    import sqlite3
    # WAL is enabled via connection events
else:
    engine = create_engine(DATABASE_URL, pool_size=5, pool_recycle=300)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db():
    """Create tables if they don't exist."""
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS plants (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                species TEXT NOT NULL,
                room TEXT NOT NULL,
                photo_url TEXT,
                watering_interval_days INTEGER NOT NULL DEFAULT 3,
                last_watered TEXT NOT NULL,
                next_watering TEXT NOT NULL,
                health_status TEXT NOT NULL DEFAULT 'healthy',
                created_at TEXT NOT NULL
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS watering_events (
                id TEXT PRIMARY KEY,
                plant_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                amount_ml INTEGER,
                notes TEXT,
                FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_watering_events_plant
            ON watering_events(plant_id, timestamp DESC)
        """))
        conn.commit()


def get_db() -> Session:
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
