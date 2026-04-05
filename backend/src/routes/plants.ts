import { Router } from 'express';
import { getDb } from '../db/db.js';
import { ingestPlants } from '../pipelines/ingestionPipeline.js';

const router = Router();

// GET /api/plants - list all plants with latest health metrics
router.get('/', (_req, res) => {
  const db = getDb();
  const plants = db.prepare(`
    SELECT
      p.*,
      m.health_score,
      m.care_compliance_rate,
      m.total_events_30d,
      m.avg_days_overdue,
      m.happy_feedback_rate
    FROM plants_raw p
    LEFT JOIN plant_health_metrics m ON p.id = m.plant_id
      AND m.metric_date = (
        SELECT MAX(metric_date) FROM plant_health_metrics WHERE plant_id = p.id
      )
    ORDER BY p.created_at DESC
  `).all();
  res.json(plants);
});

// GET /api/plants/:id - single plant with full history
router.get('/:id', (req, res) => {
  const db = getDb();
  const plant = db.prepare('SELECT * FROM plants_raw WHERE id = ?').get(req.params.id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });

  const events = db.prepare(`
    SELECT * FROM care_events WHERE plant_id = ? ORDER BY scheduled_date DESC LIMIT 100
  `).all(req.params.id);

  const metrics = db.prepare(`
    SELECT * FROM plant_health_metrics WHERE plant_id = ? ORDER BY metric_date DESC LIMIT 30
  `).all(req.params.id);

  return res.json({ plant, events, metrics });
});

// POST /api/plants/sync - ingest/sync plants from frontend
router.post('/sync', (req, res) => {
  const { plants } = req.body;
  if (!Array.isArray(plants)) return res.status(400).json({ error: 'plants must be an array' });

  const result = ingestPlants(plants);
  return res.json({ success: true, ...result });
});

export default router;
