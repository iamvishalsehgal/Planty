# backend/

Server behind app. Receives watering data → processes every 5 min → health score per plant based on care consistency.

---

## What it does

Each watering action sent to server → stored. Every 5 min, processes all data → computes:

- On-time vs late waterings
- Overall plant health score
- Trends — getting better or worse at keeping up?

Powers app analytics.

---

## Files

| File | What it does |
|---|---|
| `main.py` | Starts server, connects routes, kicks off 5-min processing job |
| `db.py` | Sets up the database where all the data is stored |
| `models.py` | Describes the shape of data coming in from the app |
| `pipelines/` | The data processing logic — see that folder's README |
| `routes/` | The API endpoints the app talks to — see that folder's README |
| `requirements.txt` | The Python packages this server needs to run |

---

For the full technical breakdown, see [docs.md](docs.md).