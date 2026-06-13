# Planty

**Live app:** https://planty-26os.onrender.com

Planty help remember to water plants. Add plants → tap Water when water → app figures schedule. No manual tweaking.

---

## What makes it different

Most plant apps remind on fixed schedule. Planty watches actual watering → adjusts. Water Monstera every 9 days instead of set 7 → shifts schedule to match. Checks weather + season → summer heat = sooner reminders, winter = backs off.

Plant dies → tell why (overwatered, underwatered, unknown). Next time add same plant → Planty shows what went wrong + suggests corrected starting schedule.

---

## Features

- **Species presets** — 30+ common houseplants with pre-filled care settings, light/humidity/difficulty guides, species-specific tips
- **Automatic schedule** — learns from actual watering history, not just initial setting
- **Fertilizer tracking** — separate reminders for fertilizing, adaptive schedule
- **Plant Doctor** — symptom checker: yellow leaves, brown tips, drooping, pests, more with treatment guides
- **Photo journal** — capture plant growth over time, stored locally on device
- **Weather-aware** — pulls live weather, adjusts for temperature + season
- **Dark mode** — follows system theme or manual toggle, full component coverage
- **48-hour cooldown** — blocks accidental double-waterings
- **Death + revival system** — records cause of death, protects future plants
- **Notifications** — browser alerts when plant due or overdue, tab in background
- **Memorial tab** — record of every plant that didn't make it
- **Calendar export** — download `.ics` file, add watering reminders to any calendar app
- **Backup and restore** — export plant data as JSON, import on any device
- **Analytics** — health scores per plant based on watering consistency (backend needed for full analytics)

---

## How it's built

Two parts:

**App (frontend)** — UI. Runs in browser, stores plant data locally. Works offline, no account needed.

**Data backend** — small server. Receives watering history, processes every 5 min, computes health score per plant. Powers analytics.

---

## Folders

| Folder | What's in it |
|---|---|
| `frontend/` | App — entire UI in one HTML file |
| `backend/` | Python server for data processing |
| `.github/workflows/` | Auto-deploy to GitHub Pages |

Technical docs for each part → `docs.md` inside each folder.