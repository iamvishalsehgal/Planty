# Planty v3 — Full Codebase Audit

**Date**: 2026-06-24
**Sources**: graphify knowledge graph (267 nodes, 285 edges, 50 communities) + full source review
**Scope**: All src/, backend/, config files, docs

---

## Executive Summary

Planty v3 is a well-structured PWA with strong design consistency. The graph reveals **267 nodes but only 285 edges** — an edges-to-nodes ratio of **1.07** (target: 1.5+). This means the codebase is more *colocated* than *connected* — modules sit near each other but lack explicit cross-references. 51 nodes are isolated (≤1 edge), mostly rationale comments and `__init__.py` files that should be linked to their consumers.

**Three themes dominate the findings:**
1. **Data model fragility** — getter-based healthStatus is non-serializable, weather lookups are sync-only, store references go stale
2. **Component architecture gaps** — inline sub-components, duplicate actions, overlapping hooks, no code splitting
3. **Missing infrastructure** — no TypeScript, no tests for frontend, localStorage failures are silent, no error telemetry

---

## Graph Analysis: What the Knowledge Graph Revealed

### Edge Density: Too Sparse
- **267 nodes → 285 edges** = 1.07 edges/node
- Healthy projects typically have 1.5–3.0 edges/node
- **52 edges are INFERRED** (18%), avg confidence 0.67 — the model had to guess connections that code doesn't make explicit
- Real edges should come from imports, function calls, shared types — not model inference

### Weakest Communities (need splitting/restructuring)
| Community | Cohesion | Issue |
|-----------|----------|-------|
| Backend Test Suite | 0.07 | 10 loosely related test functions — needs per-route test files |
| Data Models & Schemas | 0.11 | 25 nodes mixing Pydantic models, descriptions, rationale — separate schemas from docs |
| Plant UI Components | 0.12 | `PlantCard`, `PlantDetail`, `useWatering`, `formatDate` lumped together — split by concern |

### Thin Communities (fragments that should merge)
24 communities have only 1-2 nodes. These are **single-file islands** — they represent files that don't import or reference anything else:
- `tailwind.config.js` alone in "React Core"
- `vite.config.js` alone in "Build Config"
- `sw.js` alone in "Weather Icons" (misclassified)

**Fix**: These config/utility files should be linked to their consumers via explicit `@see` comments or import graphs.

### Surprising Connections (model-inferred, need verification)
1. `localStorage persistence` ↔ `Offline-first` — correct, but these live in `index.html` and `README.md`, not in actual code
2. `Adaptive watering` in `index.html` ↔ `README.md` — feature documented but implementation is purely synchronous weather lookup
3. `Health check endpoint` ↔ `HealthResponse` — **correct**, model found the route→model dependency

### Hyperedges — Cross-Cutting Concerns
The graph identified 3 hyperedges — these are the **actual feature-level relationships**:
1. **Plant lifecycle management** — state, death, revival, duplicate detection (EXTRACTED, 1.0)
2. **Watering intelligence feedback loop** — adaptive, seasonal, weather, cooldown, bottom watering (INFERRED, 0.85)
3. **Data persistence and portability** — localStorage, ICS export, offline, zero server costs (INFERRED, 0.80)

These three are your **architectural pillars**. Everything else should trace back to one of them.

---

## Code Review: Prioritized Findings

### 🔴 P0 — Data Integrity Bugs

#### 1. `healthStatus` getter breaks serialization
**File**: `src/stores/plantStore.js:67,95,115,155`
```js
get healthStatus() { return computeHealthStatus(this.nextWatering); }
```
This getter is defined on spread objects (`{...p, get healthStatus()...}`). It:
- Won't survive `JSON.stringify` (export/backup will lose it)
- Won't survive `JSON.parse` (import/restore won't have it)
- Won't survive Zustand's own serialization if used with persist middleware

