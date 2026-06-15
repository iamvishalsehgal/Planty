"""Plant CRUD + watering events."""

from datetime import datetime, timezone
from uuid import uuid4
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from models import (
    PlantCreate, PlantUpdate, PlantResponse,
    WateringCreate, WateringResponse,
)
from db import get_db

router = APIRouter(prefix="/api", tags=["plants"])


def _compute_health_status(next_watering: str) -> str:
    """Determine plant health status based on watering schedule."""
    next_dt = datetime.fromisoformat(next_watering)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    days_until = (next_dt - now).days

    if days_until < 0:
        return "overdue"
    if days_until == 0:
        return "dry"
    if days_until <= 2:
        return "warning"
    return "healthy"


def _row_to_plant(row) -> dict:
    """Convert a DB row to a plant dict."""
    return {
        "id": row.id,
        "name": row.name,
        "species": row.species,
        "room": row.room,
        "photo_url": row.photo_url,
        "watering_interval_days": row.watering_interval_days,
        "last_watered": row.last_watered,
        "next_watering": row.next_watering,
        "health_status": row.health_status,
        "created_at": row.created_at,
    }


@router.get("/plants", response_model=List[PlantResponse])
def list_plants(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM plants ORDER BY created_at DESC")).fetchall()
    return [_row_to_plant(r) for r in rows]


@router.get("/plants/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Plant not found")
    return _row_to_plant(row)


@router.post("/plants", response_model=PlantResponse, status_code=201)
def create_plant(data: PlantCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    plant_id = str(uuid4())

    # Compute initial watering dates
    last_watered = now.isoformat()
    next_watering = datetime.fromtimestamp(
        now.timestamp() + data.watering_interval_days * 86400
    ).isoformat()
    health_status = "healthy"

    db.execute(text("""
        INSERT INTO plants (id, name, species, room, photo_url,
            watering_interval_days, last_watered, next_watering,
            health_status, created_at)
        VALUES (:id, :name, :species, :room, :photo_url,
            :watering_interval_days, :last_watered, :next_watering,
            :health_status, :created_at)
    """), {
        "id": plant_id,
        "name": data.name,
        "species": data.species,
        "room": data.room,
        "photo_url": data.photo_url,
        "watering_interval_days": data.watering_interval_days,
        "last_watered": last_watered,
        "next_watering": next_watering,
        "health_status": health_status,
        "created_at": now.isoformat(),
    })
    db.commit()

    row = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    return _row_to_plant(row)


@router.patch("/plants/{plant_id}", response_model=PlantResponse)
def update_plant(plant_id: str, data: PlantUpdate, db: Session = Depends(get_db)):
    existing = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Plant not found")

    updates = {}
    for field in ["name", "species", "room", "photo_url", "watering_interval_days"]:
        val = getattr(data, field)
        if val is not None:
            updates[field] = val

    if updates:
        # Recompute next watering if interval changed
        if "watering_interval_days" in updates:
            last = datetime.fromisoformat(existing.last_watered)
            next_dt = datetime.fromtimestamp(
                last.timestamp() + updates["watering_interval_days"] * 86400
            )
            updates["next_watering"] = next_dt.isoformat()

        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = plant_id
        db.execute(text(f"UPDATE plants SET {set_clause} WHERE id = :id"), updates)
        db.commit()

    row = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    # Recompute health
    health = _compute_health_status(row.next_watering)
    db.execute(text("UPDATE plants SET health_status = :s WHERE id = :id"), {"s": health, "id": plant_id})
    db.commit()

    row = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    return _row_to_plant(row)


@router.delete("/plants/{plant_id}", status_code=204)
def delete_plant(plant_id: str, db: Session = Depends(get_db)):
    existing = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Plant not found")
    db.execute(text("DELETE FROM plants WHERE id = :id"), {"id": plant_id})
    db.commit()


# ── Watering events ──

@router.post("/plants/{plant_id}/water", response_model=WateringResponse, status_code=201)
def water_plant(plant_id: str, data: WateringCreate, db: Session = Depends(get_db)):
    plant = db.execute(text("SELECT * FROM plants WHERE id = :id"), {"id": plant_id}).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    event_id = str(uuid4())

    # Update plant watering dates
    next_watering = datetime.fromtimestamp(
        now.timestamp() + plant.watering_interval_days * 86400
    ).isoformat()

    db.execute(text("""
        UPDATE plants SET last_watered = :lw, next_watering = :nw, health_status = 'healthy'
        WHERE id = :id
    """), {"lw": now.isoformat(), "nw": next_watering, "id": plant_id})

    # Record the event
    db.execute(text("""
        INSERT INTO watering_events (id, plant_id, timestamp, amount_ml, notes)
        VALUES (:id, :plant_id, :timestamp, :amount_ml, :notes)
    """), {
        "id": event_id,
        "plant_id": plant_id,
        "timestamp": now.isoformat(),
        "amount_ml": data.amount_ml,
        "notes": data.notes,
    })
    db.commit()

    return {
        "id": event_id,
        "plant_id": plant_id,
        "timestamp": now.isoformat(),
        "amount_ml": data.amount_ml,
        "notes": data.notes,
    }


@router.get("/plants/{plant_id}/events", response_model=List[WateringResponse])
def get_watering_events(plant_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text(
        "SELECT * FROM watering_events WHERE plant_id = :pid ORDER BY timestamp DESC LIMIT 50"
    ), {"pid": plant_id}).fetchall()

    return [
        {
            "id": r.id,
            "plant_id": r.plant_id,
            "timestamp": r.timestamp,
            "amount_ml": r.amount_ml,
            "notes": r.notes,
        }
        for r in rows
    ]
