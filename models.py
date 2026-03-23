"""
PlantMind - Database Models
SQLAlchemy models for plants, events, watering history, and learning data
"""

from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class Plant(Base):
    """Active plant model"""
    __tablename__ = "plants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    normalized_name = Column(String(100), index=True)  # lowercase for matching
    location = Column(String(200), default="")
    water_interval = Column(Integer, default=7)  # Initial estimate in days
    fertilize_interval = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # RL Learning Data
    learned_water_interval = Column(Float, default=7.0)
    learned_fertilize_interval = Column(Float, default=30.0)
    confidence = Column(Float, default=20.0)  # 0-100%
    episode_count = Column(Integer, default=0)
    q_table = Column(JSON, default=dict)
    
    # Revival tracking
    revived_from_id = Column(Integer, nullable=True)
    has_death_protection = Column(Boolean, default=False)
    
    # Relationships
    watering_history = relationship("WateringHistory", back_populates="plant", cascade="all, delete-orphan")
    events = relationship("PlantEvent", back_populates="plant", cascade="all, delete-orphan")
    reward_signals = relationship("RewardSignal", back_populates="plant", cascade="all, delete-orphan")


class DeadPlant(Base):
    """Memorial for deceased plants - preserves learning data"""
    __tablename__ = "dead_plants"
    
    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer)  # Original plant ID
    name = Column(String(100), nullable=False)
    normalized_name = Column(String(100), index=True)
    location = Column(String(200), default="")
    
    # Death info
    death_date = Column(DateTime, default=datetime.utcnow)
    death_cause = Column(String(50))  # overwatering, underwatering, unknown
    death_notes = Column(Text, default="")
    
    # Preserved learning data
    last_interval = Column(Float)
    suggested_new_interval = Column(Float)
    total_waterings = Column(Integer, default=0)
    watering_history = Column(JSON, default=list)  # Full history preserved
    q_table = Column(JSON, default=dict)
    
    # Gemini analysis
    gemini_analysis = Column(Text, default="")
    gemini_tip = Column(Text, default="")
    
    created_at = Column(DateTime)  # Original creation date


class WateringHistory(Base):
    """Record of all watering/fertilizing events"""
    __tablename__ = "watering_history"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    type = Column(String(20), default="water")  # water or fertilize
    
    plant = relationship("Plant", back_populates="watering_history")


class PlantEvent(Base):
    """Scheduled calendar events"""
    __tablename__ = "plant_events"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    plant_name = Column(String(100))
    type = Column(String(20))  # water or fertilize
    scheduled_date = Column(DateTime, nullable=False)
    
    completed = Column(Boolean, default=False)
    skipped = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    # AI metadata
    ai_scheduled = Column(Boolean, default=True)
    ai_explanation = Column(Text, default="")
    
    # Calendar sync
    google_event_id = Column(String(200), nullable=True)
    apple_event_uid = Column(String(200), nullable=True)
    
    plant = relationship("Plant", back_populates="events")


class RewardSignal(Base):
    """RL reward signals for learning"""
    __tablename__ = "reward_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=False)
    action_type = Column(String(50))  # watering, skip, delay, complete
    reward = Column(Float)
    explanation = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    plant = relationship("Plant", back_populates="reward_signals")


class Explanation(Base):
    """AI explanations for schedule changes"""
    __tablename__ = "explanations"
    
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, nullable=True)
    plant_name = Column(String(100))
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class CalendarConnection(Base):
    """User calendar connections"""
    __tablename__ = "calendar_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(20))  # google or apple
    
    # Google OAuth tokens
    google_access_token = Column(Text, nullable=True)
    google_refresh_token = Column(Text, nullable=True)
    google_token_expiry = Column(DateTime, nullable=True)
    
    # Apple CalDAV credentials
    apple_id = Column(String(200), nullable=True)
    apple_app_password = Column(String(100), nullable=True)
    apple_calendar_url = Column(String(500), nullable=True)
    
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_sync = Column(DateTime, nullable=True)


# Database setup
DATABASE_URL = "sqlite:///./plantmind.db"
ASYNC_DATABASE_URL = "sqlite+aiosqlite:///./plantmind.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
async_engine = create_async_engine(ASYNC_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
