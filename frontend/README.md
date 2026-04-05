# Frontend

The entire frontend is a single HTML file (`index.html`) with all CSS and JavaScript embedded inline. There is no framework, no component library, and no build-time dependencies — just a `<script>` block and a `<style>` block. Vite is used only as a local dev server with an `/api` proxy; it is not involved in the production build at all.

The app is a PWA-ready mobile-first UI with a bottom tab bar, card-based layout, and support for "Add to Home Screen" on iOS and Android.

---

## The 4 tabs

### Home

The main view. Shows a card for each plant with:

- Name, location, emoji (auto-detected from name keywords)
- Watering countdown: days until next water, colour-coded (green → yellow → red → overdue)
- Stats: total waterings, current adjusted interval, days since last watered
- A **Water** button — logs the watering and updates the countdown immediately
- A **Mark as dead** button — opens the death modal

The **Add Plant** form is also on this tab. Fields:
- Name (required)
- Location (optional — used to tell apart multiple plants of the same type)
- Watering frequency: choose from preset buttons (every 3, 5, 7, 10, or 14 days)

### Schedule

An overview of your collection's health:

- Stats grid: total plants, total waterings, average interval, overdue count
- Analytics panel: this week's and this month's waterings, due today/soon, overdue count
- 7-day calendar strip showing which plants need water on which day
- Upcoming waterings list (next 7 plants sorted by urgency)

### Memorial

A record of every plant that didn't make it. Plants are grouped by normalised name so you can see the full history of a plant across multiple purchases. For each group, the app shows the original interval, the cause(s) of death (overwatering / underwatering / unknown), and the improved interval that will be suggested if you add the same plant again.

### Settings

- **Export to Calendar** — generates an `.ics` file with a recurring `VEVENT` per plant (set to repeat at each plant's adjusted interval with a 1-hour alarm). Opens in Apple Calendar, Google Calendar, Outlook, etc.
- **Export Backup** — downloads a JSON file with all plants, dead plants, and watering history
- **Import Backup** — restores from a previously exported JSON file
- **Clear All Data** — wipes localStorage and reloads
- Install instructions for iOS and Android home screen

---

## Key features

### Watering countdown

`getDaysUntilNextWater(plantId)` computes:

1. The adjusted interval for this plant (see below)
2. Days since the last watering entry in history
3. `max(0, adjustedInterval - daysSince)` — negative means overdue

### 48-hour cooldown

`COOLDOWN_HOURS = 48`. Tapping Water when the last watering was less than 48 hours ago is blocked with a modal explaining the cooldown. This prevents accidental double-waterings.

### Adaptive interval — weighted moving average

`getBaseInterval(plantId)` looks at the actual gaps between all past waterings for that plant. It computes a weighted average where more recent intervals carry exponentially more weight (weight = `1.5^i`). Any gap outside 2–30 days is ignored as noise. The result is the plant's "learned" base interval.

### Environment scaling

Two multipliers are applied on top of the base interval:

**Season multiplier** (detected from hemisphere + current month, or from GPS if available):
| Season | Multiplier |
|--------|-----------|
| Summer | 0.7× (water more often) |
| Spring | 0.9× |
| Fall | 1.1× |
| Winter | 1.4× (water less often) |

**Temperature multiplier** (from Open-Meteo, if geolocation is granted):
| Temperature | Multiplier |
|-------------|-----------|
| ≥35°C | 0.6× |
| 30–35°C | 0.75× |
| 25–30°C | 0.85× |
| 20–25°C | 1.0× |
| 15–20°C | 1.1× |
| 10–15°C | 1.25× |
| <10°C | 1.4× |

The final environment multiplier is the average of the two: `(seasonMultiplier + tempMultiplier) / 2`. The adjusted interval is then clamped to a minimum of 2 days and a maximum of 30 days.

### Death and revival system

When you mark a plant as dead, you pick a cause: overwatering, underwatering, or unknown. The plant is moved to `state.deadPlants` with its final interval, the cause, and a suggested corrected interval:
- Overwatered: next interval = `round(lastInterval × 1.3)`, max 30
- Underwatered: next interval = `round(lastInterval × 0.75)`, min 2
- Unknown: interval stays the same

If you later add a plant with the same normalised name, the revival modal appears. It shows the death history and the suggested interval. Choosing "Yes, it's a replacement" marks the new plant as `isProtected = true` and uses the corrected interval from `combineDeathLearning()`.

`combineDeathLearning()` handles multiple deaths of the same plant name. It walks through all deaths chronologically, accumulating the interval adjustments: each overwatering adds 25% + 10% per additional overwatering; each underwatering subtracts 20% + 5% per additional underwatering. If both types occurred, the result is averaged back toward the original interval.

### Duplicate detection

If you add a plant with the same normalised name as an existing live plant and don't provide a location, a modal asks whether you have multiple of this plant. If yes, the location field is pre-filled with `#2` (or `#3`, etc.) so you can distinguish them.

### ICS export

`generateICSContent()` creates a valid iCalendar file with one `VEVENT` per plant. Each event:
- Starts on the plant's next calculated watering date
- Repeats with `RRULE:FREQ=DAILY;INTERVAL=<adjustedInterval>`
- Includes a `VALARM` set 1 hour before

### JSON backup / restore

Export downloads `planty-backup-<date>.json` containing `plants`, `deadPlants`, and `history` arrays. Import reads a file, merges the three arrays into state, saves to localStorage, and re-renders.

### Open-Meteo weather

`fetchWeather()` is called on load and then once per hour (`setInterval(fetchWeather, 3600000)`). It:
1. Skips the fetch if the last fetch was less than 1 hour ago (cached in `planty_env` in localStorage)
2. Requests geolocation via `navigator.geolocation`
3. If granted, fetches `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current_weather=true`
4. Stores the temperature in the environment object and saves to localStorage
5. Falls back gracefully if geolocation is denied or the fetch fails — the app still works, just without the temperature multiplier

---

## Confidence score

`getConfidence(plantId)` returns `min(100, 20 + waterings × 16)`. It reaches 100% after 5 waterings. This is displayed on plant cards to indicate how reliable the learned interval is.

---

## localStorage data model

All data lives in the browser. Nothing is automatically synced to the backend — sync is triggered manually via the backend's API routes.

| Key | Type | Contents |
|-----|------|---------|
| `planty_plants` | JSON array | Active plants (`id`, `name`, `location`, `normalized`, `emoji`, `interval`, `isProtected`, `created`) |
| `planty_dead` | JSON array | Dead plants (`id`, `name`, `cause`, `lastInterval`, `suggestedInterval`, `totalWaterings`, `deathDate`, …) |
| `planty_history` | JSON array | Watering events (`plantId`, `date` ISO string) |
| `planty_env` | JSON object | Weather/season state (`temperature`, `season`, `hemisphere`, `latitude`, `longitude`, `lastFetch`) |

Plant IDs are `Date.now()` integers assigned at creation time.

---

## How it talks to the backend

In development, Vite proxies every request starting with `/api` to `http://localhost:3001` (configured in `vite.config.ts`). In production on Render, the backend itself serves `index.html` and all API calls go to the same origin — no proxy needed.

The frontend does not automatically sync with the backend. To push data you call the sync endpoints explicitly (e.g. `POST /api/plants/sync` with your plant array). The backend then runs the ETL pipeline and stores enriched analytics, but the frontend continues to operate independently from localStorage.

---

## Running locally

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Make sure the backend is also running on port 3001 if you want the `/api` routes to work. See the [backend README](../backend/README.md) for backend setup.
