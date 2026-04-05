# Backend

A FastAPI server that receives plant and care event data from the frontend, runs a 3-layer ETL pipeline on a 5-minute schedule, and exposes analytics endpoints for querying health scores and trends.

---

## Tech

| Dependency | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115.0 | HTTP framework, request validation, routing |
| uvicorn | 0.30.6 | ASGI server |
| APScheduler | 3.10.4 | Background job scheduler (ETL every 5 min) |
| aiofiles | 23.2.1 | Async file I/O support |
| SQLite | built-in | Persistent storage (`planty.db`) |

No ORM — all queries are raw SQL with `sqlite3` from the standard library.

---

## Folder structure

```
backend/
├── main.py           Entry point. Creates the FastAPI app, registers routers,
│                     starts APScheduler on startup, serves frontend/index.html
│                     as a catch-all for non-API routes.
│
├── db.py             get_conn() returns a sqlite3 connection with WAL journal mode
│                     and foreign keys enabled. init_db() creates all 6 tables if
│                     they don't already exist.
│
├── models.py         Pydantic models for request bodies:
│                       PlantIn, EventIn, SyncPlantsRequest, SyncEventsRequest
│
├── requirements.txt  fastapi, uvicorn[standard], apscheduler, aiofiles
│
├── planty.db         SQLite database file (created on first run)
│
├── pipelines/        3-layer ETL pipeline — see pipelines/README.md
│   ├── ingestion.py
│   ├── transform.py
│   ├── aggregation.py
│   └── runner.py
│
└── routes/           FastAPI route handlers — see routes/README.md
    ├── plants.py
    ├── events.py
    └── analytics.py
```

---

## Database schema

Six tables, all created by `init_db()` in `db.py`.

### `plants_raw`

Raw plant data synced from the frontend. One row per plant, upserted on each sync.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Client-generated ID (Date.now() from the frontend) |
| `name` | TEXT | Plant name |
| `location` | TEXT | Optional location label |
| `interval` | INTEGER | Watering interval in days (as set by the user) |
| `last_watered` | TEXT | ISO 8601 timestamp of the last watering, or NULL |
| `is_dead` | INTEGER | 0 = alive, 1 = dead |
| `synced_at` | TEXT | UTC timestamp of the most recent sync |

### `events_raw`

Raw care events (waterings) synced from the frontend. One row per event, upserted on each sync.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Client-generated event ID |
| `plant_id` | TEXT | References `plants_raw.id` |
| `event_type` | TEXT | e.g. `"watering"` |
| `scheduled` | TEXT | ISO 8601 — when the watering was due |
| `completed` | TEXT | ISO 8601 — when it was actually done, or NULL |
| `feedback` | TEXT | `"happy"`, `"sad"`, `"overwatered"`, or NULL |
| `synced_at` | TEXT | UTC timestamp of the most recent sync |

On conflict (same `id`), only `completed`, `feedback`, and `synced_at` are updated — the scheduled date and plant association are immutable.

### `weather_snapshots`

Available for storing weather captures (schema created, not currently written to by any route).

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `captured_at` | TEXT | UTC timestamp |
| `temp_c` | REAL | Temperature in Celsius |
| `humidity` | REAL | Relative humidity |
| `condition` | TEXT | Weather condition string |

### `care_events`

Transformed events — populated by `pipelines/transform.py`. Each row is a completed event enriched with timing metrics.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Same ID as `events_raw.id` |
| `plant_id` | TEXT | |
| `event_type` | TEXT | |
| `scheduled` | TEXT | |
| `completed` | TEXT | |
| `feedback` | TEXT | |
| `days_overdue` | REAL | `(completed - scheduled)` in days; negative = early |
| `was_on_time` | INTEGER | 1 if `days_overdue <= 1`, else 0 |
| `processed_at` | TEXT | UTC timestamp when the transform ran |

### `plant_health_metrics`

One row per pipeline run per plant. Populated by `pipelines/aggregation.py`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `plant_id` | TEXT | |
| `computed_at` | TEXT | UTC timestamp of this computation |
| `health_score` | REAL | 0–1 composite score |
| `compliance_rate` | REAL | Fraction of events completed |
| `avg_days_overdue` | REAL | Average days late across all events |
| `total_events` | INTEGER | |
| `completed_events` | INTEGER | |

The `GET /api/plants` endpoint joins each plant against the most recent row for that plant.

### `pipeline_runs`

Audit log. One row per ETL run, written by `pipelines/runner.py`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `started_at` | TEXT | UTC timestamp |
| `finished_at` | TEXT | UTC timestamp, NULL while running |
| `status` | TEXT | `"running"` → `"success"` or `"error"` |
| `plants_staged` | INTEGER | Records upserted into `plants_raw` |
| `events_staged` | INTEGER | Records upserted into `events_raw` |
| `events_transformed` | INTEGER | Records written to `care_events` |
| `metrics_computed` | INTEGER | Records written to `plant_health_metrics` |
| `error` | TEXT | Exception message if the run failed, else NULL |

---

## Running locally

```bash
cd backend
pip3 install -r requirements.txt
uvicorn main:app --reload --port 3001
```

The server starts at http://localhost:3001. Interactive API docs are at http://localhost:3001/docs.

On startup, `init_db()` creates `planty.db` in the `backend/` directory if it doesn't exist, and the APScheduler starts the ETL pipeline on a 5-minute interval.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/plants/sync` | Upsert a batch of plants from the frontend |
| GET | `/api/plants` | List all plants with their latest health metrics |
| POST | `/api/events/sync` | Upsert a batch of care events from the frontend |
| GET | `/api/analytics/summary` | Aggregate stats across all plants |
| GET | `/api/analytics/trends` | Daily event counts for the last 28 days |
| POST | `/api/analytics/run-pipeline` | Manually trigger the ETL pipeline |
| GET | `/api/analytics/export` | Full JSON dump of all three data tables |
| GET | `/api/analytics/pipeline-runs` | Last 50 ETL audit log entries |

Full request/response details are in [routes/README.md](routes/README.md).

---

## ETL pipeline

See [pipelines/README.md](pipelines/README.md) for a full breakdown of each layer, the health score formula, and the audit log schema.
