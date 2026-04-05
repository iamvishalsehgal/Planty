# backend/pipelines/ — Technical Reference

## Overview

3-layer ETL pipeline. Triggered by APScheduler every 5 minutes and also inline by the sync routes on every plant or event write. All three layers run sequentially inside `runner.run_pipeline()`. Each layer is idempotent — running it multiple times produces the same result.

---

## ingestion.py

**Input:** Lists of plant dicts and event dicts from the frontend sync endpoints.

**Output:** `(plants_count, events_count)` tuple.

**Behaviour:**

Both tables use `ON CONFLICT(id) DO UPDATE SET ...`. For `plants_raw`, all mutable fields are updated. For `events_raw`, only `completed`, `feedback`, and `synced_at` are updated on conflict — `scheduled` is never overwritten because it represents when the watering was originally due.

All inserts for a given call run inside a single `BEGIN / COMMIT` block. Any exception triggers `ROLLBACK` before re-raising.

---

## transform.py

**Input:** Rows in `events_raw` where `completed IS NOT NULL` and no matching row exists in `care_events` (incremental — processes only new completions).

**Query:**
```sql
SELECT e.*
FROM events_raw e
LEFT JOIN care_events c ON c.id = e.id
WHERE c.id IS NULL
  AND e.completed IS NOT NULL
```

**Computed fields:**

`days_overdue`:
```python
days_overdue = (completed_datetime - scheduled_datetime).total_seconds() / 86400
```
Negative = early, positive = late. Stored as REAL rounded to 2dp.

`was_on_time`:
```python
was_on_time = 1 if days_overdue <= 1 else 0
```
1-day grace period — watering up to 24 hours late counts as on time.

**Output:** Count of rows written to `care_events`. Uses `INSERT OR IGNORE` so if somehow called twice on the same event it is a no-op.

---

## aggregation.py

**Input:** All rows in `care_events` for each plant in `plants_raw`.

**Health score formula:**
```
compliance = completed_events / total_events

timeliness = on_time_events / total_events

feedback_score per event:
    happy        → 1.0
    sad          → 0.3
    overwatered  → 0.0
    no feedback  → not included in average

feedback = mean(feedback_scores) if any feedback exists else 0.5

health_score = (compliance × 0.4) + (timeliness × 0.3) + (feedback × 0.3)
```

Result is a float 0.0–1.0, stored rounded to 4dp.

Plants with zero events are skipped entirely — they produce no row in `plant_health_metrics`.

A new row is appended on every run (not upserted), so the full score history is preserved and queryable over time.

**Output:** Count of plants scored.

---

## runner.py

Orchestrates all three layers. Called by APScheduler and directly by route handlers.

**Execution flow:**
1. Insert row into `pipeline_runs` with `status = 'running'`, capture `run_id` (lastrowid)
2. If `plants` or `events` args are non-None, call `ingestion.run(plants, events)`
3. Call `transform.run()`
4. Call `aggregation.run()`
5. Update `pipeline_runs` row: set `finished_at`, `status`, all count fields, and `error`

**Error handling:** Any exception from any layer is caught, its message stored in `pipeline_runs.error`, and `status` set to `'error'`. The function returns the result dict rather than raising, so the APScheduler job keeps running on its next tick.

**Signature:**
```python
def run_pipeline(plants: list[dict] = None, events: list[dict] = None) -> dict
```

When called by the scheduler (no arguments), ingestion is skipped — only transform and aggregation run against whatever is already in the staging tables.
