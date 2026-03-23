"""
PlantMind - Intelligent Plant Care Scheduler
Main FastAPI Application

Run with: uvicorn main:app --reload
"""

import os
from datetime import datetime, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends, HTTPException, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Local imports
from models import (
    init_db, get_db, 
    Plant, DeadPlant, WateringHistory, PlantEvent, 
    RewardSignal, Explanation, CalendarConnection
)
from rl_agent import PlantRLAgent, rl_manager
from gemini_service import get_gemini_service
from calendar_service import (
    get_google_calendar_service, 
    get_apple_calendar_service,
    ICSExportService
)


# ================== LIFESPAN ==================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    print("🌱 PlantMind started!")
    yield
    print("🌱 PlantMind shutting down...")


# ================== APP SETUP ==================
app = FastAPI(
    title="PlantMind",
    description="AI-Powered Plant Care Scheduler with Reinforcement Learning",
    version="1.0.0",
    lifespan=lifespan
)

# Templates
templates = Jinja2Templates(directory="templates")

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDJZAXxiXmOBbPPCioY1Mpj_c8bWp9kEIk")


# ================== PYDANTIC MODELS ==================
class PlantCreate(BaseModel):
    name: str
    location: Optional[str] = ""
    water_interval: int = 7


class PlantResponse(BaseModel):
    id: int
    name: str
    location: str
    water_interval: int
    learned_interval: float
    confidence: float
    days_until_water: int
    next_water_date: str
    days_since_water: int
    total_waterings: int
    
    class Config:
        from_attributes = True


class WaterRecordResponse(BaseModel):
    success: bool
    reward: float
    explanation: str
    next_water_date: str
    days_until_next: int
    learned_interval: int
    confidence: float


class DeathRecord(BaseModel):
    cause: str  # overwatering, underwatering, unknown
    notes: Optional[str] = ""


class ChatMessage(BaseModel):
    message: str


class AppleCalendarConnect(BaseModel):
    apple_id: str
    app_password: str


# ================== HELPER FUNCTIONS ==================
def get_plant_history(db: Session, plant_id: int) -> List[dict]:
    """Get watering history for a plant as list of dicts."""
    history = db.query(WateringHistory).filter(
        WateringHistory.plant_id == plant_id,
        WateringHistory.type == "water"
    ).order_by(WateringHistory.date).all()
    
    return [{"date": h.date, "type": h.type} for h in history]


def add_explanation(db: Session, plant_id: int, plant_name: str, text: str):
    """Add an AI explanation."""
    explanation = Explanation(
        plant_id=plant_id,
        plant_name=plant_name,
        text=text
    )
    db.add(explanation)
    db.commit()


def get_or_create_agent(plant: Plant) -> PlantRLAgent:
    """Get or create RL agent for a plant."""
    return rl_manager.get_agent(
        plant_id=plant.id,
        initial_interval=plant.water_interval,
        q_table=plant.q_table or {},
        episode_count=plant.episode_count
    )


# ================== ROUTES ==================

