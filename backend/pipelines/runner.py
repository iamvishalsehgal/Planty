"""ETL orchestrator — runs all three pipeline layers and writes an audit log."""

from datetime import datetime, timezone
from db import get_conn
from pipelines import ingestion, transform, aggregation


def run_pipeline(plants: list[dict] = None, events: list[dict] = None) -> dict:
    started = datetime.now(timezone.utc).isoformat()
    conn = get_conn()

    run_id = conn.execute(
        "INSERT INTO pipeline_runs (started_at, status) VALUES (?, 'running')",
        (started,)
    ).lastrowid
    conn.commit()
    conn.close()

    result = {
        "plants_staged": 0,
        "events_staged": 0,
        "events_transformed": 0,
        "metrics_computed": 0,
        "status": "success",
        "error": None,
    }

    try:
        if plants is not None or events is not None:
            ps, es = ingestion.run(plants or [], events or [])
            result["plants_staged"] = ps
            result["events_staged"] = es

        result["events_transformed"] = transform.run()
        result["metrics_computed"] = aggregation.run()

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    finished = datetime.now(timezone.utc).isoformat()
    conn = get_conn()
    conn.execute("""
        UPDATE pipeline_runs SET
            finished_at         = ?,
            status              = ?,
            plants_staged       = ?,
            events_staged       = ?,
            events_transformed  = ?,
            metrics_computed    = ?,
            error               = ?
        WHERE id = ?
    """, (
        finished, result["status"],
        result["plants_staged"], result["events_staged"],
        result["events_transformed"], result["metrics_computed"],
        result["error"], run_id
    ))
    conn.commit()
    conn.close()

    return result
