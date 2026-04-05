# Planty

Planty is a smart plant care app that learns how you water your plants and adjusts schedules over time. It uses a Q-learning agent per plant to adapt watering intervals based on your feedback, live weather, and season. A separate backend runs ETL pipelines to compute health scores and track care history across your whole collection.

## How it works

When you water a plant and leave feedback (happy, sad, overwatered), Planty's RL agent updates that plant's watering interval. Weather data from Open-Meteo shifts intervals up or down based on temperature and humidity. A backend ETL pipeline runs every 5 minutes, staging raw data, computing per-event metrics, and rolling up health scores per plant.

## Stack

**Frontend** — self-contained HTML/CSS/JS, no framework. Vite for local dev.

**Backend** — Python with FastAPI and SQLite. APScheduler runs the ETL pipeline every 5 minutes.

## Project structure

```
frontend/
  index.html        full app — all logic in one file
  vite.config.ts    dev server with /api proxy to :3001

backend/
  main.py           FastAPI app, startup, CORS, scheduler
  db.py             SQLite connection, WAL mode, schema init
  models.py         Pydantic request models
  pipelines/
    ingestion.py    upsert raw plants + events from frontend
    transform.py    compute days_overdue, was_on_time per event
    aggregation.py  roll up health scores per plant
    runner.py       orchestrate all three layers, write audit log
  routes/
    plants.py       CRUD + sync
    events.py       care event ingestion
    analytics.py    summary, trends, export, pipeline trigger
  requirements.txt
```

## ETL pipeline

Runs every 5 minutes via APScheduler. Three layers:

| Layer | What it does |
|---|---|
| Staging | Upserts raw plant and event data sent from the frontend |
| Transform | Enriches each event with `days_overdue` and `was_on_time` |
| Aggregate | Computes health score per plant: compliance×0.4 + timeliness×0.3 + feedback×0.3 |

Every run is logged to `pipeline_runs` with record counts and any errors.

## Reinforcement learning

Each plant has its own Q-learning agent stored in localStorage:

- **State** — `{days_since_water}_{interval_bucket}_{season}_{temp_band}`
- **Actions** — shift interval by −2, −1, 0, +1, or +2 days
- **Rewards** — +10 watered on time, +5 happy feedback, −8 overwatered, −10 skipped
- **Exploration** — ε-greedy, decays from 0.3 to 0.05 over time
- **Season scaling** — summer ×1.4, winter ×0.6

## Running locally

```bash
# frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173

# backend
cd backend && pip3 install -r requirements.txt
uvicorn main:app --reload --port 3001
# → http://localhost:3001

# both together from root
npm install && npm start
```

## API

| Method | Path | Description |
|---|---|---|
| POST | `/api/plants/sync` | Upsert plants from frontend |
| POST | `/api/events/sync` | Ingest care events |
| GET | `/api/plants` | List plants with latest health metrics |
| GET | `/api/analytics/summary` | Health score, compliance rate, overdue count |
| GET | `/api/analytics/trends` | Weekly event counts and health time series |
| POST | `/api/analytics/run-pipeline` | Manually trigger ETL |
| GET | `/api/analytics/export` | Full JSON data dump |
| GET | `/api/analytics/pipeline-runs` | ETL audit log |