# ---------- Frontend ----------
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main application page."""
    return templates.TemplateResponse("index.html", {"request": request})


# ---------- Plants CRUD ----------
@app.get("/api/plants", response_model=List[PlantResponse])
async def get_plants(db: Session = Depends(get_db)):
    """Get all active plants with their learning data."""
    plants = db.query(Plant).all()
    result = []
    
    for plant in plants:
        history = get_plant_history(db, plant.id)
        agent = get_or_create_agent(plant)
        
        days_since = 0
        if history:
            last_water = max(h['date'] for h in history)
            days_since = (datetime.utcnow() - last_water).days
        
        result.append(PlantResponse(
            id=plant.id,
            name=plant.name,
            location=plant.location or "",
            water_interval=plant.water_interval,
            learned_interval=agent.get_learned_interval(history),
            confidence=agent.get_confidence(len(history)),
            days_until_water=agent.get_days_until_next_water(history),
            next_water_date=agent.get_next_water_date(history).isoformat(),
            days_since_water=days_since,
            total_waterings=len(history)
        ))
    
    return result


@app.post("/api/plants")
async def create_plant(plant_data: PlantCreate, db: Session = Depends(get_db)):
    """Create a new plant. Checks for dead plant matches."""
    normalized_name = plant_data.name.lower().strip()
    
    # Check if we have a dead plant with same name
    dead_match = db.query(DeadPlant).filter(
        DeadPlant.normalized_name == normalized_name
    ).first()
    
    if dead_match:
        return JSONResponse(
            status_code=200,
            content={
                "revival_required": True,
                "dead_plant": {
                    "id": dead_match.id,
                    "name": dead_match.name,
                    "death_cause": dead_match.death_cause,
                    "death_date": dead_match.death_date.isoformat(),
                    "last_interval": dead_match.last_interval,
                    "suggested_interval": dead_match.suggested_new_interval,
                    "total_waterings": dead_match.total_waterings,
                    "gemini_analysis": dead_match.gemini_analysis,
                    "gemini_tip": dead_match.gemini_tip
                }
            }
        )
    
    # Create new plant
    plant = Plant(
        name=plant_data.name,
        normalized_name=normalized_name,
        location=plant_data.location,
        water_interval=plant_data.water_interval,
        learned_water_interval=float(plant_data.water_interval)
    )
    
    db.add(plant)
    db.commit()
    db.refresh(plant)
    
    # Add explanation
    add_explanation(
        db, plant.id, plant.name,
        f"Added \"{plant.name}\"! Record your first watering when you water it, and I'll start learning your pattern."
    )
    
    # Create initial event
    agent = get_or_create_agent(plant)
    next_date = datetime.utcnow() + timedelta(days=plant.water_interval)
    
    event = PlantEvent(
        plant_id=plant.id,
        plant_name=plant.name,
        type="water",
        scheduled_date=next_date,
        ai_scheduled=True,
        ai_explanation=f"Initial schedule: {plant.water_interval}-day interval"
    )
    db.add(event)
    db.commit()
    
    return {"success": True, "plant_id": plant.id}


@app.post("/api/plants/{plant_id}/revive")
async def revive_plant(
    plant_id: int, 
    plant_data: PlantCreate,
    db: Session = Depends(get_db)
):
    """Create a plant using learning from a dead plant."""
    dead_plant = db.query(DeadPlant).filter(DeadPlant.id == plant_id).first()
    if not dead_plant:
        raise HTTPException(status_code=404, detail="Dead plant not found")
    
    # Create new plant with adjusted interval
    plant = Plant(
        name=plant_data.name,
        normalized_name=plant_data.name.lower().strip(),
        location=plant_data.location or dead_plant.location,
        water_interval=int(dead_plant.suggested_new_interval),
        learned_water_interval=dead_plant.suggested_new_interval,
        revived_from_id=dead_plant.original_id,
        has_death_protection=True,
        q_table=dead_plant.q_table
    )
    
    db.add(plant)
    db.commit()
    db.refresh(plant)
    
    # Add explanation
    add_explanation(
        db, plant.id, plant.name,
        f"🌱 {plant.name} is back! Using AI-corrected {dead_plant.suggested_new_interval:.0f}-day interval "
        f"(was {dead_plant.last_interval:.0f} days). I'll be extra careful this time!"
    )
    
    return {"success": True, "plant_id": plant.id}


@app.delete("/api/plants/{plant_id}")
async def delete_plant(plant_id: int, db: Session = Depends(get_db)):
    """Delete a plant and all its data."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    db.delete(plant)
    db.commit()
    rl_manager.remove_agent(plant_id)
    
    return {"success": True}


