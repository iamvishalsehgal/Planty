# Planty

Smart plant care that tracks watering schedules, learns from your habits, and adapts to weather conditions.

**Live demo:** https://planty-26os.onrender.com

---

## What it does

You add your plants, tell Planty how often you water each one, and tap "Water" whenever you actually do it. Over time the app calculates your real watering rhythm using a weighted moving average across your watering history, then adjusts each plant's schedule automatically. It also pulls live weather from Open-Meteo and scales intervals by season — plants get watered more often in summer heat and less in winter.

When a plant dies you record the cause (overwatering, underwatering, or unknown). If you add the same plant again later, Planty recognises it, shows you what went wrong last time, and proposes a corrected interval upfront so history doesn't repeat itself.

The backend collects all of that data, runs a 3-layer ETL pipeline on a 5-minute schedule, and computes a health score per plant based on compliance, timeliness, and watering feedback.

---

## Project structure

```
planty/
├── frontend/                   # Single-page app (vanilla HTML/CSS/JS + Vite)
│   ├── index.html              # Entire UI — all JS and CSS live in this one file
│   ├── vite.config.ts          # Dev server config, proxies /api/* to backend :3001
│   └── package.json
│
├── backend/                    # Python API server
│   ├── main.py                 # FastAPI app, CORS, APScheduler startup
│   ├── db.py                   # SQLite connection (WAL mode), schema creation
│   ├── models.py               # Pydantic request models
│   ├── requirements.txt        # fastapi, uvicorn, apscheduler, aiofiles
│   ├── planty.db               # SQLite database (created on first run)
│   ├── pipelines/              # ETL pipeline — 3 layers
│   │   ├── ingestion.py        # Upsert raw plant + event data from frontend
│   │   ├── transform.py        # Enrich events with days_overdue, was_on_time
│   │   ├── aggregation.py      # Compute per-plant health scores
│   │   └── runner.py           # Orchestrates layers, writes audit log
│   └── routes/                 # FastAPI route handlers
│       ├── plants.py           # POST /api/plants/sync, GET /api/plants
│       ├── events.py           # POST /api/events/sync
│       └── analytics.py        # GET /api/analytics/*
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # Deploys frontend/ to GitHub Pages on push to master
│
├── render.yaml                 # Render.com service config for backend
└── package.json                # Root scripts to run both services together
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML, CSS, JavaScript — no framework |
| Frontend build tool | Vite 7 |
| Backend | Python 3, FastAPI 0.115 |
| Database | SQLite (file: `backend/planty.db`) |
| Background scheduler | APScheduler 3.10 — ETL runs every 5 minutes |
| Deployment (backend) | Render.com free tier |
| Deployment (frontend) | GitHub Pages via GitHub Actions |

---

## Running locally

### Prerequisites

- Node.js 18+
- Python 3.11+

### Install dependencies

```bash
# From the project root
npm install                   # installs concurrently
npm run install:frontend      # cd frontend && npm install
npm run install:backend       # cd backend && pip3 install -r requirements.txt
```

### Start both services at once

```bash
npm start
```

This runs Vite on http://localhost:5173 and uvicorn on http://localhost:3001 concurrently. Vite proxies all `/api/*` requests to the backend so there are no CORS issues in development.

### Start them separately

```bash
# Terminal 1 — backend
npm run dev:backend
# equivalent: cd backend && uvicorn main:app --reload --port 3001

# Terminal 2 — frontend
npm run dev:frontend
# equivalent: cd frontend && npm run dev
```

---

## Deployment

### Backend — Render.com

`render.yaml` at the project root configures a Python web service on Render's free tier.

- **Build command:** `pip install -r backend/requirements.txt`
- **Start command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

The backend also serves `frontend/index.html` as a catch-all for non-API routes, so the full app works from the Render URL without needing GitHub Pages.

To deploy: connect the GitHub repo to Render — it picks up `render.yaml` automatically.

### Frontend — GitHub Pages

Pushes to `master` trigger `.github/workflows/deploy.yml`, which uploads the `frontend/` directory directly to GitHub Pages. No build step is needed because `index.html` is fully self-contained.

See [`.github/workflows/README.md`](.github/workflows/README.md) for step-by-step setup instructions.

---

## Keeping the backend awake (UptimeRobot)

Render's free tier spins a service down after 15 minutes of inactivity, causing a cold-start delay on the next request. To prevent this, set up a free UptimeRobot monitor that pings the service every 5 minutes.

1. Sign up at https://uptimerobot.com (free account)
2. Create a new **HTTP(S)** monitor
3. Set the URL to your Render service URL (e.g. `https://planty-26os.onrender.com`)
4. Set the check interval to **5 minutes**
5. Save — the pings will keep the service warm

---

## Subfolder documentation

- [frontend/README.md](frontend/README.md) — UI structure, all 4 tabs, adaptive scheduling, localStorage data model
- [backend/README.md](backend/README.md) — API endpoints, database schema, how to run
- [backend/pipelines/README.md](backend/pipelines/README.md) — ETL pipeline detail, health score formula
- [backend/routes/README.md](backend/routes/README.md) — Every API endpoint with request/response shapes and examples
- [.github/workflows/README.md](.github/workflows/README.md) — GitHub Pages deployment setup
