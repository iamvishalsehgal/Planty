# backend/pipelines/

This folder = data processing logic. Every 5 min, processes all watering events from app → calculates plant care quality.

---

## What it does

Three sequential steps:

**Step 1 — Collect** (`ingestion.py`): Raw app data → DB.

**Step 2 — Analyse** (`transform.py`): Each completed watering → on-time/late check.

**Step 3 — Score** (`aggregation.py`): All data → plant health score (0–1).

`runner.py` coordinates all three + logs each run.

---

Full technical breakdown → [docs.md](docs.md).