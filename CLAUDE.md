# CLAUDE.md

Planty — smart plant care PWA. Adaptive watering schedule, weather-aware, offline-first. Single `index.html` frontend + FastAPI backend.

## Session Start

**Always run `/graphify` at the start of every session** to load the knowledge graph from `graphify-out/graph.json`. This provides full project context without needing to re-read all files. Use `/graphify query "<question>"` to answer codebase questions from the graph.

## Build & Run

```bash
npm run install:frontend   # npm install in frontend/
npm run install:backend    # pip install backend requirements
npm start                  # concurrently: vite dev + uvicorn backend
```

## Test

```bash
python3 -m pytest backend/tests/test_routes.py -q
```

## Deploy

Push to `master` → Render auto-deploys from GitHub. Live: https://planty-fsyt.onrender.com

## Architecture

- **frontend/** — 3200-line `index.html` PWA, vanilla JS, localStorage state, external `species.js` + `diagnosis.js`
- **backend/** — FastAPI + SQLite (WAL mode), APScheduler ETL every 5 min
- **pipelines/** — ingestion → transform → aggregation
- **routes/** — plants, events, analytics, health
- **models.py** — Pydantic v2 with field validators

## Agent skills

### Issue tracker

GitHub Issues on `iamvishalsehgal/Planty`. Uses `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.