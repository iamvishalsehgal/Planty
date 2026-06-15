"""Database setup — PostgreSQL via SQLAlchemy with connection pooling."""

import logging
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import event

from config import config

logger = logging.getLogger("planty.db")

# ── Engine creation ──
connect_args = {}
if config.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(config.DATABASE_URL, connect_args=connect_args)

    # Enable WAL mode for SQLite (better concurrent read/write)
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        logger.debug("SQLite: WAL mode + foreign keys enabled")

else:
    engine = create_engine(
        config.DATABASE_URL,
        pool_size=5,
        pool_recycle=300,
    )

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
        logger.info("Database tables initialised")


def check_db_health() -> bool:
    """Verify database connectivity. Returns True if healthy."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        logger.exception("Database health check failed")
        return False


def get_db() -> Session:
    """Get a database session (FastAPI dependency)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
