# Graph Report - .  (2026-06-24)

## Corpus Check
- Corpus is ~46,611 words - fits in a single context window. You may not need a graph.

## Summary
- 354 nodes · 436 edges · 53 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Architecture Documentation|Architecture Documentation]]
- [[_COMMUNITY_Backend Test Suite|Backend Test Suite]]
- [[_COMMUNITY_Backend Data Models & Schemas|Backend Data Models & Schemas]]
- [[_COMMUNITY_Backend Core & Health|Backend Core & Health]]
- [[_COMMUNITY_Page Components|Page Components]]
- [[_COMMUNITY_UI & Date Utilities|UI & Date Utilities]]
- [[_COMMUNITY_Weather & Environment|Weather & Environment]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]
- [[_COMMUNITY_Frontend Weather Client|Frontend Weather Client]]
- [[_COMMUNITY_Backend Weather Service|Backend Weather Service]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Error Handling|Error Handling]]
- [[_COMMUNITY_Weather Icons|Weather Icons]]
- [[_COMMUNITY_Notification System|Notification System]]
- [[_COMMUNITY_E2E Test Suite|E2E Test Suite]]
- [[_COMMUNITY_Backend Documentation|Backend Documentation]]
- [[_COMMUNITY_Modal System|Modal System]]
- [[_COMMUNITY_Design System|Design System]]
- [[_COMMUNITY_Graph Analysis|Graph Analysis]]
- [[_COMMUNITY_Settings Store|Settings Store]]
- [[_COMMUNITY_Breath Ring Component|Breath Ring Component]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Tab Navigation|Tab Navigation]]
- [[_COMMUNITY_Empty State|Empty State]]
- [[_COMMUNITY_CountUp Animation|CountUp Animation]]
- [[_COMMUNITY_Season Banner|Season Banner]]
- [[_COMMUNITY_Memorial Page|Memorial Page]]
- [[_COMMUNITY_Diagnose Page|Diagnose Page]]
- [[_COMMUNITY_API Documentation|API Documentation]]
- [[_COMMUNITY_Death Cause Selection|Death Cause Selection]]
- [[_COMMUNITY_Bottom Watering Info|Bottom Watering Info]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Backend Tests Init|Backend Tests Init]]
- [[_COMMUNITY_Backend Routes Init|Backend Routes Init]]
- [[_COMMUNITY_Backend Services Init|Backend Services Init]]
- [[_COMMUNITY_Service Worker|Service Worker]]
- [[_COMMUNITY_React Entry Point|React Entry Point]]
- [[_COMMUNITY_ICS Calendar Export|ICS Calendar Export]]
- [[_COMMUNITY_Watering Cooldown|Watering Cooldown]]
- [[_COMMUNITY_Watering Interval|Watering Interval]]
- [[_COMMUNITY_Tab Bar Navigation|Tab Bar Navigation]]
- [[_COMMUNITY_PWA Meta Tags|PWA Meta Tags]]
- [[_COMMUNITY_Agent Skills|Agent Skills]]
- [[_COMMUNITY_Backend Architecture|Backend Architecture]]
- [[_COMMUNITY_Production Deployment|Production Deployment]]
- [[_COMMUNITY_PWA Offline Fallback|PWA Offline Fallback]]
- [[_COMMUNITY_HashRouter Rationale|HashRouter Rationale]]
- [[_COMMUNITY_Tailwind Rationale|Tailwind Rationale]]
- [[_COMMUNITY_Form Input Clearing|Form Input Clearing]]
- [[_COMMUNITY_Isolated Knowledge Nodes|Isolated Knowledge Nodes]]

