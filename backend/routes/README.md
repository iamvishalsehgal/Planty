# backend/routes/

Three route files, all registered in `main.py` under the `/api/` prefix. FastAPI auto-generates interactive docs at `/docs`.

---

## plants.py

**`POST /api/plants/sync`**

Receives the current plant list from the frontend and upserts it into `plants_raw`. Also triggers the ETL pipeline so health metrics are updated immediately after a sync.

Request body:
```json
{
  "plants": [
    {
      "id": "uuid",
      "name": "Monstera",
      "location": "Living Room",
      "interval": 7,
      "lastWatered": "2024-01-15T10:00:00Z",
      "isDead": false
    }
  ]
}
```

Response:
```json
{ "ok": true, "staged": 3 }
```

---

**`GET /api/plants`**

Returns all plants from `plants_raw` with the latest health metrics row joined in for each plant.

Response:
```json
[
  {
    "id": "uuid",
    "name": "Monstera",
    "location": "Living Room",
    "interval": 7,
    "is_dead": 0,
    "metrics": {
      "health_score": 0.82,
      "compliance_rate": 1.0,
      "avg_days_overdue": 0.5
    }
  }
]
```

`metrics` is `null` if the plant has no completed events yet.

---

## events.py

**`POST /api/events/sync`**

Receives care events from the frontend and upserts them into `events_raw`. Triggers the pipeline after staging so new completions are transformed immediately.

Request body:
```json
{
  "events": [
    {
      "id": "uuid",
      "plantId": "plant-uuid",
      "eventType": "water",
      "scheduled": "2024-01-15T00:00:00Z",
      "completed": "2024-01-15T10:00:00Z",
      "feedback": "happy"
    }
  ]
}
```

Response:
```json
{ "ok": true, "staged": 5 }
```

`completed` and `feedback` are optional — events that haven't been acted on yet are staged without them and skipped by the transform layer until they're completed.

---

## analytics.py

**`GET /api/analytics/summary`**

Aggregate KPIs across all plants. The `avg_health_score` is computed from the most recent `plant_health_metrics` row per plant.

```json
{
  "total_plants": 4,
  "total_events": 28,
  "completed_events": 25,
  "overdue_events": 3,
  "compliance_rate": 0.8929,
  "avg_health_score": 0.7641
}
```

---

**`GET /api/analytics/trends`**

Daily event counts for the last 28 days, ordered most recent first. Used to draw the weekly care chart in the Schedule tab.

```json
[
  { "day": "2024-01-15", "events": 4, "completed": 4 },
  { "day": "2024-01-14", "events": 2, "completed": 1 }
]
```

---

**`POST /api/analytics/run-pipeline`**

Manually triggers the full ETL pipeline (transform + aggregation only — no ingestion since no data is passed). Returns the same audit object that gets written to `pipeline_runs`.

```json
{
  "plants_staged": 0,
  "events_staged": 0,
  "events_transformed": 3,
  "metrics_computed": 4,
  "status": "success",
  "error": null
}
```

---

**`GET /api/analytics/export`**

Full data dump of all three primary tables as JSON. Used for debugging or external analysis.

```json
{
  "plants": [...],
  "events": [...],
  "metrics": [...]
}
```

---

**`GET /api/analytics/pipeline-runs`**

Last 50 ETL audit log entries, most recent first.

```json
[
  {
    "id": 12,
    "started_at": "2024-01-15T10:00:00Z",
    "finished_at": "2024-01-15T10:00:01Z",
    "status": "success",
    "plants_staged": 0,
    "events_staged": 0,
    "events_transformed": 2,
    "metrics_computed": 3,
    "error": null
  }
]
```
