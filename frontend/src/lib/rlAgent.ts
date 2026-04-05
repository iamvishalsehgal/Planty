import { Plant, CareEvent, LearningState, SeasonalConfig } from '../types';

const ACTIONS = [-2, -1, 0, 1, 2]; // Days to adjust interval
const LEARNING_RATE = 0.1;
const DISCOUNT_FACTOR = 0.9;
const MIN_EXPLORATION = 0.05;
const EXPLORATION_DECAY = 0.995;
const MIN_INTERVAL = 2;
const MAX_INTERVAL = 28;

export function createInitialLearningState(): LearningState {
  return {
    qTable: {},
    episodeCount: 0,
    totalReward: 0,
    lastAction: 0,
    explorationRate: 0.3,
    stabilityScore: 0
  };
}

function getState(plant: Plant, seasonalConfig: SeasonalConfig): string {
  const daysSinceWater = plant.lastWatered
    ? Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24))
    : plant.wateringInterval;

  // Discretize days since watering
  let waterState: string;
  if (daysSinceWater <= 2) waterState = 'fresh';
  else if (daysSinceWater <= 5) waterState = 'good';
  else if (daysSinceWater <= 8) waterState = 'moderate';
  else if (daysSinceWater <= 12) waterState = 'dry';
  else waterState = 'very_dry';

  // Interval category
  let intervalState: string;
  if (plant.wateringInterval <= 4) intervalState = 'short';
  else if (plant.wateringInterval <= 8) intervalState = 'medium';
  else if (plant.wateringInterval <= 14) intervalState = 'long';
  else intervalState = 'very_long';

  // Season state
  const seasonState = seasonalConfig.season;

  // Temperature state
  let tempState: string;
  if (seasonalConfig.temperatureC > 28) tempState = 'hot';
  else if (seasonalConfig.temperatureC > 20) tempState = 'warm';
  else if (seasonalConfig.temperatureC > 12) tempState = 'cool';
  else tempState = 'cold';

  return `${waterState}_${intervalState}_${seasonState}_${tempState}`;
}

function getQValues(state: string, qTable: Record<string, number[]>): number[] {
  if (!qTable[state]) {
    qTable[state] = ACTIONS.map(() => 0);
  }
  return qTable[state];
}

export function selectAction(plant: Plant, seasonalConfig: SeasonalConfig): { action: number; isExploration: boolean } {
  const state = getState(plant, seasonalConfig);
  const qValues = getQValues(state, plant.learningState.qTable);

  // Epsilon-greedy
  if (Math.random() < plant.learningState.explorationRate) {
    const randomIndex = Math.floor(Math.random() * ACTIONS.length);
    return { action: ACTIONS[randomIndex], isExploration: true };
  }

  // Greedy
  const maxQ = Math.max(...qValues);
  const bestActions = ACTIONS.filter((_, i) => qValues[i] === maxQ);
  const action = bestActions[Math.floor(Math.random() * bestActions.length)];

  return { action, isExploration: false };
}

export function calculateReward(event: CareEvent, plant: Plant): number {
  let reward = 0;

  switch (event.status) {
    case 'completed':
      reward += 10;
      if (event.feedback === 'happy') reward += 5;
      if (event.feedback === 'thirsty') reward -= 3; // Interval too long
      if (event.feedback === 'overwatered') reward -= 8;
      // Bonus for on-time completion
      if (event.completedDate && event.scheduledDate) {
        const diffHours = Math.abs(
          new Date(event.completedDate).getTime() - new Date(event.scheduledDate).getTime()
        ) / (1000 * 60 * 60);
        if (diffHours < 12) reward += 3;
      }
      break;

    case 'skipped':
      reward -= 10;
      break;

    case 'delayed':
      reward -= 5;
      if (event.adjustedBy && event.adjustedBy > 2) {
        reward -= event.adjustedBy; // Bigger delay = bigger penalty
      }
      break;
  }

  // Stability bonus
  if (plant.learningState.stabilityScore > 0.7) {
    reward += 2;
  }

  // Penalize extreme intervals
  if (plant.wateringInterval < 3) reward -= 5;
  if (plant.wateringInterval > 21) reward -= 3;

  return reward;
}

