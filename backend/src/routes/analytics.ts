import { Router } from 'express';
import { getDb } from '../db/db.js';
import { runFullPipeline } from '../pipelines/pipelineRunner.js';
import type { AnalyticsSummary } from '../types.js';

const router = Router();

// GET /api/analytics/summary - overall dashboard summary
router.get('/summary', (_req, res) => {
  const db = getDb();

  const totalPlants = (db.prepare('SELECT COUNT(*) as c FROM plants_raw').get() as any).c;
  const totalEvents = (db.prepare('SELECT COUNT(*) as c FROM care_events').get() as any).c;

  const avgMetrics = db.prepare(`
    SELECT AVG(health_score) as avg_health, AVG(care_compliance_rate) as avg_compliance
    FROM plant_health_metrics
    WHERE metric_date = (SELECT MAX(metric_date) FROM plant_health_metrics)
  `).get() as any;

  const mostActive = db.prepare(`
    SELECT plant_id, COUNT(*) as cnt FROM care_events
    WHERE scheduled_date >= datetime('now', '-30 days')
    GROUP BY plant_id ORDER BY cnt DESC LIMIT 1
  `).get() as any;

  const mostActivePlantName = mostActive
    ? (db.prepare('SELECT name FROM plants_raw WHERE id = ?').get(mostActive.plant_id) as any)?.name
    : null;

  const overdueCount = (db.prepare(`
    SELECT COUNT(DISTINCT p.id) as c FROM plants_raw p
    WHERE (
      SELECT MAX(scheduled_date) FROM events_raw WHERE plant_id = p.id AND type = 'water'
    ) < datetime('now', '-' || p.watering_interval || ' days')
  `).get() as any).c;

  const lastRun = (db.prepare(`
    SELECT finished_at FROM pipeline_runs WHERE status = 'success' ORDER BY id DESC LIMIT 1
  `).get() as any)?.finished_at;

  const summary: AnalyticsSummary = {
    totalPlants,
    totalEvents,
    avgHealthScore: Math.round(avgMetrics?.avg_health ?? 0),
    avgCompliance: Math.round((avgMetrics?.avg_compliance ?? 0) * 100),
    mostActivePlant: mostActivePlantName,
    overdueCount,
    lastPipelineRun: lastRun
  };

  res.json(summary);
});

// GET /api/analytics/plant/:id - per-plant analytics
router.get('/plant/:id', (req, res) => {
  const db = getDb();
  const plantId = req.params.id;

  const healthHistory = db.prepare(`
    SELECT metric_date, health_score, care_compliance_rate, total_events_30d
    FROM plant_health_metrics
    WHERE plant_id = ?
    ORDER BY metric_date DESC
    LIMIT 30
  `).all(plantId);

  const eventBreakdown = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM care_events WHERE plant_id = ?
    GROUP BY status
  `).all(plantId);

  const feedbackBreakdown = db.prepare(`
    SELECT feedback, COUNT(*) as count
    FROM care_events
    WHERE plant_id = ? AND feedback IS NOT NULL
    GROUP BY feedback
  `).all(plantId);

  const avgDaysOverdue = (db.prepare(`
    SELECT AVG(ABS(days_overdue)) as avg FROM care_events
    WHERE plant_id = ? AND days_overdue IS NOT NULL
  `).get(plantId) as any)?.avg ?? 0;

  res.json({ healthHistory, eventBreakdown, feedbackBreakdown, avgDaysOverdue });
});

// GET /api/analytics/trends - time series trends
router.get('/trends', (_req, res) => {
  const db = getDb();

  // Weekly care events count
  const weeklyEvents = db.prepare(`
    SELECT
      strftime('%Y-W%W', scheduled_date) as week,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped
    FROM care_events
    WHERE scheduled_date >= datetime('now', '-90 days')
    GROUP BY week
    ORDER BY week ASC
  `).all();

  // Health score trend across all plants
  const healthTrend = db.prepare(`
    SELECT metric_date, AVG(health_score) as avg_health, AVG(care_compliance_rate) as avg_compliance
    FROM plant_health_metrics
    WHERE metric_date >= date('now', '-30 days')
    GROUP BY metric_date
    ORDER BY metric_date ASC
  `).all();

  res.json({ weeklyEvents, healthTrend });
});

// GET /api/analytics/export - export all data as JSON
router.get('/export', (_req, res) => {
  const db = getDb();
  const plants = db.prepare('SELECT * FROM plants_raw').all();
  const events = db.prepare('SELECT * FROM care_events').all();
  const metrics = db.prepare('SELECT * FROM plant_health_metrics').all();
  const pipelineRuns = db.prepare('SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 10').all();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="plantcare-data-export.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    plants,
    events,
    metrics,
    pipelineRuns
  });
});

// POST /api/analytics/run-pipeline - manually trigger ETL
router.post('/run-pipeline', async (_req, res) => {
  try {
    const result = await runFullPipeline();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/analytics/pipeline-runs - pipeline audit log
router.get('/pipeline-runs', (_req, res) => {
  const db = getDb();
  const runs = db.prepare('SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 20').all();
  res.json(runs);
});

export default router;
