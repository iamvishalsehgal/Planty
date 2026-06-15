"""Tests for Planty v2 API routes."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# MUST be set before importing main/config — controls rate limiter + scheduler
os.environ["PLANTY_TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from main import app
from db import init_db, SessionLocal
from sqlalchemy import text

# Force TESTING mode on already-imported config singleton
import config as _cfg
_cfg.config._overrides["TESTING"] = True

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Reset database before and after each test."""
    init_db()
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM watering_events"))
        db.execute(text("DELETE FROM plants"))
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM watering_events"))
        db.execute(text("DELETE FROM plants"))
        db.commit()
    finally:
        db.close()


def _create_plant(name="Test Plant", **kwargs):
    """Helper: create a plant and return the JSON response."""
    payload = {
        "name": name,
        "species": kwargs.get("species", "Monstera"),
        "room": kwargs.get("room", "Living Room"),
        "watering_interval_days": kwargs.get("watering_interval_days", 3),
    }
    payload.update({k: v for k, v in kwargs.items() if k in ("photo_url",)})
    return client.post("/api/plants", json=payload)


class TestHealth:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("healthy", "degraded")
        assert "database" in data
        assert "request_count" in data
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))


class TestPlants:
    # ── Happy path ──
    def test_create_plant(self):
        response = _create_plant("Test Monstera")
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Monstera"
        assert data["species"] == "Monstera"
        assert data["health_status"] == "healthy"
        assert "id" in data
        assert "next_watering" in data

    def test_create_plant_with_photo(self):
        response = _create_plant("Photo Plant", photo_url="https://example.com/plant.jpg")
        assert response.status_code == 201
        assert response.json()["photo_url"] == "https://example.com/plant.jpg"

    def test_list_plants(self):
        for i in range(3):
            _create_plant(f"Plant {i}")
        response = client.get("/api/plants")
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_list_plants_empty(self):
        response = client.get("/api/plants")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_plant(self):
        created = _create_plant("Find Me")
        plant_id = created.json()["id"]
        response = client.get(f"/api/plants/{plant_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Find Me"

    def test_update_plant(self):
        created = _create_plant("Original", watering_interval_days=7)
        plant_id = created.json()["id"]
        response = client.patch(f"/api/plants/{plant_id}", json={
            "name": "Updated",
            "watering_interval_days": 10,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated"
        assert data["watering_interval_days"] == 10

    def test_delete_plant(self):
        created = _create_plant("Delete Me")
        plant_id = created.json()["id"]
        assert client.delete(f"/api/plants/{plant_id}").status_code == 204
        assert client.get(f"/api/plants/{plant_id}").status_code == 404

    # ── 404 edge cases ──
    def test_get_plant_404(self):
        assert client.get("/api/plants/nonexistent-id").status_code == 404

    def test_update_plant_404(self):
        response = client.patch("/api/plants/nonexistent-id", json={"name": "X"})
        assert response.status_code == 404

    def test_delete_plant_404(self):
        assert client.delete("/api/plants/nonexistent-id").status_code == 404

    def test_water_nonexistent_plant(self):
        response = client.post("/api/plants/nonexistent-id/water", json={})
        assert response.status_code == 404

    def test_get_events_nonexistent_plant(self):
        # Silently returns empty list for unknown plants (acceptable)
        response = client.get("/api/plants/nonexistent-id/events")
        assert response.status_code == 200
        assert response.json() == []

    # ── Validation edge cases ──
    def test_validation_name_required(self):
        response = client.post("/api/plants", json={"species": "Fern", "room": "Office"})
        assert response.status_code == 422

    def test_validation_empty_name(self):
        response = client.post("/api/plants", json={
            "name": "", "species": "Fern", "room": "Office",
        })
        assert response.status_code == 422

    def test_validation_interval_too_low(self):
        response = client.post("/api/plants", json={
            "name": "X", "species": "Y", "room": "Z",
            "watering_interval_days": 0,
        })
        assert response.status_code == 422

    def test_validation_interval_too_high(self):
        response = client.post("/api/plants", json={
            "name": "X", "species": "Y", "room": "Z",
            "watering_interval_days": 31,
        })
        assert response.status_code == 422

    def test_validation_name_too_long(self):
        response = client.post("/api/plants", json={
            "name": "A" * 101, "species": "Fern", "room": "Office",
        })
        assert response.status_code == 422


class TestWatering:
    def test_water_plant(self):
        plant = _create_plant("Thirsty Plant").json()
        response = client.post(f"/api/plants/{plant['id']}/water", json={
            "amount_ml": 200,
            "notes": "Soil was dry",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["amount_ml"] == 200
        assert data["notes"] == "Soil was dry"

        # Plant should be healthy after watering
        updated = client.get(f"/api/plants/{plant['id']}").json()
        assert updated["health_status"] == "healthy"

    def test_water_plant_minimal_payload(self):
        plant = _create_plant("Minimal Water").json()
        response = client.post(f"/api/plants/{plant['id']}/water", json={})
        assert response.status_code == 201
        assert response.json()["amount_ml"] is None

    def test_get_watering_events(self):
        plant = _create_plant("Logged Plant").json()
        client.post(f"/api/plants/{plant['id']}/water", json={})
        client.post(f"/api/plants/{plant['id']}/water", json={"amount_ml": 150})

        response = client.get(f"/api/plants/{plant['id']}/events")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_watering_events_empty(self):
        plant = _create_plant("No Events").json()
        response = client.get(f"/api/plants/{plant['id']}/events")
        assert response.status_code == 200
        assert response.json() == []


class TestDiagnosis:
    def test_diagnose_plant(self):
        response = client.post("/api/diagnosis", json={
            "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        })
        assert response.status_code == 200
        data = response.json()
        assert "condition" in data
        assert "confidence" in data
        assert "description" in data
        assert "treatment" in data
        assert 0 <= data["confidence"] <= 100

    def test_diagnose_image_too_short(self):
        response = client.post("/api/diagnosis", json={"image": "abc"})
        assert response.status_code == 422

    def test_diagnose_strips_data_url(self):
        # Valid base64 with data URL prefix should be stripped and accepted
        response = client.post("/api/diagnosis", json={
            "image": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        })
        assert response.status_code == 200


class TestWeather:
    def test_get_weather_default_coords(self):
        response = client.get("/api/weather")
        assert response.status_code == 200
        data = response.json()
        assert "temp_c" in data
        assert "humidity" in data
        assert "condition" in data
        assert "is_rainy" in data

    def test_get_weather_custom_coords(self):
        response = client.get("/api/weather?lat=48.8566&lon=2.3522")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["temp_c"], (int, float))


class TestRateLimit:
    def test_rate_limit_applied(self):
        """Send rapid requests — at least one should be 429."""
        responses = [client.get("/api/plants").status_code for _ in range(20)]
        assert 429 in responses


class TestRoot:
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
