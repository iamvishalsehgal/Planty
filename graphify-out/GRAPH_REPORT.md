# Graph Report - /Users/iamvishalsehgal/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault/GIT/Planty  (2026-06-26)

## Corpus Check
- 21 files · ~46,258 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 185 nodes · 193 edges · 45 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `TestPlants` - 18 edges
2. `_create_plant()` - 12 edges
3. `PlantCreate` - 6 edges
4. `PlantUpdate` - 6 edges
5. `PlantResponse` - 6 edges
6. `WateringCreate` - 6 edges
7. `WateringResponse` - 6 edges
8. `_row_to_plant()` - 6 edges
9. `Plant CRUD + watering events.` - 6 edges
10. `Determine plant health status based on watering schedule.` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Rationale: localStorage chosen for zero server costs` --semantically_similar_to--> `Rationale: localStorage over backend DB`  [INFERRED] [semantically similar]
  index.html → CLAUDE.md
- `init_db()` --calls--> `lifespan()`  [INFERRED]
  backend/db.py → /Users/iamvishalsehgal/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault/GIT/Planty/backend/main.py
- `check_db_health()` --calls--> `lifespan()`  [INFERRED]
  backend/db.py → /Users/iamvishalsehgal/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault/GIT/Planty/backend/main.py
- `HealthResponse` --uses--> `Health check endpoint with request counting and DB status.`  [INFERRED]
  backend/models.py → backend/routes/health.py
- `HealthResponse` --uses--> `Called by middleware to track request volume.`  [INFERRED]
  backend/models.py → backend/routes/health.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (27): BaseModel, DiagnosisRequest, DiagnosisResponse, HealthResponse, PlantCreate, PlantResponse, PlantUpdate, Pydantic v2 models for Planty API. (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (4): _create_plant(), Helper: create a plant and return the JSON response., TestPlants, TestWatering

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (7): Tests for Planty v2 API routes., Send rapid requests — at least one should be rate-limited., TestDiagnosis, TestHealth, TestRateLimit, TestRoot, TestWeather

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (13): check_db_health(), get_db(), init_db(), Database setup — PostgreSQL via SQLAlchemy with connection pooling., Create tables if they don't exist., Verify database connectivity. Returns True if healthy., Get a database session (FastAPI dependency)., health_check() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (8): increment_request_count(), Health check endpoint with request counting and DB status., Called by middleware to track request volume., process_request(), Planty v2 — FastAPI backend for smart plant care., Update health_status for all plants based on current time., recompute_health_statuses(), SecurityHeadersMiddleware

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (5): get_weather(), Weather service — fetches from Open-Meteo (free, no API key)., Fetch current weather from Open-Meteo., Get current weather for plant care decisions., weather()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (5): diagnose(), diagnose_plant(), Plant diagnosis service — rule-based for MVP, ready for AI upgrade.  Uses heuris, Analyze a plant photo and return a diagnosis., Analyze plant photo and return diagnosis.      Currently uses heuristic matching

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (2): getPlantEmoji(), normalizePlant()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (3): _Config, Application configuration — loaded from environment with sensible defaults., Centralised config — reads env at init, supports overrides for tests.

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (4): Architecture decisions, Rationale: localStorage over backend DB, Rationale: Zustand over Redux, Rationale: localStorage chosen for zero server costs

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): esc(), escapeHtml()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (3): Edge Density 1.07 (target 1.5+) — codebase more colocated than connected, God Nodes: TestPlants (18 edges), _create_plant (12), PlantCreate (6), Knowledge Graph Statistics (267 nodes, 285 edges, 50 communities)

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): Backend API overview — 11 endpoints, API endpoints — plants CRUD, watering, diagnosis, weather

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): Project structure, Planty v3 — smart plant care web app overview

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (2): FastAPI server — SQLite dev / PostgreSQL production, Rationale: SQLite over PostgreSQL (dev)

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Zero server costs — static frontend + free weather API

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Offline-first — localStorage + import/export backup

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Design System — Nature Palette (CSS Custom Properties)

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Agent skills — GitHub Issues triage workflow

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Backend architecture — main, config, db, models, routes

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Production deployment

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Rationale: HashRouter over BrowserRouter

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Rationale: Tailwind over CSS-in-JS

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Adaptive watering feature

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Rationale: Vanilla JS over React — zero deps, 77KB, instant load

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Rationale: localStorage over backend DB — zero server costs

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Rationale: innerHTML over virtual DOM — simpler mental model

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Rationale: Derived state over stored state — never stale

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Rationale: Hash-free routing — tab navigation, no URL state

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Rationale: Open-Meteo over API-key services — free, no registration

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): State Shape (plants[], deadPlants[], history[])

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Core Patterns (derived state, innerHTML rendering, debounced render, XSS, IIFE)

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Key Functions Table (getAdjustedInterval, getBaseInterval, getDaysUntilNextWater, combineDeathLearning, render)

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Three Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence)

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): 51 Isolated Nodes (19% of graph)

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence)

## Knowledge Gaps
- **56 isolated node(s):** `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.`, `Get a database session (FastAPI dependency).`, `Application configuration — loaded from environment with sensible defaults.` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 14`** (2 nodes): `Backend API overview — 11 endpoints`, `API endpoints — plants CRUD, watering, diagnosis, weather`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `Project structure`, `Planty v3 — smart plant care web app overview`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `FastAPI server — SQLite dev / PostgreSQL production`, `Rationale: SQLite over PostgreSQL (dev)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `vitest.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `Zero server costs — static frontend + free weather API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `Offline-first — localStorage + import/export backup`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Design System — Nature Palette (CSS Custom Properties)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Agent skills — GitHub Issues triage workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Backend architecture — main, config, db, models, routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Production deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Rationale: HashRouter over BrowserRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Rationale: Tailwind over CSS-in-JS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Adaptive watering feature`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `Rationale: Vanilla JS over React — zero deps, 77KB, instant load`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Rationale: localStorage over backend DB — zero server costs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Rationale: innerHTML over virtual DOM — simpler mental model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Rationale: Derived state over stored state — never stale`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Rationale: Hash-free routing — tab navigation, no URL state`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Rationale: Open-Meteo over API-key services — free, no registration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `State Shape (plants[], deadPlants[], history[])`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Core Patterns (derived state, innerHTML rendering, debounced render, XSS, IIFE)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Key Functions Table (getAdjustedInterval, getBaseInterval, getDaysUntilNextWater, combineDeathLearning, render)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Three Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `51 Isolated Nodes (19% of graph)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HealthResponse` connect `Community 0` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `setup_db()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `PlantCreate` (e.g. with `Plant CRUD + watering events.` and `Determine plant health status based on watering schedule.`) actually correct?**
  _`PlantCreate` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `PlantUpdate` (e.g. with `Plant CRUD + watering events.` and `Determine plant health status based on watering schedule.`) actually correct?**
  _`PlantUpdate` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._