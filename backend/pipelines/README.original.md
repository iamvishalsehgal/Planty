# backend/pipelines/

This folder contains the data processing logic. Every 5 minutes, it goes through all the watering events that have come in from the app and works out how well each plant is being looked after.

---

## What it does

Think of it as three steps that run one after another:

**Step 1 — Collect** (`ingestion.py`): Takes the raw data sent from the app and saves it to the database.

**Step 2 — Analyse** (`transform.py`): Looks at each completed watering and works out whether it was done on time or how late it was.

**Step 3 — Score** (`aggregation.py`): Uses all that information to give each plant a health score between 0 and 1.

`runner.py` is what coordinates all three steps and keeps a log of every time they run.

---

For the full technical breakdown, see [docs.md](docs.md).
