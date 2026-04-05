export interface PlantRecord {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
  last_watered: string | null;
  last_fertilized: string | null;
  watering_interval: number;
  fertilizing_interval: number;
  learning_state_json: string;
  health_score: number;
  care_compliance: number;
  total_events: number;
}

export interface CareEventRecord {
  id: string;
  plant_id: string;
  type: 'water' | 'fertilize';
  scheduled_date: string;
  completed_date: string | null;
  status: 'pending' | 'completed' | 'skipped' | 'delayed';
  adjusted_by: number | null;
  feedback: string | null;
  // enriched fields (set by transform pipeline)
  days_overdue: number | null;
  was_on_time: number | null; // 0 or 1
}

export interface WeatherSnapshotRecord {
  id: number;
  plant_id: string;
  temperature: number;
  humidity: number;
  season: string;
  watering_multiplier: number;
  recorded_at: string;
}

export interface PlantHealthMetric {
  plant_id: string;
  metric_date: string;
  health_score: number;
  care_compliance_rate: number;
  avg_days_overdue: number;
  happy_feedback_rate: number;
  total_events_30d: number;
  computed_at: string;
}

export interface PipelineRunRecord {
  id: number;
  pipeline_name: string;
  status: 'running' | 'success' | 'error';
  records_processed: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

export interface AnalyticsSummary {
  totalPlants: number;
  totalEvents: number;
  avgHealthScore: number;
  avgCompliance: number;
  mostActivePlant: string | null;
  overdueCount: number;
  lastPipelineRun: string | null;
}