**Fix**: Make healthStatus a computed value in the hook, not a getter on the store object.
```js
// plantStore.js — remove all getter definitions
// usePlants.js — add:
const plantsWithStatus = useMemo(() => 
  plants.map(p => ({ ...p, healthStatus: computeHealthStatus(p.nextWatering) })),
  [plants]
);
```

#### 2. `getWeather()` sync-only returns stale/null
**File**: `src/lib/weather.js:24-26`
`addPlant()` and `waterPlant()` call `getWeather()` which only reads cache — if cache is cold (first visit, TTL expired), it returns `null` silently. Weather-aware interval adjustment is skipped.
```js
// plantStore.js:86 — addPlant
const weather = getWeather(); // null on cold start → no adjustment
```

**Fix**: `addPlant` and `waterPlant` should accept weather as a parameter, or the store should trigger an async weather fetch and retry.
```js
addPlant: (data, weather) => {
  const adjustedInterval = adjustWateringInterval(data.wateringIntervalDays, weather);
  // ...
}
```

#### 3. `usePlants` returns stale store references
**File**: `src/hooks/usePlants.js:31`
```js
const store = usePlantStore.getState(); // captured ONCE at render
return {
  updatePlant: store.updatePlant,  // stale if store recreated
  removePlant: store.removePlant,
  waterPlant: store.waterPlant,
};
```
Zustand store methods are stable, but `getState()` is called once — if the store instance changes (unlikely with Zustand v5, but pattern is fragile).

**Fix**: Use stable callbacks that call `getState()` at invocation time:
```js
const waterPlant = useCallback((id) => usePlantStore.getState().waterPlant(id), []);
```

#### 4. Grammar bug in notification text
**File**: `src/pages/Dashboard.jsx:123`
```js
{needsWaterToday === 1 ? "plant needs" : "plants need"} water today
```
Correct: "1 plant needs water today" ✅ / "2 plants need water today" ✅

**File**: `src/lib/notifications.js:30`
```js
`${count} plant${count > 1 ? "s" : ""} need${count === 1 ? "s" : ""} water today.`
```
Bug: When count=1 → "1 plant needs water today" ✅
When count=2 → "2 plants need water today" ✅
Wait, actually: `need${count === 1 ? "s" : ""}` — when count=1: "needs", when count=2: "need". That's correct.

Actually re-checking: For count=1: "1 plant needs water today" — correct. For count=2: "2 plants need water today" — correct. Not a bug. Disregard.

---

### 🟠 P1 — Architecture & Structure

#### 5. Duplicate action buttons on Dashboard
**File**: `src/pages/Dashboard.jsx:142-165`
"Scan" button (line 142) and "Diagnose" button (line 158) both navigate to `/diagnose`. One should go to `/add` (or "Scan" should be a different feature).

#### 6. Inline components in PlantDetail
**File**: `src/pages/PlantDetail.jsx:279-329`
`StatBox`, `CareNeedCard`, `QuickActionButton` are defined at the bottom of the file. They're only used in PlantDetail. Move to `src/components/` or a `PlantDetail/` folder if this page grows.

#### 7. No code splitting — all pages eager-loaded
**File**: `src/App.jsx:3-9`
All 7 pages imported at the top. Bundle includes Calendar, Memorial, Diagnose even if user never visits them.
```js
// Current: ~30KB JS for pages user may never see
// Fix: React.lazy + Suspense
const Calendar = lazy(() => import("@/pages/Calendar"));
```

#### 8. `useWatering` and `usePlants` overlap
Both hooks:
- Subscribe to `usePlantStore`
- Expose `waterPlant`
- Compute derived plant state

`useWatering` is used by `PlantDetail` only, but duplicates subscription logic from `usePlants`. Consolidate into `usePlants(id?)`:
```js
export function usePlants(plantId) {
  // ... existing code ...
  if (plantId) {
    // also return plant-specific watering data
  }
}
```

