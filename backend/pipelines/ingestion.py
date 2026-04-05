"""Staging layer — upserts raw plant and event data from the frontend."""

from datetime import datetime, timezone
from db import get_conn


def run(plants: list[dict], events: list[dict]) -> tuple[int, int]:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_conn()

    plants_count = 0
    events_count = 0

    try:
        conn.execute("BEGIN")

        for p in plants:
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
                p["id"], p["name"], p.get("location"), p["interval"],
                p.get("lastWatered"), 1 if p.get("isDead") else 0, now
            ))
            plants_count += 1

        for e in events:
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
        conn.close()
        raise

    conn.close()
    return plants_count, events_count
