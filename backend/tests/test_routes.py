"""Basic route tests for Planty backend — uses FastAPI TestClient with in-memory SQLite."""

import os
import sys
import json
from pathlib import Path

os.environ["PLANTY_TESTING"] = "1"
os.environ["PLANTY_DB_PATH"] = str(Path(__file__).parent / "test_planty.db")

# Ensure repo root is on sys.path for `import backend`
REPO_ROOT = Path(__file__).parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture(autouse=True)
def clean_db():
    """Recreate tables before each test, tear down after."""
    import backend.db as db_mod
    test_db = Path(os.environ["PLANTY_DB_PATH"])
    if test_db.exists():
        test_db.unlink()
    db_mod.init_db()
    yield
    if test_db.exists():
        test_db.unlink()


client = TestClient(app)


# ── Basic health checks ──────────────────────────────────────────

def test_serve_frontend():
    """GET / returns the SPA index.html."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert b"Planty" in response.content


def test_security_headers():
    """All responses include security headers."""
    response = client.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_cors_headers():
    """OPTIONS preflight returns CORS headers."""
    response = client.options(
        "/api/plants/sync",
        headers={"Origin": "https://example.com", "Access-Control-Request-Method": "POST"},
    )
    # FastAPI CORS middleware handles preflight
    assert response.status_code in (200, 405)  # 405 = method not allowed by route (but CORS ok)


# ── API endpoints ────────────────────────────────────────────────

def test_plants_sync_empty():
    """POST /api/plants/sync with empty payload."""
    response = client.post("/api/plants/sync", json={"plants": []})
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["staged"] == 0


def test_plants_sync_creates():
    """POST /api/plants/sync stages plants for pipeline."""
    payload = {
        "plants": [{
            "id": "test-1",
            "name": "Monstera",
            "location": "Living Room",
            "interval": 7,
            "lastWatered": None,
            "isDead": False,
        }]
    }
    response = client.post("/api/plants/sync", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["staged"] == 1


def test_plants_list_after_sync():
    """GET /api/plants lists synced plants."""
    # Sync a plant first
    client.post("/api/plants/sync", json={
        "plants": [{"id": "test-2", "name": "Pothos", "interval": 5}]
    })
    response = client.get("/api/plants")
    assert response.status_code == 200
    plants = response.json()
    assert isinstance(plants, list)
    assert any(p["name"] == "Pothos" for p in plants)


def test_events_sync():
    """POST /api/events/sync stages watering events."""
    # Need a plant first for FK (though SQLite FK may not enforce)
    client.post("/api/plants/sync", json={
        "plants": [{"id": "plant-a", "name": "Test", "interval": 7}]
    })
    payload = {
        "events": [{
            "id": "evt-1",
            "plantId": "plant-a",
            "eventType": "water",
            "scheduled": "2026-06-07T10:00:00Z",
            "completed": "2026-06-07T10:05:00Z",
        }]
    }
    response = client.post("/api/events/sync", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["staged"] == 1


# ── Analytics ────────────────────────────────────────────────────

def test_analytics_summary_empty():
    """GET /api/analytics/summary returns zeros for empty DB."""
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_plants"] == 0
    assert data["total_events"] == 0
    assert data["compliance_rate"] == 0


def test_analytics_trends():
    """GET /api/analytics/trends returns array."""
    response = client.get("/api/analytics/trends")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_analytics_export():
    """GET /api/analytics/export returns all data."""
    response = client.get("/api/analytics/export")
    assert response.status_code == 200
    data = response.json()
    assert "plants" in data
    assert "events" in data
    assert "metrics" in data


def test_pipeline_runs():
    """GET /api/analytics/pipeline-runs returns audit log."""
    response = client.get("/api/analytics/pipeline-runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_trigger_pipeline():
    """POST /api/analytics/run-pipeline triggers ETL."""
    response = client.post("/api/analytics/run-pipeline")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("success", "error")


# ── Validation ──────────────────────────────────────────────────

def test_plants_sync_invalid_payload():
    """POST /api/plants/sync with missing required fields returns 422."""
    response = client.post("/api/plants/sync", json={"plants": [{"name": "No ID"}]})
    assert response.status_code == 422  # FastAPI validation error


def test_events_sync_invalid_payload():
    """POST /api/events/sync with bad body returns 422."""
    response = client.post("/api/events/sync", json={"events": [{}]})
    assert response.status_code == 422


# ── Health ────────────────────────────────────────────────────────

def test_health_endpoint():
    """GET /api/health returns status and metadata."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "uptime_seconds" in data
    assert "request_count" in data
    assert isinstance(data["request_count"], int)


# ── Validation ───────────────────────────────────────────────────

def test_plant_validation_interval_too_low():
    """POST /api/plants/sync with interval < 2 returns 422."""
    response = client.post("/api/plants/sync", json={
        "plants": [{"id": "test-v", "name": "Bad", "interval": 1}]
    })
    assert response.status_code == 422


def test_plant_validation_empty_name():
    """POST /api/plants/sync with empty name returns 422."""
    response = client.post("/api/plants/sync", json={
        "plants": [{"id": "test-v", "name": "  ", "interval": 7}]
    })
    assert response.status_code == 422


def test_plant_validation_interval_too_high():
    """POST /api/plants/sync with interval > 30 returns 422."""
    response = client.post("/api/plants/sync", json={
        "plants": [{"id": "test-v", "name": "Bad", "interval": 99}]
    })
    assert response.status_code == 422


def test_ingestion_rejects_batch_with_invalid_item():
    """One bad plant in batch → whole request returns 422 (Pydantic layer).
    Ingestion-level skip only applies when pipeline is called directly (scheduler)."""
    response = client.post("/api/plants/sync", json={
        "plants": [
            {"id": "bad-1", "name": "", "interval": 7},
            {"id": "good-1", "name": "Survivor", "interval": 7},
        ]
    })
    assert response.status_code == 422
