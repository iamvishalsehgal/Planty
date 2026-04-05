# frontend/

The entire Planty UI lives in a single file: `index.html`. There is no framework, no build step, no bundler output — Vite just serves it as a static file. All JavaScript and CSS are inline.

---

## Adaptive scheduling

The core of the app is a per-plant interval calculator that works in three steps.

**Step 1 — Base interval from watering history**

Every time a user waters a plant, the timestamp is appended to `planty_history` in localStorage. `getBaseInterval()` reads that history and computes a weighted moving average of the gaps between waterings, with more recent gaps weighted higher (`1.5^i`). This means the schedule shifts toward current behaviour, not the initial setting.

```
gaps   = [actual days between each watering]
weight = 1.5^index   ← recent gaps count more
base   = Σ(gap × weight) / Σ(weight)
```

If there are fewer than 2 waterings in history, the user-set interval is used as-is.

**Step 2 — Environment multiplier**

`getEnvironmentMultiplier()` averages two sub-multipliers:

*Seasonal:*
| Season | Multiplier | Effect |
|---|---|---|
| Summer | 0.7 | Shorter interval — water more often |
| Spring | 0.9 | Slightly shorter |
| Fall | 1.1 | Slightly longer |
| Winter | 1.4 | Longer interval — water less often |

*Temperature (from Open-Meteo live weather):*
| Temp | Multiplier |
|---|---|
| ≥ 35°C | 0.6 |
| ≥ 30°C | 0.75 |
| ≥ 25°C | 0.85 |
| 20–25°C | 1.0 (neutral) |
| ≥ 15°C | 1.1 |
| ≥ 10°C | 1.25 |
| < 10°C | 1.4 |

**Step 3 — Final adjusted interval**

```
adjusted = round(base × environment_multiplier)
clamped  = max(2, min(30, adjusted))
```

Result is clamped to 2–30 days to prevent degenerate schedules.

---

## 48-hour cooldown

`canWaterPlant()` checks how many hours have passed since the last watering. If under 48 hours, the water button is blocked and a modal explains why. This prevents accidental double-waterings which would corrupt the interval learning history.

---

## Death learning

When a plant is marked dead, the user records the cause: overwatering, underwatering, or unknown. That record is stored in `planty_dead` in localStorage.

If the same plant name is added again later, `combineDeathLearning()` finds all previous deaths for that name and calculates a corrected starting interval:

- Each overwatering death multiplies the interval by `1.25 + (count × 0.1)` — water less
- Each underwatering death multiplies by `0.8 - (count × 0.05)` — water more
- If both causes appear in the history, the result is averaged back toward the original to avoid overcorrection

The user sees the suggested corrected interval before confirming and can accept or ignore it.

---

## Weather

`fetchWeather()` calls the Open-Meteo API using the browser's geolocation. It reads `hourly.temperature_2m` and `hourly.relativehumidity_2m` for the current hour. Results are cached for 1 hour in `planty_env` (localStorage). If geolocation is denied or the fetch fails, the app falls back to season-only scaling.

Season is detected from the current month. Hemisphere is inferred from the Open-Meteo timezone string in the response.

---

## Notification system

On first load the app requests browser notification permission. If granted:

1. `getPlantsNeedingWater()` checks all live plants for `daysUntil <= 0`
2. Due or overdue plants are sent to the Service Worker via `postMessage({ type: 'NOTIFY_PLANTS', plants })`
3. `sw.js` calls `self.registration.showNotification()` per plant — this works even when the tab is in the background
4. The check repeats every hour via `setInterval`

Clicking a notification focuses the open Planty tab or opens the app URL if no tab is open.

---

## Tabs

**Home** — Plant cards showing a live water countdown per plant. Cards change colour by urgency: overdue (red), due today (orange), due tomorrow (yellow), normal (green). The Water button records the event, updates watering history, and fires a backend sync.

**Schedule** — Weekly calendar grid of upcoming waterings across all plants. Compliance stats (total watered, overdue count, average interval) are pulled from `/api/analytics/summary`. If the backend is unreachable, it falls back to local calculation.

**Memorial** — All plants marked as dead, with cause and date. Any plant can be revived from here, which triggers the death learning flow before the plant is re-added to the active list.

**Settings** — Export a `.ics` calendar file with watering reminders for every plant. Download a full JSON backup of all state. Restore from a backup file. Clear everything and start fresh.

---

## localStorage schema

| Key | Contents |
|---|---|
| `planty_plants` | Live plant objects — `{ id, name, location, interval, isProtected }` |
| `planty_dead` | Dead plant records — `{ name, cause, deathDate, lastInterval }` |
| `planty_history` | Watering events — `{ plantId, date }` |
| `planty_env` | Cached environment state — `{ temperature, humidity, season, lastFetch }` |
