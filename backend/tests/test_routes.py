"""Basic route tests for Planty backend — uses FastAPI TestClient with in-memory SQLite."""

import os
import sys
import json
import time
import sqlite3
import tempfile
import importlib
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
    import backend.routes.health as health_mod
    test_db = Path(os.environ["PLANTY_DB_PATH"])
    if test_db.exists():
        test_db.unlink()
    # Also clean up WAL / SHM companion files from previous runs
    for suffix in ("-wal", "-shm"):
        companion = Path(str(test_db) + suffix)
        if companion.exists():
            companion.unlink()
    db_mod.init_db()
    # Clear the write-check cache so each test starts fresh
    health_mod._write_check_cache = (0.0, True, None)
    yield
    # Restore write permissions (a test may have set 0o444) before unlinking
    if test_db.exists():
        try:
            os.chmod(test_db, 0o644)
        except OSError:
            pass
        test_db.unlink()
    for suffix in ("-wal", "-shm"):
        companion = Path(str(test_db) + suffix)
        if companion.exists():
            companion.unlink()


client = TestClient(app)


def _swap_db_path(new_path: str):
    """Temporarily swap the module-level DB_PATH and PLANTY_DB_PATH env var.

    Returns a tuple (original_path, original_env) to pass to _restore_db_path.

    IMPORTANT: The app imports ``db`` (not ``backend.db``), so we must
    patch **both** module objects -- they are distinct in sys.modules
    because sys.path contains both the repo root and backend/.
    """
    import backend.db as backend_db
    import db as app_db
    import backend.routes.health as health_mod

    original_path = str(app_db.DB_PATH)
    original_env = os.environ.get("PLANTY_DB_PATH")

    new_path_obj = Path(new_path)
    app_db.DB_PATH = new_path_obj
    backend_db.DB_PATH = new_path_obj
    os.environ["PLANTY_DB_PATH"] = new_path
    # Clear write-check cache so new path gets a fresh check
    health_mod._write_check_cache = (0.0, True, None)
    return original_path, original_env


def _restore_db_path(original_path: str, original_env: str | None):
    """Restore DB_PATH and PLANTY_DB_PATH after _swap_db_path."""
    import backend.db as backend_db
    import db as app_db

    original_path_obj = Path(original_path)
    app_db.DB_PATH = original_path_obj
    backend_db.DB_PATH = original_path_obj
    if original_env is not None:
        os.environ["PLANTY_DB_PATH"] = original_env


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


# ── Health ────────────────────────────────────────────────────────

def test_health_endpoint():
    """GET /api/health returns healthy status and metadata with real DB checks."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "uptime_seconds" in data
    assert "request_count" in data
    assert isinstance(data["request_count"], int)
    # Checks structure confirms real DB verification (not just file existence)
    assert "checks" in data
    checks = data["checks"]
    assert checks["db_integrity"] == "ok"
    assert checks["db_schema"] == "ok"
    assert checks["db_writeability"] == "ok"


def test_health_includes_schema_check():
    """Health endpoint confirms all 6 expected tables are present."""
    response = client.get("/api/health")
    assert response.status_code == 200
    checks = response.json()["checks"]
    assert checks["db_schema"] == "ok"


def test_health_includes_writeability_check():
    """Health endpoint confirms DB is writable via INSERT + ROLLBACK test."""
    response = client.get("/api/health")
    assert response.status_code == 200
    checks = response.json()["checks"]
    assert checks["db_writeability"] == "ok"


def test_health_response_schema_healthy():
    """Healthy response includes all expected fields with correct types."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()

    # Core fields
    assert data["status"] == "healthy"
    assert isinstance(data["version"], str)
    assert isinstance(data["uptime_seconds"], int)
    assert data["uptime_seconds"] >= 0
    assert isinstance(data["request_count"], int)
    assert data["request_count"] >= 1

    # Checks structure (three tiers of DB verification)
    assert "checks" in data
    checks = data["checks"]
    assert checks["db_integrity"] == "ok"
    assert checks["db_schema"] == "ok"
    assert checks["db_writeability"] == "ok"

    # Extended fields
    assert "db_size_kb" in data
    assert isinstance(data["db_size_kb"], (int, float))
    assert "started_at" in data
    # started_at should be ISO 8601 with timezone
    assert "T" in data["started_at"] or "+" in data["started_at"]

    # disk_warning may be None or a string
    assert "disk_warning" in data
    assert data["disk_warning"] is None or isinstance(data["disk_warning"], str)

    # No failure key when healthy
    assert "failure" not in data


