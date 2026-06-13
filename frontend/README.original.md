# frontend/

This folder contains the entire Planty app. It's one HTML file — `index.html` — that has everything built in: the design, the logic, and all four screens.

---

## What the app does

When you open Planty, it asks for your location so it can check the weather. Then it shows you your plants and how many days until each one needs water.

**Home** — Your plant list. Each card shows how long until the next watering. Cards turn orange when a plant is due soon and red when it's overdue. Tap Water to log a watering.

**Schedule** — A weekly view of all upcoming waterings across your plants, plus stats on how consistently you've been keeping up.

**Memorial** — Plants you've marked as dead live here. You can revive them from this screen, and if you do, the app remembers why they died and suggests a safer watering schedule.

**Settings** — Export your watering schedule to your calendar, download a backup of all your data, or restore from a backup.

---

## How the schedule works

The app learns from you. Every time you water a plant, it records the date. After a few waterings, it calculates your actual rhythm (not the schedule you set) and uses that going forward. It also adjusts for weather — hotter weather means shorter intervals, colder weather means longer ones.

---

## Notifications

The first time you open the app, it asks permission to send notifications. If you allow it, it will remind you when a plant is due — even if the browser tab is closed.

---

For the full technical breakdown, see [docs.md](docs.md).
