# CLAUDE.md

Planty v3 — smart plant care web app. React + Vite + Tailwind CSS. FastAPI backend optional.

## Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS, React Router v7
- **State**: Zustand v5 + localStorage
- **Styling**: Tailwind with custom design tokens (sage, soil, sky, clay, cream)
- **Backend**: FastAPI + SQLite (local) / PostgreSQL (production)
- **Deploy**: GitHub Pages (frontend), any PostgreSQL host (backend optional)
- **Weather**: Open-Meteo free API (no key)

## Build & Run

```bash
npm install                     # Frontend deps
npm run dev                     # Vite dev server → localhost:5173
npm run build                   # Production build → dist/

# Backend (optional)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload       # API → localhost:8000
```

## Test

```bash
# Frontend build check
npm run build

# Backend (29 tests)
cd backend && source .venv/bin/activate && python3 -m pytest tests/ -v
```

## Project Structure

```
planty/
├── index.html              # SPA entry
├── vite.config.js          # Vite config + path aliases
├── tailwind.config.js      # Design tokens
├── src/
│   ├── main.jsx            # React entry + SW registration
│   ├── App.jsx             # Router (HashRouter)
│   ├── index.css           # Tailwind + custom CSS + dark mode
│   ├── pages/              # Dashboard, AddPlant, Diagnose, Profile, PlantDetail
│   ├── components/         # Button, GlassCard, BreathRing, PlantCard, etc.
│   ├── stores/             # plantStore, settingsStore (Zustand + localStorage)
│   ├── hooks/              # usePlants, useWatering, useWeather
│   └── lib/                # weather (Open-Meteo), date utils, notifications, cn
├── public/                 # PWA manifest, service worker, SVG icon
├── backend/                # FastAPI server (optional)
│   ├── main.py             # App entry, middleware, scheduler
│   ├── config.py           # Environment config
│   ├── db.py               # SQLAlchemy + SQLite WAL mode
│   ├── models.py           # Pydantic v2 schemas
│   ├── routes/             # plants, diagnosis, weather, health
│   ├── services/           # weather (Open-Meteo), diagnosis (mock)
│   └── tests/              # 29 pytest tests
└── .github/workflows/      # GitHub Pages deploy
```

## Design System

Nature palette: sage greens, soil browns, sky blues, clay terracotta, cream.
Glass-morphism cards with multi-layer shadows, floating pill tab bar.
Full tokens in `tailwind.config.js` and `src/index.css`.
Dark mode via `html.dark` class with per-component color overrides.

## Architecture Decisions

- **localStorage over backend DB**: Zero server costs, instant reads, import/export
- **Zustand over Redux**: Tiny API, no providers, works outside React
- **HashRouter over BrowserRouter**: GitHub Pages compatible, no 404 config
- **Tailwind over CSS-in-JS**: Design tokens in config, utility-first
- **SQLite over PostgreSQL (dev)**: Zero setup, WAL mode for concurrency

## Agent Skills

- Issue tracker: GitHub Issues on `iamvishalsehgal/Planty`, use `gh` CLI
- Triage: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
