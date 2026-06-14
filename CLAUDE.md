# CLAUDE.md

Planty v2 — smart plant care mobile app. Expo React Native + FastAPI backend.
Beautiful UI, native-first, haptic feedback, offline-capable.

## Stack

- **Mobile**: Expo SDK 53, React Native 0.76, Expo Router v4, TypeScript strict
- **Styling**: NativeWind v4 (Tailwind), design tokens in `src/design/`
- **Animation**: Reanimated 3, Skia, Gesture Handler, @gorhom/bottom-sheet
- **State**: Zustand v5 + MMKV persistence
- **Backend**: FastAPI + PostgreSQL (Render managed)
- **Deploy**: EAS for mobile builds, Render for backend

## Session Start

Run `/graphify` at session start. Then `/clear`.

## Build & Run

```bash
npm install                      # Frontend deps
cd backend && pip install -r requirements.txt  # Backend deps
npx expo start                   # Dev server (scan QR with Expo Go)
npx expo start --ios             # iOS simulator
npm start                        # Same as above
```

## Test

```bash
cd backend && python3 -m pytest tests/ -q
```

## Project Structure

```
planty/
├── app/                    # Expo Router file-based routes
│   ├── (tabs)/            # Tab navigator
│   │   ├── index.tsx      # Plant dashboard
│   │   ├── add.tsx        # Add plant flow
│   │   ├── diagnose.tsx   # Plant doctor (camera + AI)
│   │   └── profile.tsx    # Settings & stats
│   ├── plant/[id].tsx     # Plant detail + history
│   └── _layout.tsx        # Root layout shell
├── src/
│   ├── components/ui/     # Design system primitives
│   ├── components/plants/ # Plant domain components
│   ├── components/shared/ # Cross-feature components
│   ├── hooks/             # Custom hooks
│   ├── stores/            # Zustand stores
│   ├── lib/               # API client, weather, utils
│   └── design/            # Colors, typography, spacing tokens
├── backend/               # FastAPI server
├── assets/                # Images, fonts, Lottie
└── graphify-out/          # Knowledge graph
```

## Design System

Nature palette: sage greens, soil browns, sky blues, clay terracotta, cream.
Glass-morphism cards, min 16px radius, spring-physics animations.
Full tokens in `tailwind.config.js` and `src/design/tokens.ts`.

## Architecture Decisions

- **MMKV over AsyncStorage**: Sub-ms reads, synchronous, typed. Plants state persisted.
- **Zustand over Redux**: Tiny API, no providers, works outside React.
- **Expo Router over React Navigation**: File-based, deep linking free, typed routes.
- **NativeWind over StyleSheet**: Faster iteration, design tokens in Tailwind config.
- **Postgres over SQLite**: Render managed, backups included, better for sync.

## Agent Skills

- Issue tracker: GitHub Issues on `iamvishalsehgal/Planty`, use `gh` CLI
- Triage: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
