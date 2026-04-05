# PlantCare AI

An intelligent plant care scheduler with reinforcement learning and a data engineering backend. The RL agent learns your watering patterns per-plant and adapts schedules to live weather and seasonal conditions. A separate backend runs ETL pipelines to compute health scores and analytics across your garden.

## Architecture

```
frontend/          React + TypeScript (Vite)
  src/
    lib/
      rlAgent.ts   Q-learning scheduler per plant
      weather.ts   Open-Meteo integration
      storage.ts   localStorage persistence
      api.ts       Backend API client
backend/           Express + Node built-in SQLite
  src/
    db/db.ts       Schema init (WAL mode)
    pipelines/
      ingestionPipeline.ts    Stage raw data
      transformPipeline.ts    Enrich events (days_overdue, was_on_time)
      aggregationPipeline.ts  Compute health scores
      pipelineRunner.ts       ETL orchestrator + audit log
    routes/
      plants.ts    CRUD + sync endpoint
      events.ts    Care event ingestion
      analytics.ts Summary, trends, export, pipeline trigger
```

## Data Engineering Pipeline

The backend implements a 3-layer data warehouse pattern that runs every 5 minutes:

| Layer | Tables | What it computes |
|---|---|---|
| Staging | `plants_raw`, `events_raw` | Raw upserted data from frontend |
| Transform | `care_events` | `days_overdue`, `was_on_time` per event |
| Aggregate | `plant_health_metrics` | Health score = compliance×0.4 + timeliness×0.3 + feedback×0.3 |
| Audit | `pipeline_runs` | Run history with record counts and errors |

## Reinforcement Learning

Each plant has an independent Q-learning agent with:

- **State**: `{days_since_water}_{interval_category}_{season}_{temp_band}`
- **Actions**: adjust interval by −2, −1, 0, +1, +2 days
- **Rewards**: +10 completed, +5 happy feedback, −8 overwatered, −10 skipped
- **Exploration**: ε-greedy with decay (0.3 → 0.05)
- **Seasonal multipliers**: summer ×1.4 water, winter ×0.6 water

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm run dev       # http://localhost:3001
```

Or run both together from the root:
```bash
npm install       # installs concurrently
npm start
```

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/plants/sync` | Ingest/upsert plants from frontend |
| POST | `/api/events/sync` | Ingest care events |
| GET | `/api/plants` | List plants with latest health metrics |
| GET | `/api/analytics/summary` | KPIs: health score, compliance, overdue count |
| GET | `/api/analytics/trends` | Weekly event counts + health time series |
| POST | `/api/analytics/run-pipeline` | Manually trigger full ETL |
| GET | `/api/analytics/export` | Full JSON data export |
| GET | `/api/analytics/pipeline-runs` | ETL audit log |

## Dev Server Config

Both servers are configured in `.claude/launch.json` for one-click startup.
