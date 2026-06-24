# Graph Report - .  (2026-06-24)

## Corpus Check
- 63 files · ~53,943 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 372 nodes · 452 edges · 54 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Vanilla JS Core Functions|Vanilla JS Core Functions]]
- [[_COMMUNITY_Backend Test Suite|Backend Test Suite]]
- [[_COMMUNITY_Backend Data Models|Backend Data Models]]
- [[_COMMUNITY_Backend Core & Health|Backend Core & Health]]
- [[_COMMUNITY_Page Components|Page Components]]
- [[_COMMUNITY_UI Utilities|UI Utilities]]
- [[_COMMUNITY_Weather & Environment|Weather & Environment]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]
- [[_COMMUNITY_Frontend Weather Client|Frontend Weather Client]]
- [[_COMMUNITY_Backend Weather Service|Backend Weather Service]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Error Handling|Error Handling]]
- [[_COMMUNITY_Weather Icons|Weather Icons]]
- [[_COMMUNITY_Notification System|Notification System]]
- [[_COMMUNITY_E2E Test Suite (React)|E2E Test Suite (React)]]
- [[_COMMUNITY_Backend Documentation|Backend Documentation]]
- [[_COMMUNITY_Modal System|Modal System]]
- [[_COMMUNITY_Design System|Design System]]
- [[_COMMUNITY_Graph Analysis|Graph Analysis]]
- [[_COMMUNITY_Settings Store|Settings Store]]
- [[_COMMUNITY_Breath Ring|Breath Ring]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Tab Navigation|Tab Navigation]]
- [[_COMMUNITY_Empty State|Empty State]]
- [[_COMMUNITY_CountUp Animation|CountUp Animation]]
- [[_COMMUNITY_Season Banner|Season Banner]]
- [[_COMMUNITY_Memorial Page|Memorial Page]]
- [[_COMMUNITY_Diagnose Page|Diagnose Page]]
- [[_COMMUNITY_API Documentation|API Documentation]]
- [[_COMMUNITY_Death Cause Selection|Death Cause Selection]]
- [[_COMMUNITY_Bottom Watering|Bottom Watering]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Tests Init|Tests Init]]
- [[_COMMUNITY_Routes Init|Routes Init]]
- [[_COMMUNITY_Services Init|Services Init]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_React Entry|React Entry]]
- [[_COMMUNITY_ICS Export|ICS Export]]
- [[_COMMUNITY_Watering Cooldown|Watering Cooldown]]
- [[_COMMUNITY_Watering Interval|Watering Interval]]
- [[_COMMUNITY_Tab Bar Navigation|Tab Bar Navigation]]
- [[_COMMUNITY_PWA Meta|PWA Meta]]
- [[_COMMUNITY_Agent Skills|Agent Skills]]
- [[_COMMUNITY_Backend Architecture|Backend Architecture]]
- [[_COMMUNITY_Production Deploy|Production Deploy]]
- [[_COMMUNITY_Offline Fallback|Offline Fallback]]
- [[_COMMUNITY_HashRouter Rationale|HashRouter Rationale]]
- [[_COMMUNITY_Tailwind Rationale|Tailwind Rationale]]
- [[_COMMUNITY_Form Input Clearing|Form Input Clearing]]
- [[_COMMUNITY_Isolated Nodes|Isolated Nodes]]
- [[_COMMUNITY_E2E Smoke Tests (Vanilla JS)|E2E Smoke Tests (Vanilla JS)]]

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

### Community 0 - "Vanilla JS Core Functions"
Cohesion: 0.06
Nodes (61): Three Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Core Patterns (derived state, innerHTML rendering, debounced render, XSS, IIFE), Rationale: Derived state over stored state — never stale, Rationale: Hash-free routing — tab navigation, no URL state, Rationale: innerHTML over virtual DOM — simpler mental model, Key Functions Table (getAdjustedInterval, getBaseInterval, getDaysUntilNextWater, combineDeathLearning, render), Rationale: localStorage over backend DB — zero server costs (+53 more)

### Community 1 - "Backend Test Suite"
Cohesion: 0.06
Nodes (11): _create_plant(), Tests for Planty v2 API routes., Send rapid requests — at least one should be rate-limited., Helper: create a plant and return the JSON response., TestDiagnosis, TestHealth, TestPlants, TestRateLimit (+3 more)

### Community 2 - "Backend Data Models"
Cohesion: 0.09
Nodes (32): BaseModel, diagnose(), diagnose_plant(), Plant diagnosis service — rule-based for MVP, ready for AI upgrade.  Uses heuris, Analyze a plant photo and return a diagnosis., Analyze plant photo and return diagnosis.      Currently uses heuristic matching, DiagnosisRequest, DiagnosisResponse (+24 more)

