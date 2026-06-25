# CLAUDE.md

Planty v3 — smart plant care PWA. Vanilla HTML/CSS/JS, single-file app. No build dependencies needed to run.

## Stack

- **Frontend**: Vanilla JS (ES2020+), CSS custom properties, single `index.html` (~1960 lines)
- **State**: Plain object + localStorage persistence
- **Styling**: Inline `<style>` with CSS custom properties (design tokens)
- **Backend**: FastAPI + SQLite (local) / PostgreSQL (production) — optional
- **Deploy**: GitHub Pages (static), any PostgreSQL host (backend optional)
- **Weather**: Open-Meteo free API (no key), geolocation-based

## Build & Run

```bash
npm install                     # Dev deps only (Vite, Playwright)
npm run dev                     # Vite dev server → localhost:5173
npm run build                   # Production build → dist/ (minifies index.html)

# Backend (optional)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload       # API → localhost:8000
```

## Test

```bash
# Frontend build check
npm run build

# E2E tests (Playwright, 24 test sections, 85+ assertions)
node e2e-full-test.mjs          # Requires dev server running on port 5169
# Targets Planty v3 vanilla JS — tab-based nav, no hash routing

# Backend (29 tests)
cd backend && source .venv/bin/activate && python3 -m pytest tests/ -v
```

## Project Structure

```
planty/
├── index.html              # Entire app: HTML + CSS + JS (~1800 lines)
├── vite.config.js          # Vite config for build/minify
├── package.json            # Dev deps (Vite, Playwright, PostCSS)
├── public/                 # PWA manifest, service worker, icons
├── e2e-full-test.mjs       # Playwright E2E test suite (36 tests)
├── src/                    # Legacy React source (v2, kept for reference)
├── graphify-out/           # Knowledge graph analysis output
├── backend/                # FastAPI server (optional)
│   ├── main.py             # App entry, middleware, scheduler
│   ├── config.py           # Environment config
│   ├── db.py               # SQLAlchemy + SQLite WAL mode
│   ├── models.py           # Pydantic v2 schemas
│   ├── routes/             # plants, diagnosis, weather, health
│   ├── services/           # weather (Open-Meteo), diagnosis (mock)
│   └── tests/              # 29 pytest tests
└── .github/workflows/      # GitHub Pages deploy
```

## Architecture (Vanilla JS)

Single `index.html` with three sections:
1. **`<style>`** — CSS custom properties, glass-morphism cards, tab bar, animations
2. **`<body>`** — Semantic HTML: header, tabs (Home/Schedule/Memorial/Settings), modals
3. **`<script>`** — IIFE-wrapped JS: state management, render engine, weather, ICS export

### Core Patterns

- **Derived state**: Health status, days-until-water, and adjusted intervals are computed at render time — never stored
- **innerHTML rendering**: Plants/memorial/schedule rebuilt on every render call via template literals
- **Debounced render**: `render()` uses `requestAnimationFrame` to batch rapid updates into one paint
- **XSS protection**: `esc()` helper wraps all user-provided strings before innerHTML insertion
- **Trusted Types**: Default policy (`planty-default`) + `html()` wrapper — CSP enforces `require-trusted-types-for 'script'`
- **CSP hardening**: `base-uri 'self'`, `form-action 'none'`, `upgrade-insecure-requests`, Trusted Types enforcement
- **Storage resilience**: `safeLoad()` with try/catch — corrupt localStorage → console.warn + fallback to empty `[]`
- **IIFE encapsulation**: All internal functions private; only onclick-handler functions exposed to `window`
- **Import validation**: `validatePlant()` + `normalizePlant()` sanitize imported data
- **Error boundary**: `window.addEventListener('error', ...)` shows toast on unhandled exceptions
- **Storage quota guard**: `_storageFull` flag stops localStorage hammering when quota exceeded

### State Shape

```js
state = {
  plants: [{ id, name, location, normalized, emoji, interval, isProtected, created }],
  deadPlants: [{ id, name, emoji, location, normalized, cause, lastInterval, suggestedInterval, totalWaterings, deathDate }],
  history: [{ plantId, date }],
}
environment = { temperature, season, hemisphere, latitude, longitude, lastFetch }
```

### Key Functions

| Function | Role |
|----------|------|
| `getAdjustedInterval(pid, def)` | Base interval × environment multiplier (weather + season) |
| `getBaseInterval(pid, def)` | Weighted moving average of historical watering intervals |
| `getDaysUntilNextWater(pid, def)` | Days until plant needs water |
| `combineDeathLearning(deadPlants)` | Computes adjusted interval for next plant from death data |
| `render()` | Debounced dispatcher → renderPlants + renderMemorial + renderSchedule |
| `esc(str)` | DOM-safe HTML escaping via createTextNode — prevents XSS |
| `html(str)` | TrustedHTML wrapper for CSP `require-trusted-types-for 'script'` |
| `safeLoad(key, fallback)` | JSON.parse with try/catch — corrupt localStorage recovery |
| `validatePlant(p)` | Sanitizes imported plant objects before insertion |

## Design System

Nature palette via CSS custom properties: `--primary: #10b981`, `--water-blue: #3b82f6`, `--danger: #ef4444`, `--warning: #f59e0b`.
Glass-morphism cards, floating pill tab bar, season-aware header gradient.
No dark mode currently — would require `html.dark` class selector.

## Architecture Decisions

- **Vanilla JS over React**: Zero dependencies, ~77KB total, instant load, no build step needed to run
- **localStorage over backend DB**: Zero server costs, instant reads, import/export
- **innerHTML over virtual DOM**: Simpler mental model for single-page app, render ~0.3ms for 50 plants
- **Derived state over stored state**: Health status, adjusted intervals computed at render — never stale
- **Hash-free routing**: Tab-based navigation (`showTab()`) — no router, no URL state
- **Open-Meteo over API-key services**: Free weather, no registration, no cost
- **Trusted Types over unsafe-inline alone**: CSP enforces `require-trusted-types-for 'script'` with default TT policy — forward-compatible with Baseline 2026
- **Defense-in-depth XSS**: `esc()` (primary) + Trusted Types (enforcement layer) + CSP (containment layer) + import validation (input gate)

## Agent Skills

- Issue tracker: GitHub Issues on `iamvishalsehgal/Planty`, use `gh` CLI
- Triage: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
