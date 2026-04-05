"""Transform layer — enriches raw events with days_overdue and was_on_time."""

from datetime import datetime, timezone
from db import get_conn


def run() -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = get_conn()

    rows = conn.execute("""
        SELECT e.id, e.plant_id, e.event_type, e.scheduled, e.completed, e.feedback
        FROM events_raw e
        LEFT JOIN care_events c ON c.id = e.id
        WHERE c.id IS NULL
          AND e.completed IS NOT NULL
    """).fetchall()

    count = 0
    try:
        conn.execute("BEGIN")
        for row in rows:
            scheduled = datetime.fromisoformat(row["scheduled"].replace("Z", "+00:00"))
            completed = datetime.fromisoformat(row["completed"].replace("Z", "+00:00"))
            days_overdue = (completed - scheduled).total_seconds() / 86400
            was_on_time = 1 if days_overdue <= 1 else 0

            conn.execute("""
                INSERT OR IGNORE INTO care_events
                    (id, plant_id, event_type, scheduled, completed, feedback,
                     days_overdue, was_on_time, processed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row["id"], row["plant_id"], row["event_type"],
                row["scheduled"], row["completed"], row["feedback"],
                round(days_overdue, 2), was_on_time, now
            ))
            count += 1
        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        conn.close()
        raise

    conn.close()
    return count
