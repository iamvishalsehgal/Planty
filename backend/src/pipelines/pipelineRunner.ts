import { getDb } from '../db/db.js';
import { transformEvents } from './transformPipeline.js';
import { aggregateMetrics } from './aggregationPipeline.js';

export interface PipelineRunResult {
  success: boolean;
  stages: {
    transform: { eventsTransformed: number; errors: string[] };
    aggregate: { plantsAggregated: number; errors: string[] };
  };
  duration_ms: number;
}

export async function runFullPipeline(): Promise<PipelineRunResult> {
  const db = getDb();
  const startTime = Date.now();

  const run = db.prepare(`
    INSERT INTO pipeline_runs (pipeline_name, status) VALUES ('full_etl', 'running')
  `).run();
  const runId = run.lastInsertRowid as number;

  try {
    // Stage 1: Transform raw events
    const transformResult = transformEvents();

    // Stage 2: Aggregate metrics
    const aggregateResult = aggregateMetrics();

    const duration = Date.now() - startTime;
    const totalRecords = transformResult.eventsTransformed + aggregateResult.plantsAggregated;

    db.prepare(`
      UPDATE pipeline_runs
      SET status = 'success', records_processed = ?, finished_at = datetime('now')
      WHERE id = ?
    `).run(totalRecords, runId);

    return {
      success: true,
      stages: {
        transform: transformResult,
        aggregate: aggregateResult
      },
      duration_ms: duration
    };
  } catch (error) {
    db.prepare(`
      UPDATE pipeline_runs
      SET status = 'error', error_message = ?, finished_at = datetime('now')
      WHERE id = ?
    `).run((error as Error).message, runId);

    throw error;
  }
}