# ---------- Watering ----------
@app.post("/api/plants/{plant_id}/water", response_model=WaterRecordResponse)
async def record_watering(plant_id: int, db: Session = Depends(get_db)):
    """Record that a plant was watered. This is the main learning trigger."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Add watering record
    watering = WateringHistory(
        plant_id=plant_id,
        date=datetime.utcnow(),
        type="water"
    )
    db.add(watering)
    db.commit()
    
    # Get updated history
    history = get_plant_history(db, plant_id)
    
    # Get RL agent and record watering
    agent = get_or_create_agent(plant)
    result = agent.record_watering(history)
    
    # Update plant with new learning data
    plant.learned_water_interval = result['learned_interval']
    plant.confidence = result['confidence']
    plant.q_table = agent.get_q_table_dict()
    plant.episode_count = agent.episode_count
    db.commit()
    
    # Add reward signal
    signal = RewardSignal(
        plant_id=plant_id,
        action_type="watering",
        reward=result['reward'],
        explanation=result['explanation']
    )
    db.add(signal)
    
    # Add explanation
    add_explanation(db, plant_id, plant.name, result['explanation'])
    
    # Update/create next scheduled event
    db.query(PlantEvent).filter(
        PlantEvent.plant_id == plant_id,
        PlantEvent.type == "water",
        PlantEvent.completed == False
    ).delete()
    
    next_event = PlantEvent(
        plant_id=plant_id,
        plant_name=plant.name,
        type="water",
        scheduled_date=result['next_date'],
        ai_scheduled=True,
        ai_explanation=f"Predicted based on your {result['learned_interval']}-day watering pattern ({result['confidence']:.0f}% confidence)"
    )
    db.add(next_event)
    db.commit()
    
    # Sync to calendar if connected
    await sync_event_to_calendars(db, plant, next_event)
    
    days_until = (result['next_date'] - datetime.utcnow()).days
    
    return WaterRecordResponse(
        success=True,
        reward=result['reward'],
        explanation=result['explanation'],
        next_water_date=result['next_date'].isoformat(),
        days_until_next=max(0, days_until),
        learned_interval=result['learned_interval'],
        confidence=result['confidence']
    )


# ---------- Plant Death ----------
@app.post("/api/plants/{plant_id}/died")
async def mark_plant_dead(
    plant_id: int, 
    death_data: DeathRecord, 
    db: Session = Depends(get_db)
):
    """Mark a plant as dead and preserve its learning data."""
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Get history and agent
    history = get_plant_history(db, plant_id)
    agent = get_or_create_agent(plant)
    learned_interval = agent.get_learned_interval(history)
    
    # Get Gemini analysis
    gemini = get_gemini_service(GEMINI_API_KEY)
    analysis = await gemini.analyze_plant_death(
        plant_name=plant.name,
        death_cause=death_data.cause,
        notes=death_data.notes,
        avg_interval=learned_interval,
        total_waterings=len(history)
    )
    
    # Create dead plant record
    dead_plant = DeadPlant(
        original_id=plant.id,
        name=plant.normalized_name,
        normalized_name=plant.normalized_name,
        location=plant.location,
        death_cause=death_data.cause,
        death_notes=death_data.notes,
        last_interval=learned_interval,
        suggested_new_interval=analysis['new_interval'],
        total_waterings=len(history),
        watering_history=[{"date": h["date"].isoformat()} for h in history],
        q_table=agent.get_q_table_dict(),
        gemini_analysis=analysis['analysis'],
        gemini_tip=analysis['tip'],
        created_at=plant.created_at
    )
    
    db.add(dead_plant)
    
    # Add explanation
    add_explanation(
        db, plant_id, plant.name,
        f"💔 {plant.name} has passed. Cause: {death_data.cause}. "
        f"AI suggests {analysis['new_interval']}-day interval for future plants. {analysis['tip']}"
    )
    
    # Delete active plant
    db.delete(plant)
    db.commit()
    rl_manager.remove_agent(plant_id)
    
    return {
        "success": True,
        "analysis": analysis['analysis'],
        "suggested_interval": analysis['new_interval'],
        "tip": analysis['tip']
    }


# ---------- Dead Plants / Graveyard ----------
@app.get("/api/dead-plants")
async def get_dead_plants(db: Session = Depends(get_db)):
    """Get all dead plants in the memorial."""
    dead_plants = db.query(DeadPlant).order_by(desc(DeadPlant.death_date)).all()
    
    return [
        {
            "id": dp.id,
            "name": dp.name,
            "location": dp.location,
            "death_date": dp.death_date.isoformat(),
            "death_cause": dp.death_cause,
            "death_notes": dp.death_notes,
            "last_interval": dp.last_interval,
            "suggested_interval": dp.suggested_new_interval,
            "total_waterings": dp.total_waterings,
            "gemini_analysis": dp.gemini_analysis,
            "gemini_tip": dp.gemini_tip
        }
        for dp in dead_plants
    ]


# ---------- Events ----------
@app.get("/api/events")
async def get_events(
    days: int = Query(30, description="Days ahead to fetch"),
    db: Session = Depends(get_db)
):
    """Get scheduled events."""
    cutoff = datetime.utcnow() + timedelta(days=days)
    
    events = db.query(PlantEvent).filter(
        PlantEvent.scheduled_date <= cutoff
    ).order_by(PlantEvent.scheduled_date).all()
    
    return [
        {
            "id": e.id,
            "plant_id": e.plant_id,
            "plant_name": e.plant_name,
            "type": e.type,
            "date": e.scheduled_date.isoformat(),
            "completed": e.completed,
            "skipped": e.skipped,
            "ai_explanation": e.ai_explanation
        }
        for e in events
    ]


@app.get("/api/watering-history")
async def get_watering_history(db: Session = Depends(get_db)):
    """Get all watering history."""
    history = db.query(WateringHistory).order_by(desc(WateringHistory.date)).limit(100).all()
    
    return [
        {
            "id": h.id,
            "plant_id": h.plant_id,
            "date": h.date.isoformat(),
            "type": h.type
        }
        for h in history
    ]


# ---------- AI Insights ----------
@app.get("/api/reward-signals")
async def get_reward_signals(db: Session = Depends(get_db)):
    """Get recent reward signals."""
    signals = db.query(RewardSignal).order_by(desc(RewardSignal.timestamp)).limit(50).all()
    
    return [
        {
            "id": s.id,
            "plant_id": s.plant_id,
            "action_type": s.action_type,
            "reward": s.reward,
            "explanation": s.explanation,
            "timestamp": s.timestamp.isoformat()
        }
        for s in signals
    ]


@app.get("/api/explanations")
async def get_explanations(db: Session = Depends(get_db)):
    """Get AI explanations."""
    explanations = db.query(Explanation).order_by(desc(Explanation.timestamp)).limit(50).all()
    
    return [
        {
            "id": e.id,
            "plant_id": e.plant_id,
            "plant_name": e.plant_name,
            "text": e.text,
            "timestamp": e.timestamp.isoformat()
        }
        for e in explanations
    ]


# ---------- Gemini Chat ----------
@app.post("/api/chat")
async def chat_with_gemini(message: ChatMessage, db: Session = Depends(get_db)):
    """Chat with Gemini AI about plants."""
    # Build context
    plants = db.query(Plant).all()
    dead_plants = db.query(DeadPlant).all()
    
    plants_context = "; ".join([
        f"{p.name}: {p.learned_water_interval:.0f}-day interval, {p.confidence:.0f}% confidence"
        for p in plants
    ]) if plants else "None"
    
    dead_context = "; ".join([
        f"{dp.name}: died from {dp.death_cause}, was on {dp.last_interval:.0f}-day interval"
        for dp in dead_plants
    ]) if dead_plants else "None"
    
    gemini = get_gemini_service(GEMINI_API_KEY)
    response = await gemini.chat(message.message, plants_context, dead_context)
    
    return {"response": response}


# ---------- Calendar Integration ----------
@app.get("/api/calendar/status")
async def get_calendar_status(db: Session = Depends(get_db)):
    """Get calendar connection status."""
    connection = db.query(CalendarConnection).first()
    
    if not connection:
        return {"connected": False, "provider": None}
    
    return {
        "connected": True,
        "provider": connection.provider,
        "last_sync": connection.last_sync.isoformat() if connection.last_sync else None
    }


@app.get("/auth/google")
async def google_auth_start():
    """Start Google OAuth flow."""
    google_cal = get_google_calendar_service()
    auth_url = google_cal.get_auth_url()
    return RedirectResponse(url=auth_url)


@app.get("/auth/google/callback")
async def google_auth_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    google_cal = get_google_calendar_service()
    tokens = google_cal.handle_callback(code)
    
    # Save connection
    connection = db.query(CalendarConnection).first()
    if connection:
        connection.provider = "google"
        connection.google_access_token = tokens['access_token']
        connection.google_refresh_token = tokens.get('refresh_token')
        connection.connected_at = datetime.utcnow()
    else:
        connection = CalendarConnection(
            provider="google",
            google_access_token=tokens['access_token'],
            google_refresh_token=tokens.get('refresh_token')
        )
        db.add(connection)
    
    db.commit()
    
    return RedirectResponse(url="/?calendar=connected")


@app.post("/api/calendar/apple/connect")
async def connect_apple_calendar(data: AppleCalendarConnect, db: Session = Depends(get_db)):
    """Connect Apple Calendar via CalDAV."""
    apple_cal = get_apple_calendar_service()
    
    success = apple_cal.connect(data.apple_id, data.app_password)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to connect to Apple Calendar. Check your Apple ID and app-specific password.")
    
    # Save connection
    connection = db.query(CalendarConnection).first()
    if connection:
        connection.provider = "apple"
        connection.apple_id = data.apple_id
        connection.apple_app_password = data.app_password
        connection.connected_at = datetime.utcnow()
        connection.last_sync = datetime.utcnow()
    else:
        connection = CalendarConnection(
            provider="apple",
            apple_id=data.apple_id,
            apple_app_password=data.app_password,
            last_sync=datetime.utcnow()
        )
        db.add(connection)
    
    db.commit()
    
    # Sync all existing plants
    plants = db.query(Plant).all()
    synced = 0
    for plant in plants:
        history = get_plant_history(db, plant.id)
        agent = get_or_create_agent(plant)
        next_date = agent.get_next_water_date(history)
        
        try:
            uid = await apple_cal.create_watering_event(
                plant_id=plant.id,
                plant_name=plant.name,
                scheduled_date=next_date,
                learned_interval=agent.get_learned_interval(history),
                confidence=agent.get_confidence(len(history)),
                location=plant.location or ""
            )
            if uid:
                synced += 1
        except Exception as e:
            print(f"Error syncing {plant.name}: {e}")
    
    return {"success": True, "synced": synced}


class PlantSyncData(BaseModel):
    id: int
    name: str
    location: Optional[str] = ""
    nextDate: str
    interval: int = 7
    confidence: float = 50


class AppleSyncRequest(BaseModel):
    plants: List[PlantSyncData]


@app.post("/api/calendar/apple/sync")
async def sync_apple_calendar(data: AppleSyncRequest, db: Session = Depends(get_db)):
    """Sync all plants to Apple Calendar."""
    connection = db.query(CalendarConnection).filter(
        CalendarConnection.provider == "apple"
    ).first()
    
    if not connection or not connection.apple_id:
        raise HTTPException(status_code=400, detail="Apple Calendar not connected")
    
    apple_cal = get_apple_calendar_service()
    
    if not apple_cal.is_connected():
        success = apple_cal.connect(connection.apple_id, connection.apple_app_password)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to connect to Apple Calendar")
    
    synced = await apple_cal.sync_all_plants([p.dict() for p in data.plants])
    
    connection.last_sync = datetime.utcnow()
    db.commit()
    
    return {"success": True, "synced": synced}


async def sync_event_to_calendars(db: Session, plant: Plant, event: PlantEvent):
    """Sync an event to connected calendars."""
    connection = db.query(CalendarConnection).first()
    if not connection:
        return
    
    agent = get_or_create_agent(plant)
    history = get_plant_history(db, plant.id)
    
    if connection.provider == "google" and connection.google_access_token:
        google_cal = get_google_calendar_service()
        google_cal.set_credentials(
            connection.google_access_token,
            connection.google_refresh_token
        )
        
        event_id = await google_cal.create_watering_event(
            plant_id=plant.id,
            plant_name=plant.name,
            scheduled_date=event.scheduled_date,
            learned_interval=agent.get_learned_interval(history),
            confidence=agent.get_confidence(len(history)),
            ai_explanation=event.ai_explanation
        )
        
        if event_id:
            event.google_event_id = event_id
            db.commit()
    
    elif connection.provider == "apple" and connection.apple_id:
        apple_cal = get_apple_calendar_service()
        apple_cal.connect(connection.apple_id, connection.apple_app_password)
        
        uid = await apple_cal.create_watering_event(
            plant_id=plant.id,
            plant_name=plant.name,
            scheduled_date=event.scheduled_date,
            learned_interval=agent.get_learned_interval(history),
            confidence=agent.get_confidence(len(history))
        )
        
        if uid:
            event.apple_event_uid = uid
            db.commit()


@app.get("/api/export/ics")
async def export_ics(db: Session = Depends(get_db)):
    """Export all future events as ICS file."""
    events = db.query(PlantEvent).filter(
        PlantEvent.scheduled_date >= datetime.utcnow(),
        PlantEvent.completed == False
    ).all()
    
    event_dicts = [
        {
            "id": e.id,
            "plant_id": e.plant_id,
            "plant_name": e.plant_name,
            "type": e.type,
            "date": e.scheduled_date,
            "ai_explanation": e.ai_explanation
        }
        for e in events
    ]
    
    ics_content = ICSExportService.export_events(event_dicts)
    
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=plantmind-schedule.ics"
        }
    )


# ---------- Stats ----------
@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    plants = db.query(Plant).all()
    
    total_plants = len(plants)
    
    # Count plants due today
    today_count = 0
    for plant in plants:
        history = get_plant_history(db, plant.id)
        agent = get_or_create_agent(plant)
        if agent.get_days_until_next_water(history) == 0:
            today_count += 1
    
    # Count fertilize events this week
    week_end = datetime.utcnow() + timedelta(days=7)
    fertilize_count = db.query(PlantEvent).filter(
        PlantEvent.type == "fertilize",
        PlantEvent.scheduled_date <= week_end,
        PlantEvent.completed == False
    ).count()
    
    # Average confidence
    avg_confidence = 0
    if plants:
        confidences = []
        for plant in plants:
            history = get_plant_history(db, plant.id)
            agent = get_or_create_agent(plant)
            confidences.append(agent.get_confidence(len(history)))
        avg_confidence = sum(confidences) / len(confidences)
    
    return {
        "total_plants": total_plants,
        "water_today": today_count,
        "fertilize_this_week": fertilize_count,
        "avg_confidence": round(avg_confidence)
    }


# ================== RUN ==================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
