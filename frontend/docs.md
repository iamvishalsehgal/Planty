# frontend/ — Technical Reference

## Architecture

The entire UI is a single self-contained `index.html` file with all CSS and JavaScript inline. Vite is used only as a local dev server; it proxies `/api/*` requests to the backend at `:3001`. No framework, no bundler output, no build step required in production.

`sw.js` is a Service Worker registered on startup for background push notifications.

---

## Adaptive scheduling — implementation

### Base interval: `getBaseInterval(plantId, defaultInterval)`

Collects all watering events for the plant from `planty_history`, sorts by date, and computes gaps in days between consecutive waterings. Gaps outside the range 2–30 are discarded as outliers.

Applies a weighted moving average with exponentially increasing weights (`1.5^i`) so recent behaviour has more influence:

```js
let sum = 0, weight = 0;
intervals.forEach((v, i) => {
    const w = Math.pow(1.5, i);
    sum += v * w;
    weight += w;
});
return Math.round(sum / weight);
```

Falls back to `defaultInterval` if fewer than 2 watering events exist.

### Environment multiplier: `getEnvironmentMultiplier()`

Averages two sub-multipliers:

**Seasonal (`getSeasonalMultiplier`):**
| Season | Multiplier |
|---|---|
| Summer | 0.7 |
| Spring | 0.9 |
| Fall | 1.1 |
| Winter | 1.4 |

Hemisphere detection: if the Open-Meteo timezone string contains `"America"`, `"Europe"`, `"Africa"`, or `"Asia"` it's treated as northern hemisphere; otherwise southern hemisphere (months are flipped).

**Temperature (`getTemperatureMultiplier`):**
| Temp °C | Multiplier |
|---|---|
| ≥ 35 | 0.6 |
| ≥ 30 | 0.75 |
| ≥ 25 | 0.85 |
| 20–25 | 1.0 |
| ≥ 15 | 1.1 |
| ≥ 10 | 1.25 |
| < 10 | 1.4 |

If no temperature data is available, returns `1.0`.

Combined: `(seasonal + temperature) / 2`

### Final interval: `getAdjustedInterval(plantId, defaultInterval)`

```js
adjusted = Math.round(base * getEnvironmentMultiplier())
clamped  = Math.max(2, Math.min(30, adjusted))
```

### Days until next watering: `getDaysUntilNextWater(plantId, defaultInterval)`

```js
daysSince = Math.floor((Date.now() - lastWateringDate) / 86400000)
daysUntil = Math.max(0, adjustedInterval - daysSince)
```

Returns 0 if due today, negative if overdue (rendered as overdue state in UI).

---

## 48-hour cooldown: `canWaterPlant(plantId)`

Reads the last entry in `planty_history` for the plant and computes elapsed hours:
```js
hours = (Date.now() - lastWateringTimestamp) / (1000 * 60 * 60)
if (hours < 48) return { allowed: false, hoursLeft: Math.ceil(48 - hours) }
```

---

## Death learning: `combineDeathLearning(deadPlants)`

Receives all previous death records for a plant name, sorted by death date. Iterates through them accumulating an adjusted interval:

```js
overwatering:   adjustedInterval = Math.min(30, Math.round(adjustedInterval * (1.25 + count * 0.1)))
underwatering:  adjustedInterval = Math.max(2,  Math.round(adjustedInterval * (0.80 - count * 0.05)))
unknown:        adjustedInterval = Math.min(30, Math.round(adjustedInterval * 1.1))
```

If both overwatering and underwatering appear in history, final result is averaged back toward the original:
```js
adjustedInterval = Math.round((originalInterval + adjustedInterval) / 2)
```

---

## Weather: `fetchWeather()`

1. Calls `navigator.geolocation.getCurrentPosition()`
2. Requests `https://api.open-meteo.com/v1/forecast` with `hourly=temperature_2m,relativehumidity_2m&timezone=auto`
3. Finds the index matching the current hour in the `hourly.time` array
4. Reads `temperature_2m[index]` and `relativehumidity_2m[index]`
5. Stores result in `environment` object and saves to `planty_env` in localStorage
6. Cache TTL: 1 hour (`environment.lastFetch` timestamp check)

Fallback: if geolocation is denied or the fetch fails, `environment.temperature` stays `null` and only seasonal scaling is applied.

---

## Notification system

### Service Worker registration
```js
navigator.serviceWorker.register('/sw.js')
```

### Permission request
```js
Notification.requestPermission()  // 'granted' | 'denied' | 'default'
```

### Triggering notifications
`getPlantsNeedingWater()` filters live plants where `daysUntil <= 0` and maps them to `{ id, message }` objects.

These are posted to the Service Worker:
```js
swRegistration.active.postMessage({ type: 'NOTIFY_PLANTS', plants })
```

`sw.js` receives the message and calls `self.registration.showNotification()` per plant. The `tag` is set to `plant-{id}` so repeated checks don't stack duplicate notifications for the same plant.

Fallback if SW is unavailable: `new Notification(title, { body, tag })` directly.

Re-check interval: `setInterval(sendWaterNotifications, 3600000)` (every hour).

---

## localStorage schema

| Key | Type | Contents |
|---|---|---|
| `planty_plants` | Array | `{ id, name, location, interval, isProtected, isProtectedData }` |
| `planty_dead` | Array | `{ id, name, location, cause, deathDate, lastInterval }` |
| `planty_history` | Array | `{ id, plantId, date (ISO string) }` |
| `planty_env` | Object | `{ temperature, humidity, season, lastFetch (timestamp) }` |

---

## Confidence score: `getConfidence(plantId)`

```js
Math.min(100, Math.round(20 + history.length * 16))
```

Starts at 20% with no history. Each watering adds 16 percentage points, capping at 100%.

---

## ICS export

Generates a `.ics` calendar file for every active plant. For each plant, computes the next watering date and creates a VEVENT with a 10-minute duration, a `RRULE:FREQ=DAILY;INTERVAL={adjustedInterval}` recurrence rule, and a reminder alarm 2 hours before (`VALARM` with `TRIGGER:-PT2H`).