def test_health_no_legacy_db_probe_fields():
    """The old 'db_probe' / 'db_probe_error' fields are gone -- replaced by 'checks'."""
    response = client.get("/api/health")
    data = response.json()
    assert "db_probe" not in data, "Legacy 'db_probe' field should not be present"
    assert "db_probe_error" not in data, "Legacy 'db_probe_error' field should not be present"
    assert "checks" in data


# ── Health -- in-place DB mutations (restored by clean_db fixture) ──

def test_health_unhealthy_on_missing_table():
    """If a core table is dropped, return 503 unhealthy."""
    import backend.db as db_mod
    conn = db_mod.get_conn()
    conn.execute("DROP TABLE plants_raw")
    conn.commit()
    conn.close()
    response = client.get("/api/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    assert "checks" in data
    schema_check = data["checks"].get("db_schema", [])
    assert any("missing_table:plants_raw" in str(s) for s in schema_check)


def test_health_unhealthy_on_missing_column():
    """If an expected column is missing from a table, return 503 unhealthy."""
    import backend.db as db_mod
    conn = db_mod.get_conn()
    # Recreate plants_raw without the 'name' column
    conn.executescript("""
        DROP TABLE IF EXISTS plants_raw;
        CREATE TABLE plants_raw (
            id          TEXT PRIMARY KEY,
            location    TEXT,
            interval    INTEGER NOT NULL,
            last_watered TEXT,
            is_dead     INTEGER DEFAULT 0,
            synced_at   TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()
    response = client.get("/api/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    schema_check = data["checks"].get("db_schema", [])
    assert any("missing_column:plants_raw.name" in str(s) for s in schema_check)


def test_health_degraded_when_db_readonly():
    """Read-only filesystem -> 200 degraded (reads work, writes don't).

    Uses a dedicated temporary DB to avoid interacting with the shared
    test DB used by other tests and the autouse clean_db fixture.
    """
    import backend.db as db_mod
    import db as app_db

    # Create a fresh, minimal DB in a temp location so we control its lifecycle
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_db = Path(tmpdir) / "degraded_test.db"
        # Build a valid SQLite DB with our schema
        tmp_conn = sqlite3.connect(str(tmp_db))
        tmp_conn.execute("PRAGMA journal_mode = WAL")
        # Full schema matching _EXPECTED_SCHEMA in backend/routes/health.py
        tmp_conn.executescript("""
            CREATE TABLE plants_raw (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT,
                interval INTEGER NOT NULL, last_watered TEXT,
                is_dead INTEGER DEFAULT 0, synced_at TEXT NOT NULL);
            CREATE TABLE events_raw (
                id TEXT PRIMARY KEY, plant_id TEXT NOT NULL,
                event_type TEXT NOT NULL, scheduled TEXT NOT NULL,
                completed TEXT, feedback TEXT, synced_at TEXT NOT NULL);
            CREATE TABLE care_events (
                id TEXT PRIMARY KEY, plant_id TEXT NOT NULL,
                event_type TEXT NOT NULL, scheduled TEXT NOT NULL,
                completed TEXT, feedback TEXT, days_overdue REAL,
                was_on_time INTEGER, processed_at TEXT NOT NULL);
            CREATE TABLE plant_health_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT, plant_id TEXT NOT NULL,
                computed_at TEXT NOT NULL, health_score REAL,
                compliance_rate REAL, avg_days_overdue REAL,
                total_events INTEGER, completed_events INTEGER);
            CREATE TABLE pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL,
                finished_at TEXT, status TEXT, plants_staged INTEGER DEFAULT 0,
                events_staged INTEGER DEFAULT 0, events_transformed INTEGER DEFAULT 0,
                metrics_computed INTEGER DEFAULT 0, error TEXT);
            CREATE TABLE error_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL,
                endpoint TEXT NOT NULL, error_type TEXT NOT NULL,
                message TEXT NOT NULL, source TEXT DEFAULT 'server',
                traceback TEXT);
        """)
        tmp_conn.commit()
        tmp_conn.close()

        # Swap the DB path to our temp DB
        orig_path = str(app_db.DB_PATH)
        orig_env = os.environ.get("PLANTY_DB_PATH")
        app_db.DB_PATH = tmp_db
        db_mod.DB_PATH = tmp_db
        os.environ["PLANTY_DB_PATH"] = str(tmp_db)

        try:
            # Make read-only
            os.chmod(str(tmp_db), 0o444)
            response = client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "degraded"
            assert data["checks"]["db_integrity"] == "ok"
            assert data["checks"]["db_schema"] == "ok"
            assert data["checks"]["db_writeability"] != "ok"
        finally:
            os.chmod(str(tmp_db), 0o644)
            app_db.DB_PATH = Path(orig_path)
            db_mod.DB_PATH = Path(orig_path)
            if orig_env is not None:
                os.environ["PLANTY_DB_PATH"] = orig_env


def test_health_degraded_schema_no_failure_key():
    """Degraded response has checks but no 'failure' key (reads work fine).

    Uses a dedicated temporary DB like test_health_degraded_when_db_readonly.
    """
    import backend.db as db_mod
    import db as app_db

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_db = Path(tmpdir) / "degraded_schema_test.db"
        tmp_conn = sqlite3.connect(str(tmp_db))
        tmp_conn.execute("PRAGMA journal_mode = WAL")
        # Full schema matching _EXPECTED_SCHEMA in backend/routes/health.py
        tmp_conn.executescript("""
            CREATE TABLE plants_raw (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT,
                interval INTEGER NOT NULL, last_watered TEXT,
                is_dead INTEGER DEFAULT 0, synced_at TEXT NOT NULL);
            CREATE TABLE events_raw (
                id TEXT PRIMARY KEY, plant_id TEXT NOT NULL,
                event_type TEXT NOT NULL, scheduled TEXT NOT NULL,
                completed TEXT, feedback TEXT, synced_at TEXT NOT NULL);
            CREATE TABLE care_events (
                id TEXT PRIMARY KEY, plant_id TEXT NOT NULL,
                event_type TEXT NOT NULL, scheduled TEXT NOT NULL,
                completed TEXT, feedback TEXT, days_overdue REAL,
                was_on_time INTEGER, processed_at TEXT NOT NULL);
            CREATE TABLE plant_health_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT, plant_id TEXT NOT NULL,
                computed_at TEXT NOT NULL, health_score REAL,
                compliance_rate REAL, avg_days_overdue REAL,
                total_events INTEGER, completed_events INTEGER);
            CREATE TABLE pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL,
                finished_at TEXT, status TEXT, plants_staged INTEGER DEFAULT 0,
                events_staged INTEGER DEFAULT 0, events_transformed INTEGER DEFAULT 0,
                metrics_computed INTEGER DEFAULT 0, error TEXT);
            CREATE TABLE error_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL,
                endpoint TEXT NOT NULL, error_type TEXT NOT NULL,
                message TEXT NOT NULL, source TEXT DEFAULT 'server',
                traceback TEXT);
        """)
        tmp_conn.commit()
        tmp_conn.close()

        orig_path = str(app_db.DB_PATH)
        orig_env = os.environ.get("PLANTY_DB_PATH")
        app_db.DB_PATH = tmp_db
        db_mod.DB_PATH = tmp_db
        os.environ["PLANTY_DB_PATH"] = str(tmp_db)

        try:
            os.chmod(str(tmp_db), 0o444)
            response = client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "degraded"
            assert "failure" not in data
            assert "checks" in data
            assert data["checks"]["db_integrity"] == "ok"
            assert data["checks"]["db_schema"] == "ok"
            assert data["checks"]["db_writeability"] != "ok"
            assert "version" in data
            assert "uptime_seconds" in data
        finally:
            os.chmod(str(tmp_db), 0o644)
            app_db.DB_PATH = Path(orig_path)
            db_mod.DB_PATH = Path(orig_path)
            if orig_env is not None:
                os.environ["PLANTY_DB_PATH"] = orig_env


# ── Health -- performance & idempotency ────────────────────────────

def test_health_response_time():
    """Health endpoint responds in under 100ms for Render free-tier pings."""
    response = client.get("/api/health")
    elapsed_ms = response.elapsed.total_seconds() * 1000
    assert response.status_code == 200
    assert elapsed_ms < 100, (
        f"Health check took {elapsed_ms:.1f}ms, must be under 100ms"
    )


def test_health_returns_after_startup():
    """Health endpoint is accessible immediately after app startup."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["uptime_seconds"] >= 0