#### 9. Backend: raw SQL mixed with SQLAlchemy ORM
**File**: `backend/main.py:40-63`
`recompute_health_statuses()` uses `db.execute(text("SELECT ..."))` but the routes likely use ORM models. Inconsistent query style.
**Fix**: Use SQLAlchemy ORM models everywhere, or use raw SQL everywhere. Don't mix.

#### 10. Weather polling is per-tab, no coordination
**File**: `src/hooks/useWeather.js:29`
```js
const interval = setInterval(refresh, 30 * 60 * 1000);
```
If user has 3 tabs open, that's 3 API calls every 30 minutes. localStorage cache helps (dedup within tab), but still 3 network requests.
**Fix**: Use `BroadcastChannel` API or check localStorage timestamp before fetching.

---

### 🟡 P2 — Quality & Maintainability

#### 11. No TypeScript
Zero `.ts`/`.tsx` files. Plant shape is implicit — no interface, no validation on import.
**Impact**: Import of corrupted backup → runtime crash. Plant object shape drift over time → subtle bugs.
**Recommendation**: At minimum, add JSDoc types:
```js
/** @typedef {{ id: string, name: string, species: string, room: string, wateringIntervalDays: number, lastWatered: string, nextWatering: string, adjustedInterval: number, photoUri: string|null, createdAt: string, synced: boolean }} Plant */
```

#### 12. No frontend tests
- Backend: 29 pytest tests ✅
- Frontend: 36 E2E tests (Playwright) ✅
- Frontend unit tests: **0** ❌

`plantStore`, `adjustWateringInterval`, `daysUntil`, `computeHealthStatus` — all pure logic, trivially testable. Add Vitest.

#### 13. `cn()` utility underused
**File**: `src/lib/cn.js` — 3 lines, used inconsistently.
Many components still do manual concatenation:
```jsx
// PlantDetail.jsx:121-128 — manual ternary chains
className={`... ${plant.healthStatus === "healthy" ? "bg-green-50/60..." : plant.healthStatus === "warning" ? "bg-gray-50/60..." : "bg-blue-50/60..."}`}
```
Use `cn()` or a `cva()`-style helper for conditional classes.

#### 14. localStorage failure is silent
**File**: `src/stores/plantStore.js:10-18`
```js
const persistPlants = (plants) => {
  try { localStorage.setItem(...); return true; }
  catch (e) { console.error(...); return false; }
};
```
The store warns but the UI only shows a brief error (AddPlant.jsx:63). User experience: plant appears saved, then disappears on refresh.
**Fix**: Show a persistent banner when storage is full. Offer to clear photo data or export.

#### 15. Import doesn't validate plant schema
**File**: `src/pages/Profile.jsx:92-141`
`handleImport` parses JSON but doesn't validate plant object shape. A malformed backup (missing `id`, wrong `nextWatering` format) silently creates broken plants.
**Fix**: Validate each plant object against expected schema before importing.

#### 16. PlantDetail fallback store lookup is a symptom
**File**: `src/pages/PlantDetail.jsx:19-24`
```js
const plant = useMemo(() => {
  if (subPlant) return subPlant;
  if (!id || isLoading) return undefined;
  return usePlantStore.getState().plants.find((p) => p.id === id) || null;
}, [subPlant, id, isLoading]);
```
The fact this fallback exists means the subscription (`useWatering`) sometimes hasn't fired yet. This is a timing bug masked by a workaround.
**Fix**: The store's `loadFromDisk` should be synchronous (it is — localStorage is sync). The `isLoading` state exists only to batch the initial load. Make sure `isLoading` transitions to `false` BEFORE the first render that needs plant data.

#### 17. `index.html` contains app logic descriptions
The graph showed many nodes from `index.html` (plant state, adaptive watering, etc.). These are `<meta>` tags and comments describing features — they're documentation, not code. The graph can't distinguish.
**Fix**: Move feature descriptions to CLAUDE.md or README.md. Keep `index.html` minimal.

