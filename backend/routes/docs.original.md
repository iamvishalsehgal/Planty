# backend/routes/ — Technical Reference

All routes are registered in `main.py`. Every path is prefixed with `/api/`. FastAPI generates interactive docs at `/docs`.

---

## plants.py — prefix: `/api/plants`

### POST `/api/plants/sync`

Receives the current plant list from the frontend. Passes to `ingestion.run()` then triggers `run_pipeline()` so health metrics are updated immediately.

**Request body:**
```json
{
  "plants": [
    {
      "id": "a1b2c3d4",
      "name": "Monstera",
      "location": "Living Room",
      "interval": 7,
      "lastWatered": "2024-01-15T10:00:00Z",
      "isDead": false
    }
  ]
}
```

All fields except `location`, `lastWatered`, and `isDead` are required. `isDead` defaults to `false`.

**Response:**
```json
{ "ok": true, "staged": 3 }
```

`staged` is the count of rows written to `plants_raw`.

---

### GET `/api/plants`

Returns all rows from `plants_raw` with the most recent `plant_health_metrics` row joined per plant.

**Response:**
```json
[
  {
    "id": "a1b2c3d4",
    "name": "Monstera",
    "location": "Living Room",
    "interval": 7,
    "is_dead": 0,
    "synced_at": "2024-01-15T10:05:00Z",
    "metrics": {
      "health_score": 0.8214,
      "compliance_rate": 1.0,
      "avg_days_overdue": 0.42
    }
  }
]
```

`metrics` is `null` for plants that have no completed events yet.

---

## events.py — prefix: `/api/events`

### POST `/api/events/sync`

Receives care events from the frontend. Passes to `ingestion.run()` then triggers `run_pipeline()`.

**Request body:**
```json
{
  "events": [
    {
      "id": "e1f2g3h4",
      "plantId": "a1b2c3d4",
      "eventType": "water",
      "scheduled": "2024-01-15T00:00:00Z",
      "completed": "2024-01-15T10:00:00Z",
      "feedback": "happy"
    }
  ]
}
```

`completed` and `feedback` are optional — events without `completed` are staged but skipped by the transform layer until they are completed.

**Response:**
```json
{ "ok": true, "staged": 5 }
```

---

## analytics.py — prefix: `/api/analytics`

### GET `/api/analytics/summary`

Aggregate KPIs across all plants. `avg_health_score` is the mean of the most recent `health_score` per plant (uses a subquery with `MAX(computed_at)` grouped by `plant_id`).

**Response:**
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

`compliance_rate` = `completed_events / total_events`. Returns `0` if no events. `avg_health_score` returns `null` if no metrics computed yet.

---

### GET `/api/analytics/trends`

Daily event counts from `care_events`, last 28 days, most recent first.

```sql
SELECT DATE(scheduled) AS day,
       COUNT(*) AS events,
       SUM(CASE WHEN completed IS NOT NULL THEN 1 ELSE 0 END) AS completed
FROM care_events
GROUP BY day ORDER BY day DESC LIMIT 28
```

**Response:**
```json
[
  { "day": "2024-01-15", "events": 4, "completed": 4 },
  { "day": "2024-01-14", "events": 2, "completed": 1 }
]
```

---

### POST `/api/analytics/run-pipeline`

Triggers `runner.run_pipeline()` with no arguments — runs transform and aggregation only, no ingestion.

**Response:** The audit dict written to `pipeline_runs`:
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

### GET `/api/analytics/export`

Full dump of `plants_raw`, `care_events`, and `plant_health_metrics` as JSON arrays.

```json
{
  "plants": [ ...all rows from plants_raw... ],
  "events": [ ...all rows from care_events... ],
  "metrics": [ ...all rows from plant_health_metrics... ]
}
```

---

### GET `/api/analytics/pipeline-runs`

Last 50 rows from `pipeline_runs`, ordered by `started_at DESC`.

```json
[
  {
    "id": 14,
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