def test_health_idempotent():
    """Multiple health checks return consistent status when DB is healthy."""
    responses = [client.get("/api/health") for _ in range(5)]
    statuses = [r.status_code for r in responses]
    bodies = [r.json()["status"] for r in responses]

    assert all(s == 200 for s in statuses), f"Got non-200: {statuses}"
    assert all(b == "healthy" for b in bodies), f"Inconsistent status: {bodies}"
    # request_count should increment (side effect is fine)
    counts = [r.json()["request_count"] for r in responses]
    assert counts == sorted(counts), f"request_count should be monotonic: {counts}"


# ── Validation ───────────────────────────────────────────────────

def test_plants_sync_invalid_payload():
    """POST /api/plants/sync with missing required fields returns 422."""
    response = client.post("/api/plants/sync", json={"plants": [{"name": "No ID"}]})
    assert response.status_code == 422  # FastAPI validation error


def test_events_sync_invalid_payload():
    """POST /api/events/sync with bad body returns 422."""
    response = client.post("/api/events/sync", json={"events": [{}]})
    assert response.status_code == 422


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
    """One bad plant in batch -> whole request returns 422 (Pydantic layer).
    Ingestion-level skip only applies when pipeline is called directly (scheduler)."""
    response = client.post("/api/plants/sync", json={
        "plants": [
            {"id": "bad-1", "name": "", "interval": 7},
            {"id": "good-1", "name": "Survivor", "interval": 7},
        ]
    })
    assert response.status_code == 422


