"""Tests for Planty v2 API routes."""

import os
import sys
from pathlib import Path

# Make backend/ importable as root
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ["PLANTY_TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from main import app
from db import init_db, SessionLocal
from sqlalchemy import text

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Reset database before each test."""
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


class TestHealth:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "request_count" in data
        assert "uptime_seconds" in data


class TestPlants:
    def test_create_plant(self):
        response = client.post("/api/plants", json={
            "name": "Test Monstera",
            "species": "Monstera",
            "room": "Living Room",
            "watering_interval_days": 3,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Monstera"
        assert data["species"] == "Monstera"
        assert data["health_status"] == "healthy"
        assert "id" in data
        assert "next_watering" in data

    def test_list_plants(self):
        # Create a few plants
        for i in range(3):
            client.post("/api/plants", json={
                "name": f"Plant {i}",
                "species": "Pothos",
                "room": "Bedroom",
                "watering_interval_days": 5,
            })

        response = client.get("/api/plants")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_plant(self):
        created = client.post("/api/plants", json={
            "name": "Find Me",
            "species": "Fern",
            "room": "Bathroom",
            "watering_interval_days": 2,
        })
        plant_id = created.json()["id"]

        response = client.get(f"/api/plants/{plant_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Find Me"

    def test_get_plant_404(self):
        response = client.get("/api/plants/nonexistent-id")
        assert response.status_code == 404

    def test_update_plant(self):
        created = client.post("/api/plants", json={
            "name": "Original Name",
            "species": "Cactus",
            "room": "Balcony",
            "watering_interval_days": 7,
        })
        plant_id = created.json()["id"]

        response = client.patch(f"/api/plants/{plant_id}", json={
            "name": "Updated Name",
            "watering_interval_days": 10,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["watering_interval_days"] == 10

    def test_delete_plant(self):
        created = client.post("/api/plants", json={
            "name": "Delete Me",
            "species": "Succulent",
            "room": "Kitchen",
            "watering_interval_days": 14,
        })
        plant_id = created.json()["id"]

        response = client.delete(f"/api/plants/{plant_id}")
        assert response.status_code == 204

        # Verify deleted
        response = client.get(f"/api/plants/{plant_id}")
        assert response.status_code == 404

    def test_validation_name_required(self):
        response = client.post("/api/plants", json={
            "species": "Fern",
            "room": "Office",
        })
        assert response.status_code == 422


class TestWatering:
    def test_water_plant(self):
        plant = client.post("/api/plants", json={
            "name": "Thirsty",
            "species": "Spider Plant",
            "room": "Hallway",
            "watering_interval_days": 3,
        }).json()

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

    def test_get_watering_events(self):
        plant = client.post("/api/plants", json={
            "name": "Logged",
            "species": "Aloe Vera",
            "room": "Office",
        }).json()

        # Water twice
        client.post(f"/api/plants/{plant['id']}/water", json={})
        client.post(f"/api/plants/{plant['id']}/water", json={"amount_ml": 150})

        response = client.get(f"/api/plants/{plant['id']}/events")
        assert response.status_code == 200
        assert len(response.json()) == 2


class TestDiagnosis:
    def test_diagnose_plant(self):
        # Send a fake base64 image
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


class TestWeather:
    def test_get_weather(self):
        response = client.get("/api/weather")
        assert response.status_code == 200
        data = response.json()
        assert "temp_c" in data
        assert "humidity" in data
        assert "condition" in data
        assert "is_rainy" in data


class TestRateLimit:
    def test_rate_limit_applied(self):
        """Send 11 rapid requests — 11th should be 429."""
        responses = []
        for _ in range(15):
            r = client.get("/api/plants")
            responses.append(r.status_code)

        assert 429 in responses
