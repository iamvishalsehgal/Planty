# Graph Report - .  (2026-06-24)

## Corpus Check
- Corpus is ~24,649 words - fits in a single context window. You may not need a graph.

## Summary
- 267 nodes · 285 edges · 50 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Test Suite|Backend Test Suite]]
- [[_COMMUNITY_Data Models & Schemas|Data Models & Schemas]]
- [[_COMMUNITY_Plant UI Components|Plant UI Components]]
- [[_COMMUNITY_App Entry & Health|App Entry & Health]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_Dashboard & Layout|Dashboard & Layout]]
- [[_COMMUNITY_Pages & Page Logic|Pages & Page Logic]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]
- [[_COMMUNITY_Plant Diagnosis|Plant Diagnosis]]
- [[_COMMUNITY_Weather Client|Weather Client]]
- [[_COMMUNITY_Weather Backend|Weather Backend]]
- [[_COMMUNITY_State Management|State Management]]
- [[_COMMUNITY_Plant Lifecycle|Plant Lifecycle]]
- [[_COMMUNITY_Settings & Profile|Settings & Profile]]
- [[_COMMUNITY_Calendar & Schedule|Calendar & Schedule]]
- [[_COMMUNITY_Memorial System|Memorial System]]
- [[_COMMUNITY_PWA Infrastructure|PWA Infrastructure]]
- [[_COMMUNITY_ImportExport|Import/Export]]
- [[_COMMUNITY_Notification System|Notification System]]
- [[_COMMUNITY_Watering Logic|Watering Logic]]
- [[_COMMUNITY_Season & Environment|Season & Environment]]
- [[_COMMUNITY_Design System|Design System]]
- [[_COMMUNITY_Backend Services|Backend Services]]
- [[_COMMUNITY_API Routes|API Routes]]
- [[_COMMUNITY_Frontend Lib|Frontend Lib]]
- [[_COMMUNITY_Hooks|Hooks]]
- [[_COMMUNITY_Component Library|Component Library]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Documentation|Documentation]]
- [[_COMMUNITY_React Core|React Core]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_GitHub CICD|GitHub CI/CD]]
- [[_COMMUNITY_Error Handling|Error Handling]]
- [[_COMMUNITY_Empty States|Empty States]]
- [[_COMMUNITY_CountUp Animation|CountUp Animation]]
- [[_COMMUNITY_Weather Icons|Weather Icons]]
- [[_COMMUNITY_Species Tags|Species Tags]]
- [[_COMMUNITY_Season Banner|Season Banner]]
- [[_COMMUNITY_Breath Ring|Breath Ring]]
- [[_COMMUNITY_Glass Card Effects|Glass Card Effects]]
- [[_COMMUNITY_Skeleton Loaders|Skeleton Loaders]]
- [[_COMMUNITY_Button System|Button System]]
- [[_COMMUNITY_Utility Functions|Utility Functions]]
- [[_COMMUNITY_Backend Utils|Backend Utils]]
- [[_COMMUNITY_Test Fixtures|Test Fixtures]]
- [[_COMMUNITY_Route Handlers|Route Handlers]]
- [[_COMMUNITY_Service Layer|Service Layer]]
- [[_COMMUNITY_Data Persistence|Data Persistence]]
- [[_COMMUNITY_Vanilla JS Core|Vanilla JS Core]]

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
- `localStorage persistence` --semantically_similar_to--> `Offline-first — localStorage + import/export backup`  [INFERRED] [semantically similar]
  index.html → README.md
- `Adaptive watering — base interval adjusted by environment` --semantically_similar_to--> `Adaptive watering feature`  [INFERRED] [semantically similar]
  index.html → README.md
- `Rationale: localStorage chosen for zero server costs` --semantically_similar_to--> `Rationale: localStorage over backend DB`  [INFERRED] [semantically similar]
  index.html → CLAUDE.md
- `Health check endpoint with request counting and DB status.` --uses--> `HealthResponse`  [INFERRED]
  backend/routes/health.py → backend/models.py
- `Called by middleware to track request volume.` --uses--> `HealthResponse`  [INFERRED]
  backend/routes/health.py → backend/models.py

## Hyperedges (group relationships)
- **Plant lifecycle management** — index_html_plant_state, index_html_death_learning, index_html_revival_system, index_html_duplicate_detection [EXTRACTED 1.00]
- **Watering intelligence feedback loop** — index_html_adaptive_watering, index_html_seasonal_multiplier, index_html_fetchweather, index_html_cooldown, index_html_bottom_watering [INFERRED 0.85]
- **Data persistence and portability** — index_html_localstorage_persistence, index_html_ics_export, readme_md_offline_first, offline_html_pwa_fallback, readme_md_zero_server_costs [INFERRED 0.80]

