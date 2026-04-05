export interface Plant {
  id: string;
  name: string;
  emoji: string;
  createdAt: Date;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  wateringInterval: number;
  fertilizingInterval: number;
  history: CareEvent[];
  learningState: LearningState;
}

export interface CareEvent {
  id: string;
  plantId: string;
  type: 'water' | 'fertilize';
  scheduledDate: Date;
  completedDate: Date | null;
  status: 'pending' | 'completed' | 'skipped' | 'delayed';
  adjustedBy?: number;
  feedback?: 'happy' | 'thirsty' | 'overwatered' | null;
}

export interface LearningState {
  qTable: Record<string, number[]>;
  episodeCount: number;
  totalReward: number;
  lastAction: number;
  explorationRate: number;
  stabilityScore: number;
}

export interface SeasonalConfig {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  temperatureC: number;
  humidity: number;
  wateringMultiplier: number;
  fertilizingMultiplier: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  location: string;
}

export interface UserSettings {
  location: { lat: number; lon: number } | null;
  manualTemperature: number | null;
  useAutoWeather: boolean;
  notifications: boolean;
  darkMode: boolean;
}
