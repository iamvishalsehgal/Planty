# Planty 🌱

Smart plant care web app. Track watering schedules, diagnose issues, and get weather-aware reminders — all in the browser.

## Features

- **Adaptive watering** — adjusts interval based on live weather (skip when rainy, sooner when hot)
- **Plant Doctor** — photo upload + common issue reference guide
- **Glass-morphism UI** — floating pill tab bar, gradient rings, multi-layer shadows
- **Dark mode** — full design system with light + dark themes
- **Offline-first** — all data in localStorage, import/export backup
- **Zero server costs** — static frontend (GitHub Pages), weather from free Open-Meteo API

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS |
| Routing | React Router v7 (hash-based) |
| State | Zustand v5 + localStorage |
| Backend | FastAPI + SQLite / PostgreSQL |
| Weather | Open-Meteo (free, no API key) |
| Deploy | GitHub Pages (frontend), Render (backend optional) |

## Getting Started

### Frontend

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # Production build → dist/
```

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload    # API server → http://localhost:8000
```

Open http://localhost:8000/docs for interactive API docs.

## Project Structure

```
planty/
├── index.html               # SPA entry
├── vite.config.js            # Vite + path aliases
├── tailwind.config.js        # Design tokens (colors, type, shadows)
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Router + layout
│   ├── index.css             # Tailwind + custom utilities + dark mode
│   ├── pages/                # Dashboard, AddPlant, Diagnose, Profile, PlantDetail
│   ├── components/           # UI (Button, GlassCard, BreathRing, etc.)
│   ├── stores/               # Zustand (plantStore, settingsStore)
│   ├── hooks/                # usePlants, useWatering, useWeather
│   └── lib/                  # api, date, cn, weather (Open-Meteo)
├── backend/
│   ├── main.py               # FastAPI app + middleware + scheduler
│   ├── config.py             # Environment config
│   ├── db.py                 # SQLAlchemy + SQLite/PostgreSQL
│   ├── models.py             # Pydantic v2 schemas
│   ├── routes/               # plants, diagnosis, weather, health
│   ├── services/             # weather (Open-Meteo), diagnosis (mock)
│   └── tests/                # 29 tests, pytest
└── .github/workflows/        # GitHub Pages deploy
```

## Testing

```bash
# Frontend
npm run build             # Vite production build

# Backend (29 tests)
cd backend && source .venv/bin/activate && python3 -m pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root — app info |
| GET | `/api/health` | Health check + DB status |
| GET | `/api/plants` | List all plants |
| GET | `/api/plants/{id}` | Get plant |
| POST | `/api/plants` | Create plant |
| PATCH | `/api/plants/{id}` | Update plant |
| DELETE | `/api/plants/{id}` | Delete plant |
| POST | `/api/plants/{id}/water` | Record watering |
| GET | `/api/plants/{id}/events` | Watering history |
| POST | `/api/diagnosis` | Diagnose from photo |
| GET | `/api/weather` | Current weather |

## Configuration

Backend config via environment variables — see `backend/.env.example`.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///planty.db` | PostgreSQL for production |
| `PLANTY_LOG_LEVEL` | `INFO` | Logging level |
| `PLANTY_RATE_LIMIT` | `10` | Requests/sec per IP |
| `PLANTY_CORS_ORIGINS` | `*` | Allowed origins |

## License

MIT
