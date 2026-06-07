# Planty — Domain Glossary

Canonical terms for the smart plant care application. Implementation-agnostic.
Definitions resolve ambiguity across frontend and backend. No code.

---

## Plant
A living indoor plant tracked by the app. Has a **name**, optional **location**, **species** (optional, from preset database), **pot size**, and a **watering interval**. May be alive or dead (**Memorial**).

## Watering Event
A timestamped record that a **Plant** was watered. The app learns the **Adaptive Interval** from the sequence of watering events. Each event may be **on time** (within 1 day of schedule) or **late**.

## Interval
The number of days between waterings. Two forms:

- **Base Interval** — the user's initial setting or species default. A starting point.
- **Adaptive Interval** — computed from actual watering history using a weighted moving average. Recent behavior has more influence. Clamped to **2–30 days**.

## Environment Multiplier
A scalar applied to the **Adaptive Interval** to account for current conditions. Composed of two sub-multipliers, averaged:

- **Seasonal Multiplier** — summer (0.7), spring (0.9), fall (1.1), winter (1.4). Season detected from month + hemisphere.
- **Temperature Multiplier** — hotter = more frequent watering (range 0.6–1.4).

Hemisphere determined from geolocation latitude. If unavailable, defaults to northern hemisphere; if temperature unavailable, defaults to 1.0.

## Cooldown
A **48-hour** lockout after watering. Prevents accidental double-watering. The same plant cannot be watered again until the cooldown expires.

## Health Score
A 0.0–1.0 score computed per plant from its **Care Events**. Formula:

```
health_score = compliance × 0.4 + timeliness × 0.3 + feedback × 0.3
```

- **Compliance** — fraction of scheduled events that were completed (always 1.0 for events in care_events).
- **Timeliness** — fraction of events completed on time (within 1 day of schedule).
- **Feedback** — average user-reported plant response: happy (1.0), sad (0.3), overwatered (0.0). Defaults to 0.5 if no feedback.

Weights configurable via `shared.py`.

## Care Event
An enriched **Watering Event** moved from staging (**events_raw**) to the analytics table (**care_events**) by the **Transform** pipeline stage. Includes computed **days_overdue** and **was_on_time** flag.

## Species
A predefined plant type from the species database (32 entries). Provides default **emoji**, **interval**, **light** requirement, **humidity** preference, **difficulty** rating, and a care **tip**. Selecting a species auto-fills the plant form.

## Memorial
A record of a plant that died. Stores **cause of death** (overwatering, underwatering, unknown), the **last interval** used, and a **suggested interval** for the next plant of the same species. When the same species is added again, the app shows a **Revival** warning with the adjusted schedule.

## Revival
The flow when a user adds a plant whose species matches a **Memorial** entry. Shows the old interval, the recommended new interval, and asks whether this is a replacement (use protection) or a different plant (start fresh).

## Pipeline
The backend ETL process running every 5 minutes. Three stages:

- **Ingestion** — upserts raw plant and event data from the frontend into staging tables. Validates each item; skips invalid ones.
- **Transform** — moves completed events from staging to **care_events**, computing **days_overdue** (capped at ±365).
- **Aggregation** — computes a **Health Score** for every plant with care events.

## Plant Doctor
A symptom checker with 6 symptom categories (yellow leaves, brown tips, drooping, spots, pests, no growth), each mapping to 3 possible causes with treatment guidance. Species-specific tips shown when available.
