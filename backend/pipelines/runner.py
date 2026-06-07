"""ETL orchestrator — runs all three pipeline layers, writes an audit log with timing."""

import logging
import time
from datetime import datetime, timezone
from db import get_conn
from pipelines import ingestion, transform, aggregation

logger = logging.getLogger("planty.runner")


def run_pipeline(plants: list[dict] = None, events: list[dict] = None) -> dict:
    """Run full ETL: ingestion → transform → aggregation. Returns result dict with duration_ms."""
    t0 = time.perf_counter()
    started = datetime.now(timezone.utc).isoformat()
    conn = get_conn()

    run_id = conn.execute(
        "INSERT INTO pipeline_runs (started_at, status) VALUES (?, 'running')",
        (started,)
    ).lastrowid
    conn.commit()

    result = {
        "plants_staged": 0,
        "events_staged": 0,
        "events_transformed": 0,
        "metrics_computed": 0,
        "duration_ms": 0,
        "status": "success",
        "error": None,
    }

    try:
        if plants is not None or events is not None:
            ps, es = ingestion.run(conn=conn, plants=plants or [], events=events or [])
            result["plants_staged"] = ps
            result["events_staged"] = es

        result["events_transformed"] = transform.run(conn=conn)
        result["metrics_computed"] = aggregation.run(conn=conn)

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    duration_ms = round((time.perf_counter() - t0) * 1000)
    result["duration_ms"] = duration_ms
    finished = datetime.now(timezone.utc).isoformat()

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

    logger.info(f"Pipeline {run_id} completed in {duration_ms}ms — "
                f"staged {result['plants_staged']}p/{result['events_staged']}e, "
                f"transformed {result['events_transformed']}, metrics {result['metrics_computed']}")
    return result
