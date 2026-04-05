import { getDb, withTransaction } from '../db/db.js';

export interface AggregationResult {
  plantsAggregated: number;
  errors: string[];
}

export function aggregateMetrics(): AggregationResult {
  const db = getDb();
  const errors: string[] = [];
  let plantsAggregated = 0;

  const plants = db.prepare('SELECT id FROM plants_raw').all() as { id: string }[];
  const today = new Date().toISOString().split('T')[0];

  const upsertMetric = db.prepare(`
    INSERT INTO plant_health_metrics
      (plant_id, metric_date, health_score, care_compliance_rate, avg_days_overdue, happy_feedback_rate, total_events_30d)
    VALUES (@plant_id, @metric_date, @health_score, @care_compliance_rate, @avg_days_overdue, @happy_feedback_rate, @total_events_30d)
    ON CONFLICT(plant_id, metric_date) DO UPDATE SET
      health_score = excluded.health_score,
      care_compliance_rate = excluded.care_compliance_rate,
      avg_days_overdue = excluded.avg_days_overdue,
      happy_feedback_rate = excluded.happy_feedback_rate,
      total_events_30d = excluded.total_events_30d,
      computed_at = datetime('now')
  `);

  withTransaction(db, () => {
    for (const plant of plants) {
      try {
        const events30d = db.prepare(`
          SELECT * FROM care_events
          WHERE plant_id = ?
            AND scheduled_date >= datetime('now', '-30 days')
        `).all(plant.id) as any[];

        const totalEvents = events30d.length;
        if (totalEvents === 0) {
          upsertMetric.run({
            plant_id: plant.id,
            metric_date: today,
            health_score: 50,
            care_compliance_rate: 0,
            avg_days_overdue: 0,
            happy_feedback_rate: 0,
            total_events_30d: 0
          });
          plantsAggregated++;
          continue;
        }

        const completedEvents = events30d.filter((e: any) => e.status === 'completed');
        const careComplianceRate = completedEvents.length / totalEvents;

        const overdueValues = completedEvents
          .filter((e: any) => e.days_overdue !== null)
          .map((e: any) => Math.abs(e.days_overdue));
        const avgDaysOverdue = overdueValues.length > 0
          ? overdueValues.reduce((a: number, b: number) => a + b, 0) / overdueValues.length
          : 0;

        const feedbackEvents = completedEvents.filter((e: any) => e.feedback !== null);
        const happyEvents = feedbackEvents.filter((e: any) => e.feedback === 'happy');
        const happyFeedbackRate = feedbackEvents.length > 0 ? happyEvents.length / feedbackEvents.length : 0.5;

        const timelinessScore = Math.max(0, 1 - (avgDaysOverdue / 3));
        const healthScore = Math.round(
          (careComplianceRate * 0.4 + timelinessScore * 0.3 + happyFeedbackRate * 0.3) * 100
        );

        upsertMetric.run({
          plant_id: plant.id,
          metric_date: today,
          health_score: healthScore,
          care_compliance_rate: Math.round(careComplianceRate * 100) / 100,
          avg_days_overdue: Math.round(avgDaysOverdue * 100) / 100,
          happy_feedback_rate: Math.round(happyFeedbackRate * 100) / 100,
          total_events_30d: totalEvents
        });
        plantsAggregated++;
      } catch (e) {
        errors.push(`Aggregate plant ${plant.id}: ${(e as Error).message}`);
      }
    }
  });

  return { plantsAggregated, errors };
}
