# Planty

**Live:** https://planty-26os.onrender.com

Planty is a plant care app that tracks your watering history and gets smarter over time. It learns your actual watering rhythm per plant, factors in live weather and season, and adjusts each plant's schedule automatically. When a plant dies, it records the cause and uses that history to suggest a corrected interval if you ever grow the same plant again.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  frontend/index.html                                │
│  ├── Adaptive scheduler (weighted moving average)   │
│  ├── Environment scaling (weather + season)         │
│  ├── Plant state (localStorage)                     │
│  └── Push notifications (Service Worker)            │
│                         │                           │
│                    /api/* requests                  │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│              backend/main.py (FastAPI)               │
│                                                     │
│  Routes                                             │
│  ├── /api/plants/sync   — receive plant data        │
│  ├── /api/events/sync   — receive watering events   │
│  └── /api/analytics/*   — health scores, trends     │
│                                                     │
│  ETL Pipeline (runs every 5 minutes)                │
│  ├── Ingestion  — stage raw data from frontend      │
│  ├── Transform  — compute days_overdue, was_on_time │
│  └── Aggregation — health score per plant           │
│                                                     │
│  SQLite (planty.db)                                 │
│  ├── plants_raw / events_raw   — staging tables     │
│  ├── care_events               — enriched events    │
│  ├── plant_health_metrics      — computed scores    │
│  └── pipeline_runs             — ETL audit log      │
└─────────────────────────────────────────────────────┘
```

---

## How the pieces connect

The frontend is fully self-contained. All plant state, watering history, and schedule logic live in the browser (localStorage). The app works completely offline or without the backend.

When a user waters a plant, the frontend syncs that event to the backend via `/api/events/sync`. The backend's ETL pipeline then picks it up, enriches it (was it on time? how many days overdue?), and rolls up a health score for that plant. Those health scores are available via `/api/analytics/summary` and displayed in the Schedule tab.

The backend also serves `frontend/index.html` as a catch-all, so the full app runs from a single Render URL with no separate frontend deployment needed.

---

## Components

| Component | What it does |
|---|---|
| `frontend/index.html` | The entire UI — adaptive scheduler, watering logic, plant state, notifications |
| `backend/main.py` | FastAPI app entry point, CORS, startup, APScheduler, serves frontend |
| `backend/db.py` | SQLite connection in WAL mode, schema for all 6 tables |
| `backend/models.py` | Pydantic models that validate incoming sync payloads |
| `backend/pipelines/` | 3-layer ETL — ingestion, transform, aggregation |
| `backend/routes/` | REST API handlers for plants, events, analytics |
| `frontend/sw.js` | Service Worker — delivers browser notifications for plants due for water |
| `render.yaml` | Render.com deployment config — one service, frontend + backend together |
| `.github/workflows/deploy.yml` | Deploys frontend-only to GitHub Pages on every push to master |

---

## Data flow

```
User waters a plant
       │
       ▼
frontend records event in localStorage
       │
       ▼
frontend POSTs to /api/events/sync
       │
       ▼
ingestion.py upserts into events_raw
       │
       ▼  (every 5 min via APScheduler)
transform.py computes days_overdue + was_on_time → care_events
       │
       ▼
aggregation.py computes health_score per plant → plant_health_metrics
       │
       ▼
GET /api/analytics/summary returns scores to frontend
```

---

## Subfolder docs

- [frontend/README.md](frontend/README.md) — adaptive scheduling algorithm, all 4 tabs, notification system, localStorage model
- [backend/README.md](backend/README.md) — database schema, API endpoints, how FastAPI serves the frontend
- [backend/pipelines/README.md](backend/pipelines/README.md) — ETL pipeline detail, health score formula, audit log
- [backend/routes/README.md](backend/routes/README.md) — every endpoint with request/response shapes
- [.github/workflows/README.md](.github/workflows/README.md) — GitHub Pages deployment
