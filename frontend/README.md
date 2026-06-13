# frontend/

This folder = entire Planty app. One HTML file — `index.html` — contains everything: design, logic, all four screens.

---

## What the app does

Opens → asks location for weather. Shows plants + days until each needs water.

**Home** — Plant list. Each card shows time until next watering. Cards: orange = due soon, red = overdue. Tap Water → log watering.

**Schedule** — Weekly view of all upcoming waterings + consistency stats.

**Memorial** — Dead plants live here. Revive from this screen → app remembers cause of death → suggests safer watering schedule.

**Settings** — Export schedule to calendar, download data backup, restore from backup.

---

## How the schedule works

App learns from you. Each watering → records date. After few waterings → calculates actual rhythm (not set schedule) → uses that going forward. Adjusts for weather — hotter → shorter intervals, colder → longer.

---

## Notifications

First open → asks notification permission. Allowed → reminds when plant due — even with browser tab closed.

---

Full technical breakdown: [docs.md](docs.md).