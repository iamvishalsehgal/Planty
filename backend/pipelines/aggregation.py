"""Aggregation layer — computes health score per plant.

Health score formula (0.0–1.0):
    score = compliance * W_COMPLIANCE + timeliness * W_TIMELINESS + feedback * W_FEEDBACK
Where:
    compliance  = completed_events / total_events  (always 1.0 for care_events)
    timeliness  = on_time_events / total_events     (was_on_time == 1)
    feedback    = avg(feedback_score)               (happy=1.0, sad=0.3, overwatered=0.0, none=0.5)
"""

import logging
from datetime import datetime, timezone
from db import get_conn

logger = logging.getLogger("planty.aggregation")

from shared import W_COMPLIANCE, W_TIMELINESS, W_FEEDBACK, FEEDBACK_SCORES, DEFAULT_FEEDBACK


def run(conn=None) -> int:
    """Compute health_score for every plant with care_events. Returns number of plants scored.
    Accepts optional conn for dependency injection (tests); opens own if not provided."""
    now = datetime.now(timezone.utc).isoformat()
    _close = False
    if conn is None:
        conn = get_conn()
        _close = True

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

            feedback_scores = [FEEDBACK_SCORES.get(e["feedback"], DEFAULT_FEEDBACK) for e in events]
            feedback = sum(feedback_scores) / len(feedback_scores) if feedback_scores else DEFAULT_FEEDBACK

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
        if _close: conn.close()
        raise

    if _close: conn.close()
    logger.info(f"Computed health metrics for {count} plants")
    return count
