# Planty v2 🌱

Smart plant care, beautifully designed. Native mobile app (iOS + Android) with intelligent watering schedules, weather awareness, and plant health diagnosis.

## What is Planty?

Planty helps you keep your plants alive and thriving:

- **Adaptive watering schedule** — adjusts based on weather (skip when rainy, increase when hot)
- **Plant Doctor** — photo-based health diagnosis with confidence scores and treatment plans
- **Beautiful UI** — glass-morphism design, spring animations, haptic feedback
- **Offline-first** — works without internet, syncs when connected
- **Push notifications** — never forget to water again

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 53, React Native 0.76 |
| Navigation | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Animation | Reanimated 3, Skia, Gesture Handler |
| State | Zustand v5 + MMKV |
| Backend | FastAPI + PostgreSQL |
| Deploy | EAS (mobile) + Render (backend) |

## Getting Started

```bash
# Install dependencies
npm install
cd backend && pip install -r requirements.txt

# Start development
npx expo start          # Mobile app (scan QR with Expo Go)
npm run start:backend   # API server (http://localhost:8000)
```

## Project Structure

```
planty/
├── app/                    # Expo Router — file-based routes
│   ├── (tabs)/            # Tab navigation (Plants, Add, Doctor, Profile)
│   ├── plant/[id].tsx     # Plant detail page
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Design system + domain components
│   ├── hooks/             # usePlants, useWeather, useWatering
│   ├── stores/            # Zustand stores (plant, settings, UI)
│   ├── lib/               # API client, haptics, date utils
│   └── design/            # Design tokens, colors, typography
├── backend/               # FastAPI server
│   ├── routes/            # plants, diagnosis, weather, health
│   ├── services/          # Weather API, diagnosis engine
│   └── models.py          # Pydantic v2 schemas
└── graphify-out/          # Knowledge graph
```

## Testing

```bash
# Backend tests
cd backend && python3 -m pytest tests/ -q
```

## Deployment

- **Backend**: Push to `master` → Render auto-deploys
- **Mobile**: `eas build --platform ios --profile production`

## License

MIT
