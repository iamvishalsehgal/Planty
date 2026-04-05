import { getDb, withTransaction } from '../db/db.js';
import type { PlantRecord, CareEventRecord } from '../types.js';

export interface IngestionResult {
  plantsIngested: number;
  eventsIngested: number;
  errors: string[];
}

export function ingestPlants(plants: PlantRecord[]): IngestionResult {
  const db = getDb();
  const errors: string[] = [];
  let plantsIngested = 0;

  const upsertPlant = db.prepare(`
    INSERT INTO plants_raw (id, name, emoji, created_at, last_watered, last_fertilized,
      watering_interval, fertilizing_interval, learning_state_json)
    VALUES (@id, @name, @emoji, @created_at, @last_watered, @last_fertilized,
      @watering_interval, @fertilizing_interval, @learning_state_json)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      emoji = excluded.emoji,
      last_watered = excluded.last_watered,
      last_fertilized = excluded.last_fertilized,
      watering_interval = excluded.watering_interval,
      fertilizing_interval = excluded.fertilizing_interval,
      learning_state_json = excluded.learning_state_json,
      ingested_at = datetime('now')
  `);

  withTransaction(db, () => {
    for (const plant of plants) {
      try {
        upsertPlant.run({
          id: plant.id,
          name: plant.name,
          emoji: plant.emoji,
          created_at: plant.created_at || new Date().toISOString(),
          last_watered: plant.last_watered,
          last_fertilized: plant.last_fertilized,
          watering_interval: plant.watering_interval,
          fertilizing_interval: plant.fertilizing_interval,
          learning_state_json: plant.learning_state_json || '{}'
        });
        plantsIngested++;
      } catch (e) {
        errors.push(`Plant ${plant.id}: ${(e as Error).message}`);
      }
    }
  });

  return { plantsIngested, eventsIngested: 0, errors };
}

export function ingestEvents(events: CareEventRecord[]): IngestionResult {
  const db = getDb();
  const errors: string[] = [];
  let eventsIngested = 0;

  const upsertEvent = db.prepare(`
    INSERT INTO events_raw (id, plant_id, type, scheduled_date, completed_date, status, adjusted_by, feedback)
    VALUES (@id, @plant_id, @type, @scheduled_date, @completed_date, @status, @adjusted_by, @feedback)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      completed_date = excluded.completed_date,
      feedback = excluded.feedback,
      ingested_at = datetime('now')
  `);

  withTransaction(db, () => {
    for (const event of events) {
      try {
        upsertEvent.run({
          id: event.id,
          plant_id: event.plant_id,
          type: event.type,
          scheduled_date: event.scheduled_date,
          completed_date: event.completed_date || null,
          status: event.status,
          adjusted_by: event.adjusted_by ?? null,
          feedback: event.feedback || null
        });
        eventsIngested++;
      } catch (e) {
        errors.push(`Event ${event.id}: ${(e as Error).message}`);
      }
    }
  });

  return { plantsIngested: 0, eventsIngested, errors };
}
