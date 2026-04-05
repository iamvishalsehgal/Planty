# Pipelines

A 3-layer ETL pipeline that transforms raw frontend data into enriched care events and per-plant health metrics. It runs automatically every 5 minutes via APScheduler and can also be triggered on demand via the API.

---

## Architecture overview

```
Frontend sync
      │
      ▼
┌─────────────┐
│  Staging    │  ingestion.py — upserts raw data into plants_raw and events_raw
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Transform  │  transform.py — enriches completed events with timing metrics
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Aggregate  │  aggregation.py — computes health score per plant
└─────────────┘
       │
       ▼
  pipeline_runs  (audit log written by runner.py)
```

---

## Layer 1 — Staging (`ingestion.py`)

Receives plant and event arrays (Python dicts) and upserts them into the raw tables in a single transaction.

**Plants** — upserted into `plants_raw`. On conflict (same `id`), all columns are overwritten with the incoming values. This means if a plant's name, location, interval, or dead status changes in the app, the next sync will update the record.

**Events** — upserted into `events_raw`. On conflict (same `id`), only `completed`, `feedback`, and `synced_at` are updated. The `scheduled` date and `plant_id` are never overwritten — they're set once and treated as immutable.

Both upserts happen inside a single `BEGIN / COMMIT` block. If anything fails, a `ROLLBACK` is issued before re-raising the exception.

Returns `(plants_count, events_count)` — the number of rows touched in each table.

---

## Layer 2 — Transform (`transform.py`)

Picks up events that exist in `events_raw` but not yet in `care_events`, and that have a non-NULL `completed` timestamp. For each one it computes:

**`days_overdue`**

```python
days_overdue = (completed - scheduled).total_seconds() / 86400
```

A positive value means the watering happened late. A negative value means it was done early. Stored rounded to 2 decimal places.

**`was_on_time`**

```python
was_on_time = 1 if days_overdue <= 1 else 0
```

Events watered within 1 day of the scheduled date count as on-time. This 1-day grace window accounts for normal variation (e.g. watering in the evening instead of the morning).

Both values are written to `care_events` alongside the original event data. The transform is idempotent — it uses `INSERT OR IGNORE` so rerunning it on already-processed events does nothing.

Returns the count of events newly written to `care_events`.

---

## Layer 3 — Aggregation (`aggregation.py`)

Iterates over every plant in `plants_raw` and computes a health score from all of that plant's rows in `care_events`.

Plants with no events in `care_events` are skipped entirely (no row is written for them).

### Health score formula

```
health_score = compliance × 0.4 + timeliness × 0.3 + feedback × 0.3
```

**Compliance** (`compliance_rate`): fraction of care events that were completed. Because the transform layer only processes completed events, all rows in `care_events` are completed — so `compliance = total / total = 1.0` in the current setup. This field is reserved for future support of skipped/cancelled events.

**Timeliness**: fraction of events where `was_on_time = 1`.

**Feedback**: average score across events that have feedback. Only events with non-NULL feedback are included in the average. Scoring:
| Feedback value | Score |
|----------------|-------|
| `"happy"` | 1.0 |
| `"sad"` | 0.3 |
| `"overwatered"` | 0.0 |

If no events have feedback at all, the feedback component defaults to 0.5 (neutral).

The resulting `health_score` is a value between 0 and 1, stored rounded to 4 decimal places.

A new row is appended to `plant_health_metrics` every time the aggregation runs (it does not update in place), so you get a time series of health scores for each plant.

Returns the count of metric rows written.

---

## Orchestration (`runner.py`)

`run_pipeline(plants=None, events=None)` is the single entry point used by all callers — the scheduler, the sync routes, and the manual trigger endpoint.

**Flow:**

1. Insert a row into `pipeline_runs` with `status = "running"` and capture the `run_id`.
2. If `plants` or `events` were passed in, call `ingestion.run(plants, events)`.
3. Call `transform.run()` unconditionally.
4. Call `aggregation.run()` unconditionally.
5. Update the `pipeline_runs` row with final counts, status (`"success"` or `"error"`), and a finish timestamp.

Steps 3 and 4 always run even on a scheduled tick with no new data — this ensures that if a previous run left partially processed events (e.g. due to a crash), they'll be picked up on the next run.

If any layer raises an exception, `result["status"]` is set to `"error"` and the exception message is stored in `result["error"]`. The audit log is updated regardless of success or failure.

Returns a dict:
```python
{
    "plants_staged": int,
    "events_staged": int,
    "events_transformed": int,
    "metrics_computed": int,
    "status": "success" | "error",
    "error": str | None
}
```

---

## APScheduler

Started in `main.py` on FastAPI startup:

```python
scheduler = BackgroundScheduler()
scheduler.add_job(run_pipeline, "interval", minutes=5, id="etl")
scheduler.start()
```

`BackgroundScheduler` runs in a daemon thread alongside the ASGI server. The job ID is `"etl"`. On the free Render tier, the first scheduled run fires 5 minutes after the service starts.

---

## `pipeline_runs` table schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `started_at` | TEXT | UTC ISO 8601 timestamp |
| `finished_at` | TEXT | UTC ISO 8601 timestamp, NULL while in progress |
| `status` | TEXT | `"running"` → `"success"` or `"error"` |
| `plants_staged` | INTEGER | Rows touched in `plants_raw` |
| `events_staged` | INTEGER | Rows touched in `events_raw` |
| `events_transformed` | INTEGER | New rows written to `care_events` |
| `metrics_computed` | INTEGER | New rows written to `plant_health_metrics` |
| `error` | TEXT | Exception message on failure, NULL on success |

Query the last 50 runs via `GET /api/analytics/pipeline-runs`.