### Community 3 - "Backend Core & Health"
Cohesion: 0.07
Nodes (22): App(), check_db_health(), get_db(), init_db(), Database setup — PostgreSQL via SQLAlchemy with connection pooling., Create tables if they don't exist., Verify database connectivity. Returns True if healthy., Get a database session (FastAPI dependency). (+14 more)

### Community 4 - "Page Components"
Cohesion: 0.12
Nodes (12): AddPlant(), Calendar(), Dashboard(), getGreetingSubtitle(), toF(), getAdjustment(), getSeason(), Layout() (+4 more)

### Community 5 - "UI Utilities"
Cohesion: 0.12
Nodes (6): daysUntil(), formatDate(), PlantCard(), PlantDetail(), computeHealthStatus(), useWatering()

### Community 6 - "Weather & Environment"
Cohesion: 0.17
Nodes (16): Rationale: Open-Meteo over API-key services — free, no registration, Adaptive watering — base interval adjusted by environment, Cold Season: Higher Multiplier = Less Frequent Watering, detectSeason(), Environment Object (temperature, season, hemisphere, lat/lng), fetchWeather(), getEnvironmentMultiplier(), getSeasonalMultiplier() (+8 more)

### Community 7 - "Shared UI Components"
Cohesion: 0.13
Nodes (14): Content Security Policy meta tag — default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com, P0-11 CSP test — queries meta[http-equiv=Content-Security-Policy], asserts default-src present, Planty E2E Security & Regression Smoke test suite — 11 P0 tests via Playwright, P0-8 Error boundary test — dispatches synthetic ErrorEvent, asserts app survives uncaugh error, P0-4 esc() integrity test — adds plant with special chars (&), asserts correct textContent rendering, P0-9 Export test — verifies exportData on window, checks localStorage has plant data, P0-10 ICS escape test — directly calls icsEscape(), asserts semicolon and comma escaping for iCalendar format, P0-2 IIFE encapsulation test — verifies 16 public functions on window, checks private internals are not leaked (+6 more)

### Community 8 - "Architecture Decisions"
Cohesion: 0.17
Nodes (5): Button(), cn(), GlassCard(), Skeleton(), SpeciesBadge()

### Community 9 - "Frontend Weather Client"
Cohesion: 0.46
Nodes (7): cacheWeather(), fetchWeather(), getCachedWeather(), getPosition(), getWeather(), isRainyCode(), weatherCodeToCondition()

### Community 10 - "Backend Weather Service"
Cohesion: 0.29
Nodes (5): get_weather(), Weather service — fetches from Open-Meteo (free, no API key)., Fetch current weather from Open-Meteo., Get current weather for plant care decisions., weather()

### Community 11 - "Backend Config"
Cohesion: 0.33
Nodes (3): _Config, Application configuration — loaded from environment with sensible defaults., Centralised config — reads env at init, supports overrides for tests.

### Community 12 - "Error Handling"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 13 - "Weather Icons"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Notification System"
Cohesion: 0.6
Nodes (3): hasPermission(), scheduleReminders(), stopReminders()

### Community 15 - "E2E Test Suite (React)"
Cohesion: 0.4
Nodes (3): Modal System (death/revival/duplicate/cooldown), showDeathModal(), showModal()

### Community 16 - "Backend Documentation"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Modal System"
Cohesion: 0.5
Nodes (4): Design System — Nature Palette (CSS Custom Properties), CSS Custom Properties (Design Tokens), Glass-Morphism Card Design, Glass-morphism UI

### Community 18 - "Design System"
Cohesion: 0.5
Nodes (4): Architecture decisions, Rationale: localStorage over backend DB, Rationale: Zustand over Redux, Rationale: localStorage chosen for zero server costs

### Community 19 - "Graph Analysis"
Cohesion: 0.5
Nodes (4): FastAPI server — SQLite dev / PostgreSQL production, Python dependencies, Rationale: SQLite over PostgreSQL (dev), Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI

### Community 20 - "Settings Store"
Cohesion: 0.5
Nodes (4): Edge Density 1.07 (target 1.5+) — codebase more colocated than connected, Knowledge Graph Visualization (vis-network), God Nodes: TestPlants (18 edges), _create_plant (12), PlantCreate (6), Knowledge Graph Statistics (267 nodes, 285 edges, 50 communities)

### Community 21 - "Breath Ring"
Cohesion: 1.0
Nodes (2): loadFromStorage(), persistSettings()

### Community 22 - "Project Overview"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Tab Navigation"
Cohesion: 0.67
Nodes (3): Project structure, Planty SPA — vanilla JS app entry, Planty v3 — smart plant care web app overview

