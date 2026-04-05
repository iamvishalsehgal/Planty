# backend/ — Technical Reference

## Stack

| | |
|---|---|
| Framework | FastAPI 0.115 |
| Server | Uvicorn with standard extras (websockets, httptools) |
| Database | SQLite via Python's built-in `sqlite3` module, WAL mode |
| Scheduler | APScheduler 3.10 — `BackgroundScheduler` |
| File serving | `aiofiles` 23.2.1 for async `FileResponse` |

---

## main.py

Registers three APIRouters (`plants`, `events`, `analytics`) all under `/api/`. CORS middleware is set to `allow_origins=["*"]` so the app works from any deployment URL including GitHub Pages and Render.

On the `startup` event:
1. `init_db()` — creates all 6 tables with `CREATE TABLE IF NOT EXISTS`
2. `BackgroundScheduler` is started with one job: `run_pipeline` on a 5-minute interval

Two catch-all routes serve `frontend/index.html`:
- `GET /` → `FileResponse(FRONTEND / "index.html")`
- `GET /{full_path:path}` → same

These are registered after the API routers so `/api/*` paths match first and are never caught by the fallback. `FRONTEND` is resolved as `Path(__file__).parent.parent / "frontend"`, which works whether the server is run from the repo root or the `backend/` directory.

---

## db.py

```python
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row
conn.execute("PRAGMA journal_mode = WAL")
conn.execute("PRAGMA foreign_keys = ON")
```

`check_same_thread=False` is required because FastAPI handles requests across threads. `row_factory = sqlite3.Row` makes all query results addressable by column name. WAL mode allows concurrent reads during a write transaction, which matters when the ETL pipeline and an API request happen simultaneously.

`DB_PATH` is resolved relative to the file (`Path(__file__).parent / "planty.db"`), so the database is always created inside the `backend/` directory regardless of where uvicorn is invoked from.

---

## models.py

Pydantic v2 models used as FastAPI request body types. FastAPI validates incoming JSON against these automatically and returns HTTP 422 if any required field is missing or the wrong type.

```python
class PlantIn(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    interval: int
    lastWatered: Optional[str] = None
    isDead: Optional[bool] = False

class EventIn(BaseModel):
    id: str
    plantId: str
    eventType: str
    scheduled: str
    completed: Optional[str] = None
    feedback: Optional[str] = None
```

Field names match the frontend's camelCase payload. The pipeline layers receive plain dicts (via `.model_dump()`), not Pydantic objects.

---

## Database schema

### plants_raw
Staging table. Upserted from the frontend on every sync.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID from frontend |
| name | TEXT NOT NULL | |
| location | TEXT | nullable |
| interval | INTEGER NOT NULL | current watering interval in days |
| last_watered | TEXT | ISO 8601 timestamp, nullable |
| is_dead | INTEGER | 0 = alive, 1 = dead |
| synced_at | TEXT NOT NULL | UTC ISO timestamp of last sync |

### events_raw
Staging table. On conflict, only `completed`, `feedback`, and `synced_at` are updated — `scheduled` is immutable.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID from frontend |
| plant_id | TEXT NOT NULL | references plants_raw.id |
| event_type | TEXT NOT NULL | e.g. `water` |
| scheduled | TEXT NOT NULL | when watering was due |
| completed | TEXT | when it was done, nullable |
| feedback | TEXT | `happy` / `sad` / `overwatered`, nullable |
| synced_at | TEXT NOT NULL | |

### care_events
Enriched events. Written by `transform.py`. Only completed events appear here.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | same as events_raw.id |
| plant_id | TEXT NOT NULL | |
| event_type | TEXT NOT NULL | |
| scheduled | TEXT NOT NULL | |
| completed | TEXT | |
| feedback | TEXT | |
| days_overdue | REAL | `(completed - scheduled)` in fractional days |
| was_on_time | INTEGER | 1 if days_overdue ≤ 1, else 0 |
| processed_at | TEXT NOT NULL | when transform ran |

### plant_health_metrics
One row appended per plant per pipeline run. Query for latest with `MAX(computed_at)`.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| plant_id | TEXT NOT NULL | |
| computed_at | TEXT NOT NULL | UTC ISO timestamp |
| health_score | REAL | 0.0–1.0 |
| compliance_rate | REAL | completed / total |
| avg_days_overdue | REAL | |
| total_events | INTEGER | |
| completed_events | INTEGER | |

### weather_snapshots
Schema exists, not currently written to. Reserved for future server-side weather logging.

### pipeline_runs
Audit log. One row per ETL execution.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| started_at | TEXT NOT NULL | |
| finished_at | TEXT | null while running |
| status | TEXT | `running` → `success` or `error` |
| plants_staged | INTEGER | |
| events_staged | INTEGER | |
| events_transformed | INTEGER | |
| metrics_computed | INTEGER | |
| error | TEXT | exception message if status = error |
