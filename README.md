# 🌱 PlantMind - AI-Powered Plant Care Scheduler

An intelligent plant care scheduler that uses **Reinforcement Learning** to learn your watering patterns and automatically schedules future waterings. Integrates with **Google Calendar** and **Apple Calendar** for seamless scheduling.

## ✨ Features

### Core Features
- **One-Tap Water Recording**: Record waterings instantly with a single button tap
- **AI-Predicted Schedules**: RL agent learns your actual watering patterns
- **"Next Water in X Days"**: Always know when your plant needs water next
- **Calendar Integration**: Syncs with Google Calendar and Apple Calendar (iCloud)

### Plant Memorial System
- **Death Recording**: When a plant dies, record what happened
- **Learning Preservation**: All watering data is saved even when plants die
- **AI Protection**: New plants with the same name get adjusted schedules based on past failures
- **Gemini AI Analysis**: Uses Google's Gemini to analyze deaths and suggest improvements

### Reinforcement Learning
- **Per-Plant Agents**: Each plant has its own independent learning agent
- **Q-Learning Algorithm**: Uses temporal difference learning to optimize schedules
- **Reward Signals**: +10 for on-time waterings, penalties for overwatering
- **Confidence Scoring**: Shows how confident the AI is in its predictions
- **Bottom Watering Logic**: Enforces 2-day minimum cooldown between waterings

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables (Optional)

```bash
# For Google Calendar
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="http://localhost:8000/auth/google/callback"

# Gemini API (already included, but you can override)
export GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run the Application

```bash
# Development mode with auto-reload
uvicorn main:app --reload

# Or run directly
python main.py
```

### 4. Open in Browser

Navigate to: **http://localhost:8000**

## 📁 Project Structure

```
plantmind/
├── main.py              # FastAPI application & routes
├── models.py            # SQLAlchemy database models
├── rl_agent.py          # Reinforcement learning agent
├── gemini_service.py    # Google Gemini AI integration
├── calendar_service.py  # Google & Apple Calendar integration
├── requirements.txt     # Python dependencies
├── templates/
│   └── index.html       # Frontend UI
└── plantmind.db         # SQLite database (created on first run)
```

## 🧠 Reinforcement Learning Formulation

### State Space
- Days since last watering
- Days since last fertilizing
- Average watering interval
- Interval variance
- Consecutive skips
- Day of week
- Cooldown status

### Action Space
- Schedule water in N days
- Schedule fertilize in N days
- Skip action

### Reward Function
| Action | Reward |
|--------|--------|
| Water on predicted day | +10 |
| Water 1 day off | +5 |
| Water 2-3 days off | +2 |
| Water far off prediction | -5 |
| Skip watering | -8 |
| Overwatering (< 2 days) | -15 |

### Q-Learning Update
```
Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]

α = 0.15 (learning rate)
γ = 0.95 (discount factor)
ε = decaying (exploration rate)
```

## 📅 Calendar Integration

### Google Calendar
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set redirect URI to `http://localhost:8000/auth/google/callback`
4. Add credentials to environment variables
5. Click "Connect Google Calendar" in the app

### Apple Calendar (iCloud)
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and go to **Security** → **App-Specific Passwords**
3. Generate a password named "PlantMind"
4. Enter your Apple ID and the app-specific password in the app

### Export .ics
- Download an .ics file that works with any calendar app
- Just double-click to import into your calendar

## 🔌 API Endpoints

### Plants
- `GET /api/plants` - Get all plants with learning data
- `POST /api/plants` - Create a new plant
- `DELETE /api/plants/{id}` - Delete a plant
- `POST /api/plants/{id}/water` - Record watering (main learning trigger)
- `POST /api/plants/{id}/died` - Mark plant as deceased

### Memorial
- `GET /api/dead-plants` - Get deceased plants
- `POST /api/plants/{id}/revive` - Create plant using dead plant's learning

### AI & Insights
- `POST /api/chat` - Chat with Gemini AI
- `GET /api/reward-signals` - Get RL reward signals
- `GET /api/explanations` - Get AI explanations

### Calendar
- `GET /api/calendar/status` - Get connection status
- `GET /auth/google` - Start Google OAuth
- `POST /api/calendar/apple/connect` - Connect Apple Calendar
- `GET /api/export/ics` - Export calendar as .ics

## 🌊 Bottom Watering Logic

PlantMind is designed specifically for **bottom watering**:

1. **Minimum 2-day Cooldown**: Plants need time to absorb water from below
2. **Longer Hydration Effect**: Bottom watering provides more sustained moisture
3. **Overwatering Prevention**: Heavy penalties for watering too frequently
4. **No Same-Day Watering**: Unless heavily reinforced by learning

## 💀 Death & Revival System

When a plant dies:
1. Record the cause (overwatering, underwatering, unknown)
2. Gemini AI analyzes what went wrong
3. A new interval is suggested
4. All learning data is preserved

When you get a replacement:
1. Add a plant with the same name
2. App detects the previous death
3. Shows warning with AI-adjusted interval
4. New plant starts with "death protection"

## 🛡️ Failure Safeguards

- **Model Divergence**: Hard bounds on intervals (2-30 days)
- **Cold Start**: Conservative defaults until enough data
- **Calendar API Failures**: Graceful fallback to local storage
- **Data Loss Prevention**: Calendar events serve as backup
- **Exploration Decay**: Reduces random scheduling over time

## 📱 Screenshots

The app provides:
- Dashboard with quick water buttons
- Plant cards showing next watering countdown
- AI Insights tab with reward signals
- Calendar setup with Google/Apple integration
- Plant Memorial for deceased plants

## 🔧 Development

```bash
# Install dev dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if added)
pytest
```

## 📄 License

MIT License - Feel free to use and modify!

---

Built with 💚 for plant lovers who want AI-powered care schedules.
