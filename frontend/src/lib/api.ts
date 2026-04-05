const API_BASE = 'http://localhost:3001/api';

export interface AnalyticsSummary {
  totalPlants: number;
  totalEvents: number;
  avgHealthScore: number;
  avgCompliance: number;
  mostActivePlant: string | null;
  overdueCount: number;
  lastPipelineRun: string | null;
}

export interface PipelineRunResult {
  success: boolean;
  stages: {
    transform: { eventsTransformed: number; errors: string[] };
    aggregate: { plantsAggregated: number; errors: string[] };
  };
  duration_ms: number;
}

export interface WeeklyEvent {
  week: string;
  total: number;
  completed: number;
  skipped: number;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function syncPlantsToBackend(plants: any[]): Promise<void> {
  // Normalize plant data for backend
  const normalized = plants.map(p => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    created_at: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    last_watered: p.lastWatered ? (p.lastWatered instanceof Date ? p.lastWatered.toISOString() : p.lastWatered) : null,
    last_fertilized: p.lastFertilized ? (p.lastFertilized instanceof Date ? p.lastFertilized.toISOString() : p.lastFertilized) : null,
    watering_interval: p.wateringInterval,
    fertilizing_interval: p.fertilizingInterval,
    learning_state_json: JSON.stringify(p.learningState || {})
  }));

  const events = plants.flatMap(p =>
    (p.history || []).map((e: any) => ({
      id: e.id,
      plant_id: e.plantId,
      type: e.type,
      scheduled_date: e.scheduledDate instanceof Date ? e.scheduledDate.toISOString() : e.scheduledDate,
      completed_date: e.completedDate ? (e.completedDate instanceof Date ? e.completedDate.toISOString() : e.completedDate) : null,
      status: e.status,
      adjusted_by: e.adjustedBy ?? null,
      feedback: e.feedback ?? null
    }))
  );

  await fetchApi('/plants/sync', { method: 'POST', body: JSON.stringify({ plants: normalized }) });
  if (events.length > 0) {
    await fetchApi('/events/sync', { method: 'POST', body: JSON.stringify({ events }) });
  }
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  return fetchApi<AnalyticsSummary>('/analytics/summary');
}

export async function getTrends(): Promise<{ weeklyEvents: WeeklyEvent[]; healthTrend: any[] } | null> {
  return fetchApi('/analytics/trends');
}

export async function runPipeline(): Promise<PipelineRunResult | null> {
  return fetchApi<PipelineRunResult>('/analytics/run-pipeline', { method: 'POST' });
}

export async function getPipelineRuns(): Promise<any[] | null> {
  return fetchApi('/analytics/pipeline-runs');
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:3001/health');
    return res.ok;
  } catch {
    return false;
  }
}
