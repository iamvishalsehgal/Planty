import { Router } from 'express';
import { getDb } from '../db/db.js';
import { ingestEvents } from '../pipelines/ingestionPipeline.js';

const router = Router();

// GET /api/events - recent events
router.get('/', (req, res) => {
  const db = getDb();
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const plantId = req.query.plant_id as string | undefined;

  let query = 'SELECT * FROM care_events';
  const params: any[] = [];
  if (plantId) {
    query += ' WHERE plant_id = ?';
    params.push(plantId);
  }
  query += ' ORDER BY scheduled_date DESC LIMIT ?';
  params.push(limit);

  const events = db.prepare(query).all(...params);
  res.json(events);
});

// POST /api/events/sync - ingest events from frontend
router.post('/sync', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be an array' });

  const result = ingestEvents(events);
  return res.json({ success: true, ...result });
});

export default router;
