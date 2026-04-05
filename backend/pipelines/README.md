# backend/pipelines/

A 3-layer ETL pipeline. Runs automatically every 5 minutes via APScheduler. Can also be triggered on demand via `POST /api/analytics/run-pipeline`. Every run — scheduled or manual — is logged to the `pipeline_runs` table.

---

## Layers

```
events_raw (staging)
       │
       ▼  transform.py
care_events (enriched)
       │
       ▼  aggregation.py
plant_health_metrics (scores)
```

---

## ingestion.py

Receives lists of plant and event dicts from the frontend sync endpoints and writes them into the staging tables (`plants_raw`, `events_raw`).

Both writes use `INSERT ... ON CONFLICT(id) DO UPDATE SET ...`, so syncing the same record twice is always safe. For events, only `completed` and `feedback` are updated on conflict — the original scheduled time is never overwritten. All writes for a given sync call are wrapped in a single transaction; if anything fails, the whole batch is rolled back.

Returns a `(plants_count, events_count)` tuple which the runner logs to `pipeline_runs`.

---

## transform.py

Picks up every row in `events_raw` that has a `completed` timestamp but does not yet exist in `care_events` (left join on `c.id IS NULL`). This means the transform layer is incremental — it only processes new completions, never re-processes rows it has already handled.

For each new completion it computes:

**`days_overdue`**
```
days_overdue = (completed_datetime - scheduled_datetime).total_seconds() / 86400
```
A negative value means the plant was watered early. A positive value means it was watered late. Stored as a float rounded to 2 decimal places.

**`was_on_time`**
```
was_on_time = 1  if days_overdue <= 1
            = 0  otherwise
```
A 1-day grace period is applied — watering up to one day late still counts as on-time.

The enriched record is inserted into `care_events` with `INSERT OR IGNORE`, so if the transform somehow runs twice on the same event, the second run is a no-op.

---

## aggregation.py

Reads all completed events from `care_events` for each plant and computes a health score. A new row is appended to `plant_health_metrics` on every run, so the full history of score changes is retained.

**Health score formula:**
```
compliance = completed_events / total_events          (weight: 0.4)
timeliness = on_time_events   / total_events          (weight: 0.3)
feedback   = average feedback score                   (weight: 0.3)

health_score = compliance × 0.4 + timeliness × 0.3 + feedback × 0.3
```

**Feedback scoring:**
| Feedback value | Score |
|---|---|
| `happy` | 1.0 |
| `sad` | 0.3 |
| `overwatered` | 0.0 |
| no feedback | 0.5 (neutral) |

Plants with zero completed events are skipped — they have no data to score.

---

## runner.py

Orchestrates the three layers in order and writes an audit log entry to `pipeline_runs`.

1. Inserts a `pipeline_runs` row with `status = 'running'` and captures the `run_id`
2. Calls `ingestion.run()` if plant or event data was passed in (sync-triggered runs)
3. Calls `transform.run()`
4. Calls `aggregation.run()`
5. Updates the `pipeline_runs` row with `status`, record counts, finish time, and any error message

If any layer raises an exception, the error is caught, written to `pipeline_runs.error`, and the function returns with `status = 'error'` rather than crashing the server. The APScheduler job continues running on its 5-minute interval regardless.
