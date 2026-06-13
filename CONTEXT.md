# Planty — Domain Glossary

Canonical terms for smart plant care app. Implementation-agnostic.
Definitions resolve ambiguity across frontend + backend. No code.

---

## Plant
Living indoor plant tracked by app. Has **name**, optional **location**, **species** (optional, from preset DB), **pot size**, **watering interval**. May be alive or dead (**Memorial**).

## Watering Event
Timestamped record that **Plant** was watered. App learns **Adaptive Interval** from event sequence. Each event may be **on time** (within 1 day of schedule) or **late**.

## Interval
Days between waterings. Two forms:

- **Base Interval** — user's initial setting or species default. Starting point.
- **Adaptive Interval** — computed from actual watering history via weighted moving average. Recent behavior → more influence. Clamped to **2–30 days**.

## Environment Multiplier
Scalar applied to **Adaptive Interval** for current conditions. Two sub-multipliers, averaged:

- **Seasonal Multiplier** — summer (0.7), spring (0.9), fall (1.1), winter (1.4). Season detected from month + hemisphere.
- **Temperature Multiplier** — hotter → more frequent watering (range 0.6–1.4).

Hemisphere from geolocation latitude. If unavailable → default northern hemisphere; if temperature unavailable → default 1.0.

## Cooldown
**48-hour** lockout after watering. Prevents accidental double-watering. Same plant cannot be watered again until cooldown expires.

## Health Score
0.0–1.0 score computed per plant from **Care Events**. Formula:

```
health_score = compliance × 0.4 + timeliness × 0.3 + feedback × 0.3
```

- **Compliance** — fraction of scheduled events completed (always 1.0 for events in care_events).
- **Timeliness** — fraction of events completed on time (within 1 day of schedule).
- **Feedback** — avg user-reported plant response: happy (1.0), sad (0.3), overwatered (0.0). Defaults 0.5 if no feedback.

Weights configurable via `shared.py`.

## Care Event
Enriched **Watering Event** moved from staging (**events_raw**) → analytics table (**care_events**) by **Transform** pipeline stage. Includes computed **days_overdue** + **was_on_time** flag.

## Species
Predefined plant type from species DB (32 entries). Provides default **emoji**, **interval**, **light** requirement, **humidity** preference, **difficulty** rating, care **tip**. Selecting species → auto-fills plant form.

## Memorial
Record of plant that died. Stores **cause of death** (overwatering, underwatering, unknown), **last interval** used, **suggested interval** for next plant of same species. When same species added again → app shows **Revival** warning with adjusted schedule.

## Revival
Flow when user adds plant whose species matches **Memorial** entry. Shows old interval, recommended new interval, asks whether replacement (use protection) or different plant (start fresh).

## Pipeline
Backend ETL process running every 5 minutes. Three stages:

- **Ingestion** — upserts raw plant + event data from frontend → staging tables. Validates each item; skips invalid ones.
- **Transform** — moves completed events from staging → **care_events**, computing **days_overdue** (capped at ±365).
- **Aggregation** — computes **Health Score** for every plant with care events.

## Plant Doctor
Symptom checker with 6 symptom categories (yellow leaves, brown tips, drooping, spots, pests, no growth), each mapping to 3 possible causes with treatment guidance. Species-specific tips shown when available.