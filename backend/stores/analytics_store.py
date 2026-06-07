"""Analytics data access — summary, trends, export, pipeline audit."""


def get_summary(conn) -> dict:
    """Aggregated stats: total plants/events, compliance, avg health."""
    total_plants = conn.execute("SELECT COUNT(*) FROM plants_raw").fetchone()[0]
    total_events = conn.execute("SELECT COUNT(*) FROM care_events").fetchone()[0]
    completed = conn.execute(
        "SELECT COUNT(*) FROM care_events WHERE completed IS NOT NULL"
    ).fetchone()[0]
    overdue = conn.execute(
        "SELECT COUNT(*) FROM care_events WHERE days_overdue > 1"
    ).fetchone()[0]
    avg_health = conn.execute(
        "SELECT AVG(h.health_score) FROM plant_health_metrics h "
        "INNER JOIN (SELECT plant_id, MAX(computed_at) AS latest FROM plant_health_metrics GROUP BY plant_id) m "
        "ON h.plant_id = m.plant_id AND h.computed_at = m.latest"
    ).fetchone()[0]
    return {
        "total_plants": total_plants,
        "total_events": total_events,
        "completed_events": completed,
        "overdue_events": overdue,
        "compliance_rate": round(completed / total_events, 4) if total_events else 0,
        "avg_health_score": round(avg_health, 4) if avg_health else None,
    }


def get_trends(conn, limit=28) -> list[dict]:
    """Daily event counts for the last N days."""
    rows = conn.execute("""
        SELECT DATE(scheduled) AS day, COUNT(*) AS events,
               SUM(CASE WHEN completed IS NOT NULL THEN 1 ELSE 0 END) AS completed
        FROM care_events
        GROUP BY day ORDER BY day DESC LIMIT ?
    """, (limit,)).fetchall()
    return [dict(r) for r in rows]


def export_all(conn) -> dict:
    """Full data export: plants, events, metrics."""
    plants = [dict(r) for r in conn.execute("SELECT * FROM plants_raw").fetchall()]
    events = [dict(r) for r in conn.execute("SELECT * FROM care_events").fetchall()]
    metrics = [dict(r) for r in conn.execute("SELECT * FROM plant_health_metrics").fetchall()]
    return {"plants": plants, "events": events, "metrics": metrics}


def get_pipeline_runs(conn, limit=50) -> list[dict]:
    """Recent pipeline run audit log."""
    rows = conn.execute(
        "SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return [dict(r) for r in rows]