## Communities

### Community 0 - "Backend Test Suite"
Cohesion: 0.07
Nodes (10): _create_plant(), Tests for Planty v2 API routes., Send rapid requests — at least one should be rate-limited., Helper: create a plant and return the JSON response., TestHealth, TestPlants, TestRateLimit, TestRoot (+2 more)

### Community 1 - "Data Models & Schemas"
Cohesion: 0.11
Nodes (25): BaseModel, DiagnosisResponse, HealthResponse, PlantCreate, PlantResponse, PlantUpdate, Pydantic v2 models for Planty API., Request to create a plant. (+17 more)

### Community 2 - "Plant UI Components"
Cohesion: 0.12
Nodes (6): daysUntil(), formatDate(), PlantCard(), PlantDetail(), computeHealthStatus(), useWatering()

### Community 3 - "App Entry & Health"
Cohesion: 0.12
Nodes (9): App(), increment_request_count(), Health check endpoint with request counting and DB status., Called by middleware to track request volume., process_request(), Planty v2 — FastAPI backend for smart plant care., Update health_status for all plants based on current time., recompute_health_statuses() (+1 more)

### Community 4 - "Database Layer"
Cohesion: 0.14
Nodes (13): check_db_health(), get_db(), init_db(), Database setup — PostgreSQL via SQLAlchemy with connection pooling., Create tables if they don't exist., Verify database connectivity. Returns True if healthy., Get a database session (FastAPI dependency)., health_check() (+5 more)

### Community 5 - "Shared UI Components"
Cohesion: 0.17
Nodes (5): Button(), cn(), GlassCard(), Skeleton(), SpeciesBadge()

### Community 6 - "Dashboard & Layout"
Cohesion: 0.27
Nodes (8): Dashboard(), getGreetingSubtitle(), toF(), getAdjustment(), getSeason(), Layout(), toF(), useWeather()

### Community 7 - "Pages & Page Logic"
Cohesion: 0.2
Nodes (4): AddPlant(), Calendar(), Profile(), usePlants()

### Community 8 - "Architecture Decisions"
Cohesion: 0.2
Nodes (10): Architecture decisions, Rationale: localStorage over backend DB, Rationale: Zustand over Redux, Death learning — memorial adjusts interval for future plants, localStorage persistence, Plant state management — plants, deadPlants, history, Rationale: localStorage chosen for zero server costs, Revival system — protected plant with improved schedule (+2 more)

### Community 9 - "Plant Diagnosis"
Cohesion: 0.28
Nodes (7): diagnose(), diagnose_plant(), Plant diagnosis service — rule-based for MVP, ready for AI upgrade.  Uses heuris, Analyze a plant photo and return a diagnosis., Analyze plant photo and return diagnosis.      Currently uses heuristic matching, DiagnosisRequest, Request to diagnose a plant from a photo.

### Community 10 - "Weather Client"
Cohesion: 0.46
Nodes (7): cacheWeather(), fetchWeather(), getCachedWeather(), getPosition(), getWeather(), isRainyCode(), weatherCodeToCondition()

### Community 11 - "Weather Backend"
Cohesion: 0.29
Nodes (5): get_weather(), Weather service — fetches from Open-Meteo (free, no API key)., Fetch current weather from Open-Meteo., Get current weather for plant care decisions., weather()

### Community 12 - "State Management"
Cohesion: 0.33
Nodes (3): _Config, Application configuration — loaded from environment with sensible defaults., Centralised config — reads env at init, supports overrides for tests.

### Community 13 - "Plant Lifecycle"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 14 - "Settings & Profile"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Calendar & Schedule"
Cohesion: 0.6
Nodes (3): hasPermission(), scheduleReminders(), stopReminders()

### Community 16 - "Memorial System"
Cohesion: 0.4
Nodes (5): Adaptive watering — base interval adjusted by environment, Environment object (temperature, season, hemisphere, lat/lng), fetchWeather — Open-Meteo API call with geolocation, Seasonal + temperature watering interval multiplier, Adaptive watering feature

### Community 17 - "PWA Infrastructure"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Import/Export"
Cohesion: 0.5
Nodes (1): TestDiagnosis

### Community 19 - "Notification System"
Cohesion: 0.5
Nodes (4): FastAPI server — SQLite dev / PostgreSQL production, Python dependencies, Rationale: SQLite over PostgreSQL (dev), Tech stack — React 19, Vite 6, Tailwind, Zustand, FastAPI

### Community 20 - "Watering Logic"
Cohesion: 1.0
Nodes (2): loadFromStorage(), persistSettings()

### Community 21 - "Season & Environment"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Design System"
Cohesion: 0.67
Nodes (3): Project structure, Planty SPA — vanilla JS app entry, Planty v3 — smart plant care web app overview