export function updateQTable(
  plant: Plant,
  event: CareEvent,
  seasonalConfig: SeasonalConfig
): LearningState {
  const state = getState(plant, seasonalConfig);
  const reward = calculateReward(event, plant);
  const qValues = getQValues(state, plant.learningState.qTable);

  const actionIndex = ACTIONS.indexOf(plant.learningState.lastAction);
  if (actionIndex === -1) return plant.learningState;

  // Q-learning update
  const maxNextQ = Math.max(...qValues);
  qValues[actionIndex] = qValues[actionIndex] +
    LEARNING_RATE * (reward + DISCOUNT_FACTOR * maxNextQ - qValues[actionIndex]);

  // Update stability score
  const recentEvents = plant.history.slice(-10);
  const completedOnTime = recentEvents.filter(e =>
    e.status === 'completed' && (!e.adjustedBy || Math.abs(e.adjustedBy) <= 1)
  ).length;
  const stabilityScore = recentEvents.length > 0 ? completedOnTime / recentEvents.length : 0;

  // Decay exploration rate
  const newExplorationRate = Math.max(
    MIN_EXPLORATION,
    plant.learningState.explorationRate * EXPLORATION_DECAY
  );

  return {
    ...plant.learningState,
    qTable: { ...plant.learningState.qTable, [state]: qValues },
    episodeCount: plant.learningState.episodeCount + 1,
    totalReward: plant.learningState.totalReward + reward,
    explorationRate: newExplorationRate,
    stabilityScore
  };
}

export function calculateNextInterval(
  currentInterval: number,
  action: number,
  seasonalConfig: SeasonalConfig,
  type: 'water' | 'fertilize'
): number {
  const multiplier = type === 'water'
    ? seasonalConfig.wateringMultiplier
    : seasonalConfig.fertilizingMultiplier;

  // Apply action and seasonal multiplier
  let newInterval = (currentInterval + action) * multiplier;

  // Clamp to valid range
  newInterval = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, Math.round(newInterval)));

  return newInterval;
}

export function explainScheduleChange(
  oldInterval: number,
  newInterval: number,
  seasonalConfig: SeasonalConfig,
  isExploration: boolean
): string {
  const diff = newInterval - oldInterval;

  if (diff === 0) {
    return "Schedule looks good, no changes needed.";
  }

  const parts: string[] = [];

  if (Math.abs(diff) > 0) {
    const direction = diff > 0 ? 'extended' : 'shortened';
    parts.push(`${direction} by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`);
  }

  // Add reason
  if (seasonalConfig.temperatureC > 28) {
    parts.push("due to hot weather");
  } else if (seasonalConfig.temperatureC < 12) {
    parts.push("due to cool weather");
  } else if (seasonalConfig.season === 'summer') {
    parts.push("for summer conditions");
  } else if (seasonalConfig.season === 'winter') {
    parts.push("for winter conditions");
  } else if (isExploration) {
    parts.push("to test a new schedule");
  } else {
    parts.push("based on your feedback");
  }

  return `Watering ${parts.join(' ')}.`;
}

export function getLearningProgress(plant: Plant): {
  level: string;
  progress: number;
  nextMilestone: string;
} {
  const episodes = plant.learningState.episodeCount;

  if (episodes < 5) {
    return {
      level: 'Learning',
      progress: (episodes / 5) * 100,
      nextMilestone: `${5 - episodes} more events to establish baseline`
    };
  } else if (episodes < 15) {
    return {
      level: 'Adapting',
      progress: ((episodes - 5) / 10) * 100,
      nextMilestone: `${15 - episodes} more events to optimize schedule`
    };
  } else if (plant.learningState.stabilityScore < 0.7) {
    return {
      level: 'Optimizing',
      progress: plant.learningState.stabilityScore * 100,
      nextMilestone: 'Needs more consistent feedback'
    };
  } else {
    return {
      level: 'Optimized',
      progress: 100,
      nextMilestone: 'Continuously improving'
    };
  }
}
