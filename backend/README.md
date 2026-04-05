# backend/

This is the server that runs behind the app. It receives your watering data, processes it every 5 minutes, and works out a health score for each of your plants based on how consistently you've been looking after them.

---

## What it does

Every time you water a plant in the app, that action gets sent to this server. The server stores it, and every 5 minutes it goes through all the data and computes:

- How many waterings were on time vs late
- How your plants are doing overall (the health score)
- Trends over time — are you getting better or worse at keeping up?

This is what powers the analytics section of the app.

---

## Files

| File | What it does |
|---|---|
| `main.py` | Starts the server, connects all the routes, kicks off the 5-minute processing job |
| `db.py` | Sets up the database where all the data is stored |
| `models.py` | Describes the shape of data coming in from the app |
| `pipelines/` | The data processing logic — see that folder's README |
| `routes/` | The API endpoints the app talks to — see that folder's README |
| `requirements.txt` | The Python packages this server needs to run |

---

For the full technical breakdown, see [docs.md](docs.md).
