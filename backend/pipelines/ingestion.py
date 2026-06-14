"""Staging layer — upserts raw plant and event data from the frontend.

Each item is validated individually. Invalid items are skipped and logged;
valid items are committed. One bad item no longer kills the entire batch."""

import logging
from datetime import datetime, timezone
from db import get_conn
from shared import MIN_INTERVAL, MAX_INTERVAL

logger = logging.getLogger("planty.ingestion")

REQUIRED_PLANT_FIELDS = {"id", "name", "interval"}
REQUIRED_EVENT_FIELDS = {"id", "plantId", "eventType", "scheduled"}


def _validate_plant(p: dict) -> bool:
    """Return True if the plant dict has all required fields with valid types."""
    if not isinstance(p, dict):
        return False
    missing = REQUIRED_PLANT_FIELDS - set(p.keys())
    if missing:
        logger.warning(f"Skipping plant — missing fields: {missing}")
        return False
    if not isinstance(p["id"], str) or not p["id"].strip():
        logger.warning("Skipping plant — empty or invalid id")
        return False
    if not isinstance(p["name"], str) or not p["name"].strip():
        logger.warning("Skipping plant — empty name")
        return False
    if not isinstance(p["interval"], (int, float)) or not (MIN_INTERVAL <= p["interval"] <= MAX_INTERVAL):
        logger.warning(f"Skipping plant — interval {p.get('interval')} out of range {MIN_INTERVAL}-{MAX_INTERVAL}")
        return False
    return True


def _validate_event(e: dict) -> bool:
    """Return True if the event dict has all required fields."""
    if not isinstance(e, dict):
        return False
    missing = REQUIRED_EVENT_FIELDS - set(e.keys())
    if missing:
        logger.warning(f"Skipping event — missing fields: {missing}")
        return False
    if not isinstance(e["id"], str) or not e["id"].strip():
        return False
    if not isinstance(e["plantId"], str) or not e["plantId"].strip():
        return False
    return True


def run(conn=None, plants: list[dict] = None, events: list[dict] = None) -> tuple[int, int]:
    """Stage plant and event data. Accepts optional conn for DI. Returns (plants_staged, events_staged)."""
    plants = plants or []
    events = events or []
    now = datetime.now(timezone.utc).isoformat()
    _close = False
    if conn is None:
        conn = get_conn()
        _close = True

    plants_count = 0
    events_count = 0

    # Filter valid items
    valid_plants = [p for p in plants if _validate_plant(p)]
    valid_events = [e for e in events if _validate_event(e)]
    skipped_plants = len(plants) - len(valid_plants)
    skipped_events = len(events) - len(valid_events)
    if skipped_plants or skipped_events:
        logger.info(f"Ingestion: {skipped_plants} plants, {skipped_events} events skipped (validation)")

    if not valid_plants and not valid_events:
        if _close: conn.close()
        return 0, 0

    try:
        conn.execute("BEGIN")

        for p in valid_plants:
            conn.execute("""
                INSERT INTO plants_raw (id, name, location, interval, last_watered, is_dead, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name        = excluded.name,
                    location    = excluded.location,
                    interval    = excluded.interval,
                    last_watered = excluded.last_watered,
                    is_dead     = excluded.is_dead,
                    synced_at   = excluded.synced_at
            """, (
                p["id"], p["name"].strip(), p.get("location"),
                int(p["interval"]), p.get("lastWatered"),
                1 if p.get("isDead") else 0, now
            ))
            plants_count += 1

        for e in valid_events:
            conn.execute("""
                INSERT INTO events_raw (id, plant_id, event_type, scheduled, completed, feedback, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    completed   = excluded.completed,
                    feedback    = excluded.feedback,
                    synced_at   = excluded.synced_at
            """, (
                e["id"], e["plantId"], e["eventType"],
                e["scheduled"], e.get("completed"), e.get("feedback"), now
            ))
            events_count += 1

        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        if _close: conn.close()
        raise

    if _close: conn.close()
    return plants_count, events_count