### Community 24 - "Empty State"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "CountUp Animation"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Season Banner"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Memorial Page"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Diagnose Page"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "API Documentation"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Death Cause Selection"
Cohesion: 1.0
Nodes (2): Backend API overview — 11 endpoints, API endpoints — plants CRUD, watering, diagnosis, weather

### Community 31 - "Bottom Watering"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "PostCSS Config"
Cohesion: 1.0
Nodes (1): Bottom Watering Education

### Community 33 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Tests Init"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Routes Init"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Services Init"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Service Worker"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "React Entry"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "ICS Export"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Watering Cooldown"
Cohesion: 1.0
Nodes (1): ICS calendar export — RRULE-based watering schedule

### Community 42 - "Watering Interval"
Cohesion: 1.0
Nodes (1): Bottom watering education

### Community 43 - "Tab Bar Navigation"
Cohesion: 1.0
Nodes (1): 24-hour watering cooldown enforcement

### Community 44 - "PWA Meta"
Cohesion: 1.0
Nodes (1): Four-tab SPA navigation — Home, Schedule, Memorial, Settings

### Community 45 - "Agent Skills"
Cohesion: 1.0
Nodes (1): PWA meta tags

### Community 46 - "Backend Architecture"
Cohesion: 1.0
Nodes (1): Agent skills — GitHub Issues triage workflow

### Community 47 - "Production Deploy"
Cohesion: 1.0
Nodes (1): Backend architecture — main, config, db, models, routes

### Community 48 - "Offline Fallback"
Cohesion: 1.0
Nodes (1): Production deployment

### Community 49 - "HashRouter Rationale"
Cohesion: 1.0
Nodes (1): Offline fallback page — PWA network-loss UI

### Community 50 - "Tailwind Rationale"
Cohesion: 1.0
Nodes (1): Rationale: HashRouter over BrowserRouter

### Community 51 - "Form Input Clearing"
Cohesion: 1.0
Nodes (1): Rationale: Tailwind over CSS-in-JS

### Community 52 - "Isolated Nodes"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "E2E Smoke Tests (Vanilla JS)"
Cohesion: 1.0
Nodes (1): 51 Isolated Nodes (19% of graph)

## Knowledge Gaps
- **78 isolated node(s):** `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.`, `Get a database session (FastAPI dependency).`, `Application configuration — loaded from environment with sensible defaults.` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `CountUp Animation`** (2 nodes): `EmptyState()`, `EmptyState.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Season Banner`** (2 nodes): `CountUp()`, `CountUp.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Memorial Page`** (2 nodes): `SeasonBanner()`, `SeasonBanner.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Diagnose Page`** (2 nodes): `Memorial()`, `Memorial.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Documentation`** (2 nodes): `Diagnose()`, `Diagnose.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Death Cause Selection`** (2 nodes): `Backend API overview — 11 endpoints`, `API endpoints — plants CRUD, watering, diagnosis, weather`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bottom Watering`** (2 nodes): `selectCause()`, `updateCauseSelection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (2 nodes): `Bottom Watering Education`, `toggleBottomWaterInfo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tests Init`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Routes Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Services Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Worker`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Entry`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ICS Export`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Watering Cooldown`** (1 nodes): `ICS calendar export — RRULE-based watering schedule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Watering Interval`** (1 nodes): `Bottom watering education`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tab Bar Navigation`** (1 nodes): `24-hour watering cooldown enforcement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA Meta`** (1 nodes): `Four-tab SPA navigation — Home, Schedule, Memorial, Settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agent Skills`** (1 nodes): `PWA meta tags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Architecture`** (1 nodes): `Agent skills — GitHub Issues triage workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Production Deploy`** (1 nodes): `Backend architecture — main, config, db, models, routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Offline Fallback`** (1 nodes): `Production deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HashRouter Rationale`** (1 nodes): `Offline fallback page — PWA network-loss UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Rationale`** (1 nodes): `Rationale: HashRouter over BrowserRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Form Input Clearing`** (1 nodes): `Rationale: Tailwind over CSS-in-JS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Isolated Nodes`** (1 nodes): `clearInputs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Smoke Tests (Vanilla JS)`** (1 nodes): `51 Isolated Nodes (19% of graph)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HealthResponse` connect `Backend Data Models` to `Backend Core & Health`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `setup_db()` connect `Backend Core & Health` to `Backend Test Suite`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getAdjustedInterval()` (e.g. with `Environment Object (temperature, season, hemisphere, lat/lng)` and `Seasonal Watering Multiplier`) actually correct?**
  _`getAdjustedInterval()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vanilla JS Core Functions` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Backend Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Backend Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._