### Community 23 - "Backend Services"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "API Routes"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Frontend Lib"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Hooks"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Component Library"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Backend Config"
Cohesion: 1.0
Nodes (2): Design system — nature palette, Glass-morphism UI

### Community 29 - "Documentation"
Cohesion: 1.0
Nodes (2): Backend API overview — 11 endpoints, API endpoints — plants CRUD, watering, diagnosis, weather

### Community 30 - "React Core"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Build Config"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "GitHub CI/CD"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Error Handling"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Empty States"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "CountUp Animation"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Weather Icons"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Species Tags"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Season Banner"
Cohesion: 1.0
Nodes (1): Duplicate plant detection by normalized name

### Community 39 - "Breath Ring"
Cohesion: 1.0
Nodes (1): ICS calendar export — RRULE-based watering schedule

### Community 40 - "Glass Card Effects"
Cohesion: 1.0
Nodes (1): Bottom watering education

### Community 41 - "Skeleton Loaders"
Cohesion: 1.0
Nodes (1): 24-hour watering cooldown enforcement

### Community 42 - "Button System"
Cohesion: 1.0
Nodes (1): Four-tab SPA navigation — Home, Schedule, Memorial, Settings

### Community 43 - "Utility Functions"
Cohesion: 1.0
Nodes (1): PWA meta tags

### Community 44 - "Backend Utils"
Cohesion: 1.0
Nodes (1): Agent skills — GitHub Issues triage workflow

### Community 45 - "Test Fixtures"
Cohesion: 1.0
Nodes (1): Backend architecture — main, config, db, models, routes

### Community 46 - "Route Handlers"
Cohesion: 1.0
Nodes (1): Production deployment

### Community 47 - "Service Layer"
Cohesion: 1.0
Nodes (1): Offline fallback page — PWA network-loss UI

### Community 48 - "Data Persistence"
Cohesion: 1.0
Nodes (1): Rationale: HashRouter over BrowserRouter

### Community 49 - "Vanilla JS Core"
Cohesion: 1.0
Nodes (1): Rationale: Tailwind over CSS-in-JS

## Knowledge Gaps
- **51 isolated node(s):** `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.`, `Get a database session (FastAPI dependency).`, `Application configuration — loaded from environment with sensible defaults.` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Backend Services`** (2 nodes): `EmptyState()`, `EmptyState.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Routes`** (2 nodes): `CountUp()`, `CountUp.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Lib`** (2 nodes): `SeasonBanner()`, `SeasonBanner.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hooks`** (2 nodes): `Memorial()`, `Memorial.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Component Library`** (2 nodes): `Diagnose()`, `Diagnose.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Config`** (2 nodes): `Design system — nature palette`, `Glass-morphism UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Documentation`** (2 nodes): `Backend API overview — 11 endpoints`, `API endpoints — plants CRUD, watering, diagnosis, weather`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Core`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GitHub CI/CD`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Error Handling`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Empty States`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CountUp Animation`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Weather Icons`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Species Tags`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Season Banner`** (1 nodes): `Duplicate plant detection by normalized name`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Breath Ring`** (1 nodes): `ICS calendar export — RRULE-based watering schedule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Glass Card Effects`** (1 nodes): `Bottom watering education`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skeleton Loaders`** (1 nodes): `24-hour watering cooldown enforcement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button System`** (1 nodes): `Four-tab SPA navigation — Home, Schedule, Memorial, Settings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utility Functions`** (1 nodes): `PWA meta tags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Utils`** (1 nodes): `Agent skills — GitHub Issues triage workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Fixtures`** (1 nodes): `Backend architecture — main, config, db, models, routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Route Handlers`** (1 nodes): `Production deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Layer`** (1 nodes): `Offline fallback page — PWA network-loss UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Data Persistence`** (1 nodes): `Rationale: HashRouter over BrowserRouter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vanilla JS Core`** (1 nodes): `Rationale: Tailwind over CSS-in-JS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HealthResponse` connect `Data Models & Schemas` to `App Entry & Health`, `Database Layer`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `setup_db()` connect `Database Layer` to `Backend Test Suite`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `PlantCreate` (e.g. with `Plant CRUD + watering events.` and `Determine plant health status based on watering schedule.`) actually correct?**
  _`PlantCreate` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `PlantUpdate` (e.g. with `Plant CRUD + watering events.` and `Determine plant health status based on watering schedule.`) actually correct?**
  _`PlantUpdate` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Database setup — PostgreSQL via SQLAlchemy with connection pooling.`, `Create tables if they don't exist.`, `Verify database connectivity. Returns True if healthy.` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Data Models & Schemas` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._