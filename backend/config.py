"""Application configuration — loaded from environment with sensible defaults."""

import os
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass


class _Config:
    """Centralised config — reads env at init, supports overrides for tests."""

    def __init__(self):
        self._overrides: dict = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name in self._overrides:
            return self._overrides[name]
        return self._defaults[name]

    # ── Defaults (read at import time) ──
    _defaults = {
        "DATABASE_URL": os.getenv("DATABASE_URL", "sqlite:///planty.db"),
        "TITLE": os.getenv("PLANTY_TITLE", "Planty v2"),
        "VERSION": os.getenv("PLANTY_VERSION", "2.0.0"),
        "DEBUG": os.getenv("PLANTY_DEBUG", "false").lower() == "true",
        "TESTING": os.getenv("PLANTY_TESTING", "false").lower() == "true",
        "LOG_LEVEL": os.getenv("PLANTY_LOG_LEVEL", "INFO"),
        "RATE_LIMIT_REQ_PER_SEC": int(os.getenv("PLANTY_RATE_LIMIT", "10")),
        "HEALTH_RECOMPUTE_MINUTES": int(os.getenv("PLANTY_HEALTH_INTERVAL", "5")),
        "CORS_ORIGINS": os.getenv("PLANTY_CORS_ORIGINS", "*").split(","),
        "WEATHER_DEFAULT_LAT": float(os.getenv("PLANTY_WEATHER_LAT", "52.3676")),
        "WEATHER_DEFAULT_LON": float(os.getenv("PLANTY_WEATHER_LON", "4.9041")),
    }


config = _Config()


config = _Config()