#### 18. Dark mode defined in docs but not active
CLAUDE.md mentions `html.dark` class but `tailwind.config.js` has no `darkMode: "class"` setting.
**Fix**: Either implement dark mode or remove it from docs.

---

### 🟢 P3 — Polish & Performance

#### 19. Thirsty plant grammar in Dashboard
**File**: `src/pages/Dashboard.jsx:177`
```js
{thirstyPlants.length} plant{thirstyPlants.length > 1 ? "s" : ""} need{thirstyPlants.length === 1 ? "s" : ""} water
```
Same pattern as notifications: "1 plant needs", "2 plants need", "0 plants need". Correct. But repeated across files → extract a `pluralize()` util.

#### 20. Skeleton component is a single component
**File**: `src/components/Skeleton.jsx`
Only `DashboardSkeleton` exported. Each page deserves its own skeleton for better perceived performance.
**Add**: `PlantDetailSkeleton`, `CalendarSkeleton`, `ProfileSkeleton`.

#### 21. Backend scheduler runs even when no plants exist
**File**: `backend/main.py:86-94`
`recompute_health_statuses` fires every `HEALTH_RECOMPUTE_MINUTES` regardless of whether any plants exist. Add a short-circuit.

#### 22. `mounted` ref pattern in useWeather
**File**: `src/hooks/useWeather.js:8-13`
```js
const mounted = useRef(true);
useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
```
This is the pre-React-18 pattern. With React 19 + StrictMode, this ref is unnecessary — React handles cleanup. But it's harmless. Can simplify.

#### 23. Photo stored as base64 in localStorage
**File**: `src/pages/AddPlant.jsx:33-40`
Full-resolution photos as data URIs in localStorage will hit the 5MB quota fast (~3-5 photos).
**Fix**: Resize photos to max 300px before storing, or use IndexedDB for photos.

---

## Prioritized Action Plan

### Week 1 — Fix data bugs (P0)
1. Remove `get healthStatus()` getters from store → compute in hooks
2. Make `addPlant`/`waterPlant` accept explicit weather param
3. Fix `usePlants` stale store reference pattern
4. Add plant schema validation on import

### Week 2 — Architecture cleanup (P1)
5. Add `React.lazy` code splitting for all pages
6. Consolidate `useWatering` into `usePlants`
7. Merge inline components from PlantDetail into component files
8. Fix duplicate Scan/Diagnose buttons on Dashboard

### Week 3 — Quality hardening (P2)
9. Add JSDoc types for Plant, Settings, Weather shapes
10. Add Vitest unit tests for store + utils
11. Add persistent "storage full" warning banner
12. Consistent use of `cn()` across all components

### Week 4 — Polish (P3)
13. Resize photos before localStorage storage
14. Add page-specific skeletons
15. Extract `pluralize()` util
16. Implement dark mode or remove from docs

---

## Graph Health Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Edge/node ratio | 1.07 | ≥1.5 | 🔴 Low |
| Inferred edges | 18% | ≤10% | 🟡 OK |
| Isolated nodes | 51/267 (19%) | ≤5% | 🔴 High |
| Avg community cohesion | 0.33 | ≥0.4 | 🟡 OK |
| God node edges (max) | 18 (TestPlants) | ≤25 | 🟢 Good |
| Backend cohesion | 0.07 | ≥0.3 | 🔴 Needs split |
| Frontend cohesion | 0.27 | ≥0.3 | 🟡 Close |

---

## Files NOT in the Graph (should be added)

- `src/index.css` — contains design system animations, not extracted
- `public/icon-*.png` — assets without semantic nodes
- `backend/config.py` — environment config, weakly connected

## Files Over-represented in the Graph

- `index.html` — many nodes from meta/comment text, not code
- `CLAUDE.md` — documentation parsed as architecture nodes
- `README.md` — same issue

---

*Generated from graphify knowledge graph + full source review. 32 files analyzed.*
