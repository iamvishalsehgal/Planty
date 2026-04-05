# Planty

**Live app:** https://planty-26os.onrender.com

Planty helps you remember to water your plants. You add your plants, tap Water whenever you actually water them, and the app figures out the right schedule on its own — no manual tweaking needed.

---

## What makes it different

Most plant apps just remind you on a fixed schedule. Planty watches how you actually water and adjusts around that. If you tend to water your Monstera every 9 days even though you set it to 7, it picks that up and shifts the schedule to match. It also checks the current weather and season — so in summer heat it reminds you sooner, and in winter it backs off.

When a plant dies, you tell it why (overwatered, underwatered, or unknown). The next time you add the same plant, Planty shows you what went wrong and suggests a corrected starting schedule.

---

## Features

- **Automatic schedule** — learns from your actual watering history, not just the initial setting
- **Weather-aware** — pulls live weather and adjusts for temperature and season
- **48-hour cooldown** — blocks accidental double-waterings
- **Death + revival system** — records cause of death, uses it to protect future plants
- **Notifications** — browser alerts when a plant is due or overdue, even with the tab in the background
- **Memorial tab** — keeps a record of every plant that didn't make it
- **Calendar export** — download a `.ics` file to add watering reminders to any calendar app
- **Backup and restore** — export your plant data as JSON and import it on any device
- **Analytics** — health scores per plant based on how consistently you've been watering

---

## How it's built

There are two parts that work together:

**The app (frontend)** — everything you see and tap. It runs entirely in your browser and stores your plant data locally on your device. It works offline and doesn't need an account.

**The data backend** — a small server running in the background. It receives your watering history, processes it every 5 minutes, and computes a health score for each plant. This is what powers the analytics section.

---

## Folders

| Folder | What's in it |
|---|---|
| `frontend/` | The app — the entire UI in one HTML file |
| `backend/` | The Python server that handles data processing |
| `.github/workflows/` | Automatic deployment to GitHub Pages |

For technical documentation on each part, see the `docs.md` file inside each folder.