## God Nodes (most connected - your core abstractions)
1. `TestPlants` - 18 edges
2. `State Object (plants, deadPlants, history)` - 14 edges
3. `getAdjustedInterval()` - 13 edges
4. `_create_plant()` - 12 edges
5. `render() - debounced dispatcher` - 11 edges
6. `localStorage Persistence Layer` - 10 edges
7. `renderPlants() - innerHTML card list` - 10 edges
8. `fetchWeather()` - 9 edges
9. `Public API (window.* exposure)` - 9 edges
10. `Environment Object (temperature, season, hemisphere, lat/lng)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `localStorage Persistence Layer` --semantically_similar_to--> `Offline-first — localStorage + import/export backup`  [INFERRED] [semantically similar]
  index.html → README.md
- `Adaptive watering — base interval adjusted by environment` --semantically_similar_to--> `Adaptive watering feature`  [INFERRED] [semantically similar]
  index.html → README.md
- `Rationale: localStorage chosen for zero server costs` --semantically_similar_to--> `Rationale: localStorage over backend DB`  [INFERRED] [semantically similar]
  index.html → CLAUDE.md
- `localStorage Persistence Layer` --rationale_for--> `Zero server costs — static frontend + free weather API`  [INFERRED]
  index.html → README.md
- `HealthResponse` --uses--> `Health check endpoint with request counting and DB status.`  [INFERRED]
  backend/models.py → backend/routes/health.py

## Hyperedges (group relationships)
- **Plant Lifecycle Management** — index_html_state, index_html_death_learning, index_html_revival_system, index_html_duplicate_detection, index_html_addplant, index_html_createplant, index_html_confirmdeath, index_html_confirmrevival, index_html_rendermemorial [EXTRACTED 1.00]
- **Watering Intelligence Feedback Loop** — index_html_getadjustedinterval, index_html_getbaseinterval, index_html_getenvironmentmultiplier, index_html_getseasonalmultiplier, index_html_gettemperaturemultiplier, index_html_fetchweather, index_html_cooldown_enforcement, index_html_bottom_watering_education, index_html_weighted_moving_average, index_html_derived_state [EXTRACTED 1.00]
- **Data Persistence and Portability** — index_html_localstorage_persistence, index_html_state, index_html_save, index_html_exportdata, index_html_importdata, index_html_validateplant, index_html_normalizeplant, index_html_downloadics, index_html_import_validation [EXTRACTED 1.00]

## Communities

### Community 0 - "Architecture Documentation"
Cohesion: 0.07
Nodes (53): Three Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Architectural Pillars (Plant lifecycle, Watering intelligence, Data persistence), Core Patterns (derived state, innerHTML rendering, debounced render, XSS, IIFE), Rationale: Derived state over stored state — never stale, Rationale: innerHTML over virtual DOM — simpler mental model, Key Functions Table (getAdjustedInterval, getBaseInterval, getDaysUntilNextWater, combineDeathLearning, render), State Shape (plants[], deadPlants[], history[]), Rationale: Vanilla JS over React — zero deps, 77KB, instant load (+45 more)

### Community 1 - "Backend Test Suite"
Cohesion: 0.06
Nodes (11): _create_plant(), Tests for Planty v2 API routes., Send rapid requests — at least one should be rate-limited., Helper: create a plant and return the JSON response., TestDiagnosis, TestHealth, TestPlants, TestRateLimit (+3 more)

### Community 2 - "Backend Data Models & Schemas"
Cohesion: 0.09
Nodes (32): BaseModel, diagnose(), diagnose_plant(), Plant diagnosis service — rule-based for MVP, ready for AI upgrade.  Uses heuris, Analyze a plant photo and return a diagnosis., Analyze plant photo and return diagnosis.      Currently uses heuristic matching, DiagnosisRequest, DiagnosisResponse (+24 more)

### Community 3 - "Backend Core & Health"
Cohesion: 0.07
Nodes (22): App(), check_db_health(), get_db(), init_db(), Database setup — PostgreSQL via SQLAlchemy with connection pooling., Create tables if they don't exist., Verify database connectivity. Returns True if healthy., Get a database session (FastAPI dependency). (+14 more)

### Community 4 - "Page Components"
Cohesion: 0.12
Nodes (12): AddPlant(), Calendar(), Dashboard(), getGreetingSubtitle(), toF(), getAdjustment(), getSeason(), Layout() (+4 more)

### Community 5 - "UI & Date Utilities"
Cohesion: 0.12
Nodes (6): daysUntil(), formatDate(), PlantCard(), PlantDetail(), computeHealthStatus(), useWatering()

### Community 6 - "Weather & Environment"
Cohesion: 0.17
Nodes (16): Rationale: Open-Meteo over API-key services — free, no registration, Adaptive watering — base interval adjusted by environment, Cold Season: Higher Multiplier = Less Frequent Watering, detectSeason(), Environment Object (temperature, season, hemisphere, lat/lng), fetchWeather(), getEnvironmentMultiplier(), getSeasonalMultiplier() (+8 more)

### Community 7 - "Shared UI Components"
Cohesion: 0.17
Nodes (5): Button(), cn(), GlassCard(), Skeleton(), SpeciesBadge()

### Community 8 - "Architecture Decisions"
Cohesion: 0.18
Nodes (10): Architecture decisions, Rationale: localStorage over backend DB — zero server costs, Rationale: localStorage over backend DB, Rationale: Zustand over Redux, localStorage Persistence Layer, Plant state management — plants, deadPlants, history, PWA Meta Tags, Rationale: localStorage chosen for zero server costs (+2 more)

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

### Community 15 - "E2E Test Suite"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Backend Documentation"
Cohesion: 0.5
Nodes (4): FastAPI server — SQLite dev / PostgreSQL production, Python dependencies, Rationale: SQLite over PostgreSQL (dev), Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI

### Community 17 - "Modal System"
Cohesion: 0.5
Nodes (2): Modal System (death/revival/duplicate/cooldown), showModal()

### Community 18 - "Design System"
Cohesion: 0.5
Nodes (4): Design System — Nature Palette (CSS Custom Properties), CSS Custom Properties (Design Tokens), Glass-Morphism Card Design, Glass-morphism UI

### Community 19 - "Graph Analysis"
Cohesion: 0.5
Nodes (4): Edge Density 1.07 (target 1.5+) — codebase more colocated than connected, Knowledge Graph Visualization (vis-network), God Nodes: TestPlants (18 edges), _create_plant (12), PlantCreate (6), Knowledge Graph Statistics (267 nodes, 285 edges, 50 communities)

### Community 20 - "Settings Store"
Cohesion: 1.0
Nodes (2): loadFromStorage(), persistSettings()

### Community 21 - "Breath Ring Component"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Project Overview"
Cohesion: 0.67
Nodes (3): Project structure, Planty SPA — vanilla JS app entry, Planty v3 — smart plant care web app overview

### Community 23 - "Tab Navigation"
Cohesion: 0.67
Nodes (3): Rationale: Hash-free routing — tab navigation, no URL state, Four-Tab SPA Navigation (Home/Schedule/Memorial/Settings), showTab() - tab navigation

### Community 24 - "Empty State"
Cohesion: 1.0
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
Nodes (2): Backend API overview — 11 endpoints, API endpoints — plants CRUD, watering, diagnosis, weather

### Community 30 - "Death Cause Selection"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Bottom Watering Info"
Cohesion: 1.0
Nodes (1): Bottom Watering Education

### Community 32 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Backend Tests Init"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Backend Routes Init"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Backend Services Init"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Service Worker"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "React Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "ICS Calendar Export"
Cohesion: 1.0
Nodes (1): ICS calendar export — RRULE-based watering schedule

### Community 41 - "Watering Cooldown"
Cohesion: 1.0
Nodes (1): Bottom watering education

### Community 42 - "Watering Interval"
Cohesion: 1.0
Nodes (1): 24-hour watering cooldown enforcement

### Community 43 - "Tab Bar Navigation"
Cohesion: 1.0
Nodes (1): Four-tab SPA navigation — Home, Schedule, Memorial, Settings

### Community 44 - "PWA Meta Tags"
Cohesion: 1.0
Nodes (1): PWA meta tags

### Community 45 - "Agent Skills"
Cohesion: 1.0
Nodes (1): Agent skills — GitHub Issues triage workflow

### Community 46 - "Backend Architecture"
Cohesion: 1.0
Nodes (1): Backend architecture — main, config, db, models, routes

### Community 47 - "Production Deployment"
Cohesion: 1.0
Nodes (1): Production deployment

### Community 48 - "PWA Offline Fallback"
Cohesion: 1.0
Nodes (1): Offline fallback page — PWA network-loss UI

### Community 49 - "HashRouter Rationale"
Cohesion: 1.0
Nodes (1): Rationale: HashRouter over BrowserRouter

### Community 50 - "Tailwind Rationale"
Cohesion: 1.0
Nodes (1): Rationale: Tailwind over CSS-in-JS

### Community 51 - "Form Input Clearing"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Isolated Knowledge Nodes"
Cohesion: 1.0
Nodes (1): 51 Isolated Nodes (19% of graph)

## Knowledge Gaps
- **66 isolated node(s):** `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.`, `Get a database session (FastAPI dependency).`, `Application configuration — loaded from environment with sensible defaults.` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Empty State`** (2 nodes): `EmptyState()`, `EmptyState.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CountUp Animation`** (2 nodes): `CountUp()`, `CountUp.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Season Banner`** (2 nodes): `SeasonBanner()`, `SeasonBanner.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Memorial Page`** (2 nodes): `Memorial()`, `Memorial.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Diagnose Page`** (2 nodes): `Diagnose()`, `Diagnose.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Documentation`** (2 nodes): `Backend API overview — 11 endpoints`, `API endpoints — plants CRUD, watering, diagnosis, weather`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Death Cause Selection`** (2 nodes): `selectCause()`, `updateCauseSelection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bottom Watering Info`** (2 nodes): `Bottom Watering Education`, `toggleBottomWaterInfo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Tests Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Routes Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Services Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Worker`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ICS Calendar Export`** (1 nodes): `ICS calendar export — RRULE-based watering schedule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Watering Cooldown`** (1 nodes): `Bottom watering education`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Watering Interval`** (1 nodes): `24-hour watering cooldown enforcement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tab Bar Navigation`** (1 nodes): `Four-tab SPA navigation — Home, Schedule, Memorial, Settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA Meta Tags`** (1 nodes): `PWA meta tags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agent Skills`** (1 nodes): `Agent skills — GitHub Issues triage workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Architecture`** (1 nodes): `Backend architecture — main, config, db, models, routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Production Deployment`** (1 nodes): `Production deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA Offline Fallback`** (1 nodes): `Offline fallback page — PWA network-loss UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HashRouter Rationale`** (1 nodes): `Rationale: HashRouter over BrowserRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Rationale`** (1 nodes): `Rationale: Tailwind over CSS-in-JS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Form Input Clearing`** (1 nodes): `clearInputs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Isolated Knowledge Nodes`** (1 nodes): `51 Isolated Nodes (19% of graph)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HealthResponse` connect `Backend Data Models & Schemas` to `Backend Core & Health`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `setup_db()` connect `Backend Core & Health` to `Backend Test Suite`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getAdjustedInterval()` (e.g. with `Environment Object (temperature, season, hemisphere, lat/lng)` and `Seasonal Watering Multiplier`) actually correct?**
  _`getAdjustedInterval()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture Documentation` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Backend Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Backend Data Models & Schemas` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._