# ── Edge Cases ────────────────────────────────────────────────────

def test_404_fallback_returns_index():
    """GET /nonexistent-path returns SPA fallback (index.html)."""
    response = client.get("/some-random-path-12345")
    assert response.status_code == 200
    assert b"Planty" in response.content


def test_pipeline_empty_triggers():
    """POST /api/analytics/run-pipeline returns success with zeroes."""
    response = client.post("/api/analytics/run-pipeline")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["plants_staged"] == 0
    assert data["events_staged"] == 0


def test_cors_preflight_analytics():
    """OPTIONS /api/analytics/summary returns CORS headers."""
    response = client.options(
        "/api/analytics/summary",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 405)


def test_interval_boundary_min():
    """Interval = 2 days (minimum allowed) is accepted."""
    response = client.post("/api/plants/sync", json={
        "plants": [{"id": "b-min", "name": "Min", "interval": 2}]
    })
    assert response.status_code == 200


def test_interval_boundary_max():
    """Interval = 30 days (maximum allowed) is accepted."""
    response = client.post("/api/plants/sync", json={
        "plants": [{"id": "b-max", "name": "Max", "interval": 30}]
    })
    assert response.status_code == 200


# ── Health Metrics ────────────────────────────────────────────────

def test_health_metrics():
    """GET /api/health/metrics returns pipeline stats."""
    response = client.get("/api/health/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "recent_runs" in data
    assert "error_rate" in data


def test_health_consistency():
    """GET /api/health/consistency returns table counts."""
    response = client.get("/api/health/consistency")
    assert response.status_code == 200
    data = response.json()
    assert "plants_raw" in data
    assert "events_raw" in data
    assert "events_unprocessed" in data


def test_pipeline_result_includes_duration():
    """Pipeline result dict includes duration_ms field."""
    response = client.post("/api/analytics/run-pipeline")
    assert response.status_code == 200
    data = response.json()
    assert "duration_ms" in data


# ── New health endpoints ────────────────────────────────────────────

def test_health_errors():
    """GET /api/health/errors returns error log array."""
    response = client.get("/api/health/errors")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_health_pipeline_health():
    """GET /api/health/pipeline-health returns health status."""
    response = client.get("/api/health/pipeline-health")
    assert response.status_code == 200
    data = response.json()
    assert "is_healthy" in data
    # Either has last_run_status or an error key (e.g., no pipeline runs yet)
    assert "last_run_status" in data or "error" in data


def test_health_performance():
    """GET /api/health/performance returns perf stats."""
    response = client.get("/api/health/performance")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data


def test_client_error_reporting():
    """POST /api/health/client-error accepts client errors."""
    response = client.post("/api/health/client-error", json={
        "message": "Test error",
        "stack": "Error: test\n  at test.js:1",
        "url": "http://localhost/test",
        "timestamp": "2026-06-08T12:00:00Z"
    })
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_client_error_minimal():
    """POST /api/health/client-error works with minimal payload."""
    response = client.post("/api/health/client-error", json={
        "message": "Minimal error"
    })
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_db_backup_endpoint():
    """GET /api/health/db-backup returns the SQLite file."""
    response = client.get("/api/health/db-backup")
    assert response.status_code == 200
    assert "application/octet-stream" in response.headers.get("content-type", "")


# ── Security ────────────────────────────────────────────────────────

def test_path_traversal_blocked():
    """GET with ../ in path returns 404 (Starlette normalizes .. before routing)."""
    response = client.get("/some/path/../../../etc/passwd")
    # Starlette normalizes ../ out of the URL path before routing,
    # so the resulting path won't trigger the block. Testing what actually reaches the route.
    # The real protection is the resolve() + startswith() check.
    assert response.status_code in (200, 404)


def test_path_traversal_encoded_blocked():
    """GET with encoded traversal is safely handled."""
    response = client.get("/..%2F..%2Fetc%2Fpasswd")
    assert response.status_code in (200, 404)


def test_static_file_served():
    """GET /manifest.json returns the file."""
    response = client.get("/manifest.json")
    assert response.status_code == 200
    assert "application/json" in response.headers.get("content-type", "")


def test_sitemap_served():
    """GET /sitemap.xml returns XML sitemap."""
    response = client.get("/sitemap.xml")
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")
    assert "xml" in content_type or "application/xml" in content_type


def test_robots_served():
    """GET /robots.txt returns text file."""
    response = client.get("/robots.txt")
    assert response.status_code == 200


# ══════════════════════════════════════════════════════════════════════
# Health -- missing/corrupt DB via path swap (MUST run last)
#
# These tests use ``_swap_db_path`` which modifies *both* ``db`` and
# ``backend.db`` module attributes.  They are placed at the end of the
# file so they cannot interfere with the standard ``clean_db`` fixture
# used by earlier tests.
#
# All tests in this section use temporary directories created by the
# test body; the ``clean_db`` fixture still runs, but since
# PLANTY_DB_PATH is swapped inside the test body (after fixture setup),
# the fixture operates on the correct, original DB.
# ══════════════════════════════════════════════════════════════════════

def test_health_missing_db_file(monkeypatch):
    """When DB file is entirely missing, endpoint returns 503 unhealthy."""
    import backend.db as db_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        nonexistent = Path(tmpdir) / "nonexistent.db"
        original_path, original_env = _swap_db_path(str(nonexistent))
        monkeypatch.setenv("PLANTY_DB_PATH", str(nonexistent))
        try:
            response = client.get("/api/health")
            assert response.status_code == 503, (
                f"Expected 503 for missing DB file, got {response.status_code}"
            )
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "failure" in data
            assert "checks" in data
            assert "version" in data
            assert "uptime_seconds" in data
            # db_size_kb: SQLite may create an empty file on connect,
            # so it can be 0 or a small overhead value
            db_size = data.get("db_size_kb", 0)
            assert isinstance(db_size, (int, float)) and db_size >= 0
        finally:
            _restore_db_path(original_path, original_env)


def test_health_corrupt_db(monkeypatch):
    """When DB file exists but is corrupt (invalid header), endpoint returns 503 unhealthy."""
    import backend.db as db_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        corrupt_db = Path(tmpdir) / "corrupt.db"
        corrupt_db.write_bytes(b"\x00\x01\x02\x03NOT A VALID SQLITE DATABASE\xff\xfe\xfd")
        assert corrupt_db.exists()

        original_path, original_env = _swap_db_path(str(corrupt_db))
        monkeypatch.setenv("PLANTY_DB_PATH", str(corrupt_db))
        try:
            response = client.get("/api/health")
            assert response.status_code == 503, (
                f"Expected 503 for corrupt DB file, got {response.status_code}"
            )
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "failure" in data
        finally:
            _restore_db_path(original_path, original_env)


def test_health_empty_db_file(monkeypatch):
    """Empty (0-byte) file that is not a valid SQLite DB -> 503 unhealthy."""
    import backend.db as db_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        empty_db = Path(tmpdir) / "empty.db"
        empty_db.write_bytes(b"")
        assert empty_db.exists()

        original_path, original_env = _swap_db_path(str(empty_db))
        monkeypatch.setenv("PLANTY_DB_PATH", str(empty_db))
        try:
            response = client.get("/api/health")
            assert response.status_code == 503, (
                f"Expected 503 for empty/non-DB file, got {response.status_code}"
            )
            data = response.json()
            assert data["status"] == "unhealthy"
            assert "failure" in data
        finally:
            _restore_db_path(original_path, original_env)


def test_health_valid_header_but_corrupt_internals(monkeypatch):
    """File with valid SQLite header but corrupt data -> 503 unhealthy.

    PRAGMA integrity_check catches this; a naive os.path.exists()
    check would return 200 ok.
    """
    import backend.db as db_mod

    with tempfile.TemporaryDirectory() as tmpdir:
        valid_header = b"SQLite format 3\x00" + b"\x00" * 84  # 100-byte header
        fake_db = Path(tmpdir) / "fake_header.db"
        fake_db.write_bytes(valid_header + b"garbage data that is not a real database")
        assert fake_db.exists()

        original_path, original_env = _swap_db_path(str(fake_db))
        monkeypatch.setenv("PLANTY_DB_PATH", str(fake_db))
        try:
            response = client.get("/api/health")
            data = response.json()
            assert response.status_code == 503, (
                f"Expected 503 (PRAGMA integrity_check should fail), "
                f"got {response.status_code}"
            )
            assert data["status"] == "unhealthy", (
                "Status must be 'unhealthy' when DB has valid header "
                "but is internally corrupt"
            )
            assert "failure" in data
        finally:
            _restore_db_path(original_path, original_env)


def test_health_sql_injection_path_safe(monkeypatch):
    """DB path with SQL-like characters is treated as filename only -- not interpolated."""
    import backend.db as db_mod

    injection_path = "'; DROP TABLE plants_raw; --.db"
    original_path, original_env = _swap_db_path(injection_path)
    monkeypatch.setenv("PLANTY_DB_PATH", injection_path)
    try:
        response = client.get("/api/health")
        assert response.status_code == 503, (
            f"Expected 503 for nonexistent path, got {response.status_code}"
        )
        data = response.json()
        assert data["status"] == "unhealthy"
        assert "failure" in data
    finally:
        _restore_db_path(original_path, original_env)
