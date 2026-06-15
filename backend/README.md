# Planty Backend

FastAPI server for plant care API. SQLite for dev, PostgreSQL for production.

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API at http://localhost:8000. Interactive docs at http://localhost:8000/docs.

## Configuration

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

Key settings:

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `sqlite:///planty.db` | PostgreSQL URL for Render |
| `PLANTY_TESTING` | `false` | Disables scheduler + rate limiter |
| `PLANTY_LOG_LEVEL` | `INFO` | `DEBUG` for verbose request logging |
| `PLANTY_DEBUG` | `false` | Include error details in 500 responses |

## Run tests

```bash
python3 -m pytest tests/ -v
# 29 tests covering: health, CRUD, watering, diagnosis, weather, rate limiting
```

## API overview

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/` | 200 | Root |
| GET | `/api/health` | 200 | Health + DB connectivity |
| GET | `/api/plants` | 200 | List plants |
| GET | `/api/plants/{id}` | 200/404 | Get plant |
| POST | `/api/plants` | 201/422 | Create plant |
| PATCH | `/api/plants/{id}` | 200/404 | Update plant |
| DELETE | `/api/plants/{id}` | 204/404 | Delete plant |
| POST | `/api/plants/{id}/water` | 201/404 | Log watering |
| GET | `/api/plants/{id}/events` | 200 | Watering history |
| POST | `/api/diagnosis` | 200/422 | Plant diagnosis |
| GET | `/api/weather?lat=&lon=` | 200/502 | Weather (Open-Meteo) |

## Architecture

```
main.py          FastAPI app, middleware, scheduler, rate limiter
config.py        Environment config with test overrides
db.py            SQLAlchemy engine, SQLite WAL mode, health check
models.py        Pydantic v2 request/response schemas
routes/          API endpoints
  plants.py      Plant CRUD + watering events
  diagnosis.py   Mock plant diagnosis
  health.py      Health check + request counting
  weather_route.py  Weather proxy (Open-Meteo)
services/        Business logic
  weather.py     Open-Meteo API client
  diagnosis.py   Weighted random condition selector
tests/           29 pytest tests
```

## Production (Render)

Uncomment `psycopg2-binary` in `requirements.txt` and set `DATABASE_URL` to your Render PostgreSQL URL. The `render.yaml` blueprint handles auto-deploy.
