# Graph Report - .  (2026-06-25)

## Corpus Check
- Corpus is ~45,109 words - fits in a single context window. You may not need a graph.

## Summary
- 285 nodes · 370 edges · 38 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Three Architectural Pillars (P  Architectural Pillars (Plant l|Three Architectural Pillars (P / Architectural Pillars (Plant l]]
- [[_COMMUNITY_models.py  diagnosis.py|models.py / diagnosis.py]]
- [[_COMMUNITY_test_routes.py  _create_plant()|test_routes.py / _create_plant()]]
- [[_COMMUNITY_db.py  main.py|db.py / main.py]]
- [[_COMMUNITY_Rationale Open-Meteo over API  Adaptive watering — base inter|Rationale: Open-Meteo over API / Adaptive watering — base inter]]
- [[_COMMUNITY_Content Security Policy meta t  P0-11 CSP test — queries meta|Content Security Policy meta t / P0-11 CSP test — queries meta[]]
- [[_COMMUNITY_Architecture decisions  Rationale localStorage over b|Architecture decisions / Rationale: localStorage over b]]
- [[_COMMUNITY_weather_route.py  weather.py|weather_route.py / weather.py]]
- [[_COMMUNITY_config.py  _Config|config.py / _Config]]
- [[_COMMUNITY_addPlant()  fail()|addPlant() / fail()]]
- [[_COMMUNITY_.storage-warning CSS  dismissStorageWarning()|.storage-warning CSS / dismissStorageWarning()]]
- [[_COMMUNITY_closeModal()  Modal System (deathrevivaldu|closeModal() / Modal System (death/revival/du]]
- [[_COMMUNITY_fail()  e2e-full-test.mjs|fail() / e2e-full-test.mjs]]
- [[_COMMUNITY_FastAPI server — SQLite dev    Python dependencies|FastAPI server — SQLite dev /  / Python dependencies]]
- [[_COMMUNITY_Design System — Nature Palette  CSS Custom Properties (Design|Design System — Nature Palette / CSS Custom Properties (Design ]]
- [[_COMMUNITY_Edge Density 1.07 (target 1.5+  Knowledge Graph Visualization|Edge Density 1.07 (target 1.5+ / Knowledge Graph Visualization ]]
- [[_COMMUNITY_Project structure  Planty SPA — vanilla JS app en|Project structure / Planty SPA — vanilla JS app en]]
- [[_COMMUNITY_Backend API overview — 11 endp  API endpoints — plants CRUD, w|Backend API overview — 11 endp / API endpoints — plants CRUD, w]]
- [[_COMMUNITY_selectCause()  updateCauseSelection()|selectCause() / updateCauseSelection()]]
- [[_COMMUNITY_Bottom Watering Education  toggleBottomWaterInfo()|Bottom Watering Education / toggleBottomWaterInfo()]]
- [[_COMMUNITY_vite.config.js|vite.config.js]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_sw.js|sw.js]]
- [[_COMMUNITY_ICS calendar export — RRULE-ba|ICS calendar export — RRULE-ba]]
- [[_COMMUNITY_Bottom watering education|Bottom watering education]]
- [[_COMMUNITY_24-hour watering cooldown enfo|24-hour watering cooldown enfo]]
- [[_COMMUNITY_Four-tab SPA navigation — Home|Four-tab SPA navigation — Home]]
- [[_COMMUNITY_PWA meta tags|PWA meta tags]]
- [[_COMMUNITY_Agent skills — GitHub Issues t|Agent skills — GitHub Issues t]]
- [[_COMMUNITY_Backend architecture — main, c|Backend architecture — main, c]]
- [[_COMMUNITY_Production deployment|Production deployment]]
- [[_COMMUNITY_Offline fallback page — PWA ne|Offline fallback page — PWA ne]]
- [[_COMMUNITY_Rationale HashRouter over Bro|Rationale: HashRouter over Bro]]
- [[_COMMUNITY_Rationale Tailwind over CSS-i|Rationale: Tailwind over CSS-i]]
- [[_COMMUNITY_clearInputs()|clearInputs()]]
- [[_COMMUNITY_51 Isolated Nodes (19% of grap|51 Isolated Nodes (19% of grap]]

## God Nodes (most connected - your core abstractions)
1. `TestPlants` - 18 edges
2. `State Object (plants, deadPlants, history)` - 14 edges
3. `getAdjustedInterval()` - 13 edges
4. `Planty E2E Security & Regression Smoke test suite — 11 P0 tests via Playwright` - 13 edges
5. `_create_plant()` - 12 edges
6. `render() - debounced dispatcher` - 11 edges
7. `localStorage Persistence Layer` - 10 edges
8. `renderPlants() - innerHTML card list` - 10 edges
9. `fetchWeather()` - 9 edges
10. `Public API (window.* exposure)` - 9 edges

## Surprising Connections (you probably didn't know these)
- `localStorage Persistence Layer` --semantically_similar_to--> `Offline-first — localStorage + import/export backup`  [INFERRED] [semantically similar]
  index.html → README.md
- `Adaptive watering — base interval adjusted by environment` --semantically_similar_to--> `Adaptive watering feature`  [INFERRED] [semantically similar]
  index.html → README.md
- `Rationale: localStorage chosen for zero server costs` --semantically_similar_to--> `Rationale: localStorage over backend DB`  [INFERRED] [semantically similar]
  index.html → CLAUDE.md
- `localStorage Persistence Layer` --rationale_for--> `Zero server costs — static frontend + free weather API`  [INFERRED]
  index.html → README.md
- `Content Security Policy meta tag — default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com` --calls--> `P0-11 CSP test — queries meta[http-equiv=Content-Security-Policy], asserts default-src present`  [EXTRACTED]
  index.html → e2e-smoke.mjs

## Communities

### Community 0 - "Three Architectural Pillars (P / Architectural Pillars (Plant l"
Cohesion: 0.07
Nodes (55): Three Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Core Patterns (derived state, innerHTML rendering, debounced render, XSS, IIFE), Rationale: Derived state over stored state — never stale, Rationale: Hash-free routing — tab navigation, no URL state, Rationale: innerHTML over virtual DOM — simpler mental model, Key Functions Table (getAdjustedInterval, getBaseInterval, getDaysUntilNextWater, combineDeathLearning, render), State Shape (plants[], deadPlants[], history[]) (+47 more)

### Community 1 - "models.py / diagnosis.py"
Cohesion: 0.09
Nodes (32): BaseModel, diagnose(), diagnose_plant(), Plant diagnosis service — rule-based for MVP, ready for AI upgrade.  Uses heuris, Analyze a plant photo and return a diagnosis., Analyze plant photo and return diagnosis.      Currently uses heuristic matching, DiagnosisRequest, DiagnosisResponse (+24 more)

### Community 2 - "test_routes.py / _create_plant()"
Cohesion: 0.06
Nodes (11): _create_plant(), Tests for Planty v2 API routes., Send rapid requests — at least one should be rate-limited., Helper: create a plant and return the JSON response., TestDiagnosis, TestHealth, TestPlants, TestRateLimit (+3 more)

### Community 3 - "db.py / main.py"
Cohesion: 0.07
Nodes (21): check_db_health(), get_db(), init_db(), Database setup — PostgreSQL via SQLAlchemy with connection pooling., Create tables if they don't exist., Verify database connectivity. Returns True if healthy., Get a database session (FastAPI dependency)., health_check() (+13 more)

### Community 4 - "Rationale: Open-Meteo over API / Adaptive watering — base inter"
Cohesion: 0.17
Nodes (16): Rationale: Open-Meteo over API-key services — free, no registration, Adaptive watering — base interval adjusted by environment, Cold Season: Higher Multiplier = Less Frequent Watering, detectSeason(), Environment Object (temperature, season, hemisphere, lat/lng), fetchWeather(), getEnvironmentMultiplier(), getSeasonalMultiplier() (+8 more)

### Community 5 - "Content Security Policy meta t / P0-11 CSP test — queries meta["
Cohesion: 0.13
Nodes (14): Content Security Policy meta tag — default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com, P0-11 CSP test — queries meta[http-equiv=Content-Security-Policy], asserts default-src present, Planty E2E Security & Regression Smoke test suite — 11 P0 tests via Playwright, P0-8 Error boundary test — dispatches synthetic ErrorEvent, asserts app survives uncaugh error, P0-4 esc() integrity test — adds plant with special chars (&), asserts correct textContent rendering, P0-9 Export test — verifies exportData on window, checks localStorage has plant data, P0-10 ICS escape test — directly calls icsEscape(), asserts semicolon and comma escaping for iCalendar format, P0-2 IIFE encapsulation test — verifies 16 public functions on window, checks private internals are not leaked (+6 more)

### Community 6 - "Architecture decisions / Rationale: localStorage over b"
Cohesion: 0.18
Nodes (10): Architecture decisions, Rationale: localStorage over backend DB — zero server costs, Rationale: localStorage over backend DB, Rationale: Zustand over Redux, localStorage Persistence Layer, Plant state management — plants, deadPlants, history, PWA Meta Tags, Rationale: localStorage chosen for zero server costs (+2 more)

### Community 7 - "weather_route.py / weather.py"
Cohesion: 0.29
Nodes (5): get_weather(), Weather service — fetches from Open-Meteo (free, no API key)., Fetch current weather from Open-Meteo., Get current weather for plant care decisions., weather()

### Community 8 - "config.py / _Config"
Cohesion: 0.33
Nodes (3): _Config, Application configuration — loaded from environment with sensible defaults., Centralised config — reads env at init, supports overrides for tests.

### Community 9 - "addPlant() / fail()"
Cohesion: 0.33
Nodes (0): 

### Community 10 - ".storage-warning CSS / dismissStorageWarning()"
Cohesion: 0.67
Nodes (6): .storage-warning CSS, dismissStorageWarning(), save() Storage Quota Handler, Storage Quota Warning Feature, Storage Warning Banner, _storageFull Flag

### Community 11 - "closeModal() / Modal System (death/revival/du"
Cohesion: 0.4
Nodes (3): Modal System (death/revival/duplicate/cooldown), showDeathModal(), showModal()

### Community 12 - "fail() / e2e-full-test.mjs"
Cohesion: 0.5
Nodes (0): 

### Community 13 - "FastAPI server — SQLite dev /  / Python dependencies"
Cohesion: 0.5
Nodes (4): FastAPI server — SQLite dev / PostgreSQL production, Python dependencies, Rationale: SQLite over PostgreSQL (dev), Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI

### Community 14 - "Design System — Nature Palette / CSS Custom Properties (Design "
Cohesion: 0.5
Nodes (4): Design System — Nature Palette (CSS Custom Properties), CSS Custom Properties (Design Tokens), Glass-Morphism Card Design, Glass-morphism UI

### Community 15 - "Edge Density 1.07 (target 1.5+ / Knowledge Graph Visualization "
Cohesion: 0.5
Nodes (4): Edge Density 1.07 (target 1.5+) — codebase more colocated than connected, Knowledge Graph Visualization (vis-network), God Nodes: TestPlants (18 edges), _create_plant (12), PlantCreate (6), Knowledge Graph Statistics (267 nodes, 285 edges, 50 communities)

### Community 16 - "Project structure / Planty SPA — vanilla JS app en"
Cohesion: 0.67
Nodes (3): Project structure, Planty SPA — vanilla JS app entry, Planty v3 — smart plant care web app overview

### Community 17 - "Backend API overview — 11 endp / API endpoints — plants CRUD, w"
Cohesion: 1.0
Nodes (2): Backend API overview — 11 endpoints, API endpoints — plants CRUD, watering, diagnosis, weather

### Community 18 - "selectCause() / updateCauseSelection()"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Bottom Watering Education / toggleBottomWaterInfo()"
Cohesion: 1.0
Nodes (1): Bottom Watering Education

### Community 20 - "vite.config.js"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "__init__.py"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "__init__.py"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "__init__.py"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "sw.js"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "ICS calendar export — RRULE-ba"
Cohesion: 1.0
Nodes (1): ICS calendar export — RRULE-based watering schedule

### Community 26 - "Bottom watering education"
Cohesion: 1.0
Nodes (1): Bottom watering education

### Community 27 - "24-hour watering cooldown enfo"
Cohesion: 1.0
Nodes (1): 24-hour watering cooldown enforcement

### Community 28 - "Four-tab SPA navigation — Home"
Cohesion: 1.0
Nodes (1): Four-tab SPA navigation — Home, Schedule, Memorial, Settings

### Community 29 - "PWA meta tags"
Cohesion: 1.0
Nodes (1): PWA meta tags

### Community 30 - "Agent skills — GitHub Issues t"
Cohesion: 1.0
Nodes (1): Agent skills — GitHub Issues triage workflow

### Community 31 - "Backend architecture — main, c"
Cohesion: 1.0
Nodes (1): Backend architecture — main, config, db, models, routes

### Community 32 - "Production deployment"
Cohesion: 1.0
Nodes (1): Production deployment

### Community 33 - "Offline fallback page — PWA ne"
Cohesion: 1.0
Nodes (1): Offline fallback page — PWA network-loss UI

### Community 34 - "Rationale: HashRouter over Bro"
Cohesion: 1.0
Nodes (1): Rationale: HashRouter over BrowserRouter

### Community 35 - "Rationale: Tailwind over CSS-i"
Cohesion: 1.0
Nodes (1): Rationale: Tailwind over CSS-in-JS

### Community 36 - "clearInputs()"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "51 Isolated Nodes (19% of grap"
Cohesion: 1.0
Nodes (1): 51 Isolated Nodes (19% of graph)

## Knowledge Gaps
- **78 isolated node(s):** `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.`, `Get a database session (FastAPI dependency).`, `Application configuration — loaded from environment with sensible defaults.` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Backend API overview — 11 endp / API endpoints — plants CRUD, w`** (2 nodes): `Backend API overview — 11 endpoints`, `API endpoints — plants CRUD, watering, diagnosis, weather`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `selectCause() / updateCauseSelection()`** (2 nodes): `selectCause()`, `updateCauseSelection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bottom Watering Education / toggleBottomWaterInfo()`** (2 nodes): `Bottom Watering Education`, `toggleBottomWaterInfo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `vite.config.js`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `__init__.py`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `__init__.py`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `__init__.py`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `sw.js`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ICS calendar export — RRULE-ba`** (1 nodes): `ICS calendar export — RRULE-based watering schedule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bottom watering education`** (1 nodes): `Bottom watering education`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `24-hour watering cooldown enfo`** (1 nodes): `24-hour watering cooldown enforcement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Four-tab SPA navigation — Home`** (1 nodes): `Four-tab SPA navigation — Home, Schedule, Memorial, Settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA meta tags`** (1 nodes): `PWA meta tags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agent skills — GitHub Issues t`** (1 nodes): `Agent skills — GitHub Issues triage workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend architecture — main, c`** (1 nodes): `Backend architecture — main, config, db, models, routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Production deployment`** (1 nodes): `Production deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Offline fallback page — PWA ne`** (1 nodes): `Offline fallback page — PWA network-loss UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rationale: HashRouter over Bro`** (1 nodes): `Rationale: HashRouter over BrowserRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rationale: Tailwind over CSS-i`** (1 nodes): `Rationale: Tailwind over CSS-in-JS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `clearInputs()`** (1 nodes): `clearInputs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `51 Isolated Nodes (19% of grap`** (1 nodes): `51 Isolated Nodes (19% of graph)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HealthResponse` connect `models.py / diagnosis.py` to `db.py / main.py`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `setup_db()` connect `db.py / main.py` to `test_routes.py / _create_plant()`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getAdjustedInterval()` (e.g. with `Environment Object (temperature, season, hemisphere, lat/lng)` and `Seasonal Watering Multiplier`) actually correct?**
  _`getAdjustedInterval()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Three Architectural Pillars (P / Architectural Pillars (Plant l` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `models.py / diagnosis.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `test_routes.py / _create_plant()` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._