"""Aggregation layer — computes health score per plant.

Health score formula (0.0–1.0):
    score = compliance * W_COMPLIANCE + timeliness * W_TIMELINESS + feedback * W_FEEDBACK
Where:
    compliance  = completed_events / total_events  (always 1.0 for care_events)
    timeliness  = on_time_events / total_events     (was_on_time == 1)
    feedback    = avg(feedback_score)               (happy=1.0, sad=0.3, overwatered=0.0, none=0.5)
"""

from datetime import datetime, timezone
from db import get_conn

# Configurable weights — tune these to adjust scoring priorities
W_COMPLIANCE = 0.4   # How consistently you water at all
W_TIMELINESS = 0.3   # How often you water on time
W_FEEDBACK = 0.3     # How the plant responds to your care


def run() -> int:
    """Compute health_score for every plant with care_events. Returns number of plants scored."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_conn()

    plant_ids = [r["id"] for r in conn.execute("SELECT id FROM plants_raw").fetchall()]
    count = 0

    try:
        conn.execute("BEGIN")
        for plant_id in plant_ids:
            events = conn.execute("""
                SELECT was_on_time, days_overdue, feedback
                FROM care_events
                WHERE plant_id = ?
            """, (plant_id,)).fetchall()

            total = len(events)
            if total == 0:
                continue

            completed = total
            compliance = completed / total

            on_time = sum(1 for e in events if e["was_on_time"])
            timeliness = on_time / total

            feedback_scores = []
            for e in events:
                if e["feedback"] == "happy":
                    feedback_scores.append(1.0)
                elif e["feedback"] == "sad":
                    feedback_scores.append(0.3)
                elif e["feedback"] == "overwatered":
                    feedback_scores.append(0.0)
            feedback = sum(feedback_scores) / len(feedback_scores) if feedback_scores else 0.5

            health_score = compliance * W_COMPLIANCE + timeliness * W_TIMELINESS + feedback * W_FEEDBACK
            avg_overdue = sum(e["days_overdue"] or 0 for e in events) / total

            conn.execute("""
                INSERT INTO plant_health_metrics
                    (plant_id, computed_at, health_score, compliance_rate,
                     avg_days_overdue, total_events, completed_events)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                plant_id, now, round(health_score, 4), round(compliance, 4),
                round(avg_overdue, 2), total, completed
            ))
            count += 1

        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        conn.close()
        raise

    conn.close()
    return count
