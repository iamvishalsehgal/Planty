import { getDb, withTransaction } from '../db/db.js';

export interface TransformResult {
  eventsTransformed: number;
  errors: string[];
}

export function transformEvents(): TransformResult {
  const db = getDb();
  const errors: string[] = [];
  let eventsTransformed = 0;

  const rawEvents = db.prepare(`
    SELECT e.*
    FROM events_raw e
    LEFT JOIN care_events ce ON e.id = ce.id
    WHERE ce.id IS NULL
       OR e.ingested_at > ce.transformed_at
  `).all() as any[];

  const upsertTransformed = db.prepare(`
    INSERT INTO care_events (id, plant_id, type, scheduled_date, completed_date,
      status, adjusted_by, feedback, days_overdue, was_on_time)
    VALUES (@id, @plant_id, @type, @scheduled_date, @completed_date,
      @status, @adjusted_by, @feedback, @days_overdue, @was_on_time)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      completed_date = excluded.completed_date,
      feedback = excluded.feedback,
      days_overdue = excluded.days_overdue,
      was_on_time = excluded.was_on_time,
      transformed_at = datetime('now')
  `);

  withTransaction(db, () => {
    for (const raw of rawEvents) {
      try {
        let daysOverdue: number | null = null;
        let wasOnTime: number | null = null;

        if (raw.completed_date && raw.scheduled_date) {
          const scheduled = new Date(raw.scheduled_date);
          const completed = new Date(raw.completed_date);
          const diffMs = completed.getTime() - scheduled.getTime();
          daysOverdue = diffMs / (1000 * 60 * 60 * 24);
          wasOnTime = Math.abs(daysOverdue) <= 0.5 ? 1 : 0;
        } else if (raw.status === 'skipped') {
          daysOverdue = null;
          wasOnTime = 0;
        }

        upsertTransformed.run({
          id: raw.id,
          plant_id: raw.plant_id,
          type: raw.type,
          scheduled_date: raw.scheduled_date,
          completed_date: raw.completed_date,
          status: raw.status,
          adjusted_by: raw.adjusted_by,
          feedback: raw.feedback,
          days_overdue: daysOverdue,
          was_on_time: wasOnTime
        });
        eventsTransformed++;
      } catch (e) {
        errors.push(`Transform event ${raw.id}: ${(e as Error).message}`);
      }
    }
  });

  return { eventsTransformed, errors };
}
