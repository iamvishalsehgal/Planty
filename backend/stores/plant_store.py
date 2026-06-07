"""Plant data access — thin DB layer consumed by routes and pipeline."""

def sync_plants(conn, plants: list[dict]) -> int:
    """Upsert plant records. Returns count staged."""
    count = 0
    for p in plants:
        conn.execute("""...""")  # handled by ingestion pipeline
        count += 1
    return count


def list_plants(conn):
    """Return all plants with their latest health metrics."""
    plants = conn.execute("SELECT * FROM plants_raw").fetchall()
    out = []
    for p in plants:
        metrics = conn.execute("""
            SELECT health_score, compliance_rate, avg_days_overdue
            FROM plant_health_metrics
            WHERE plant_id = ?
            ORDER BY computed_at DESC LIMIT 1
        """, (p["id"],)).fetchone()
        row = dict(p)
        row["metrics"] = dict(metrics) if metrics else None
        out.append(row)
    return out
