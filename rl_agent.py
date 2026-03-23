"""
PlantMind - Reinforcement Learning Agent
Q-Learning based agent for learning optimal watering schedules per plant
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import json


@dataclass
class State:
    """RL State representation for a plant"""
    days_since_water: int
    days_since_fertilize: int
    avg_water_interval: float
    water_variance: float
    consecutive_skips: int
    day_of_week: int
    in_cooldown: bool
    
    def to_tuple(self) -> tuple:
        """Convert to hashable tuple for Q-table lookup"""
        return (
            min(self.days_since_water, 30),  # Cap at 30 days
            min(self.days_since_fertilize, 60),
            round(self.avg_water_interval),
            round(self.water_variance, 1),
            min(self.consecutive_skips, 5),
            self.day_of_week,
            self.in_cooldown
        )
    
    def to_key(self) -> str:
        """Convert to string key for JSON storage"""
        return json.dumps(self.to_tuple())


@dataclass 
class Action:
    """RL Action - schedule water/fertilize in N days"""
    action_type: str  # 'water', 'fertilize', 'skip'
    days_ahead: int = 0
    
    def to_key(self) -> str:
        return f"{self.action_type}_{self.days_ahead}"


class PlantRLAgent:
    """
    Reinforcement Learning agent for a single plant.
    Uses Q-Learning to learn optimal watering/fertilizing schedules.
    """
    
    def __init__(
        self,
        plant_id: int,
        initial_water_interval: int = 7,
        initial_fertilize_interval: int = 30,
        q_table: Optional[Dict] = None,
        episode_count: int = 0
    ):
        self.plant_id = plant_id
        self.initial_water_interval = initial_water_interval
        self.initial_fertilize_interval = initial_fertilize_interval
        
        # Q-Learning parameters
        self.learning_rate = 0.15  # Alpha
        self.discount_factor = 0.95  # Gamma
        self.exploration_rate = max(0.05, 0.3 - episode_count * 0.01)  # Epsilon decay
        
        # Bottom watering constraints
        self.min_cooldown_days = 2
        self.max_interval = 30
        self.min_interval = 2
        
        # Q-table: state -> action -> value
        self.q_table = q_table or {}
        self.episode_count = episode_count
        
        # Reward constants
        self.REWARD_COMPLETION = 10
        self.REWARD_ON_TIME = 5
        self.REWARD_CLOSE = 2
        self.PENALTY_SKIP = -8
        self.PENALTY_OVERWATER = -15
        self.PENALTY_FAR_OFF = -5
    
    def get_state(self, watering_history: List[Dict], fertilize_history: List[Dict] = None) -> State:
        """
        Calculate current state from watering history.
        """
        now = datetime.utcnow()
        
        # Days since last water
        if watering_history:
            last_water = max(h['date'] for h in watering_history)
            if isinstance(last_water, str):
                last_water = datetime.fromisoformat(last_water.replace('Z', '+00:00'))
            days_since_water = (now - last_water).days
        else:
            days_since_water = self.initial_water_interval
        
        # Days since last fertilize
        if fertilize_history:
            last_fert = max(h['date'] for h in fertilize_history)
            if isinstance(last_fert, str):
                last_fert = datetime.fromisoformat(last_fert.replace('Z', '+00:00'))
            days_since_fertilize = (now - last_fert).days
        else:
            days_since_fertilize = self.initial_fertilize_interval
        
        # Calculate average interval and variance
        avg_interval, variance = self._calculate_interval_stats(watering_history)
        
        # Check if in cooldown period
        in_cooldown = days_since_water < self.min_cooldown_days
        
        return State(
            days_since_water=days_since_water,
            days_since_fertilize=days_since_fertilize,
            avg_water_interval=avg_interval,
            water_variance=variance,
            consecutive_skips=0,  # Would need event history
            day_of_week=now.weekday(),
            in_cooldown=in_cooldown
        )
    
    def _calculate_interval_stats(self, history: List[Dict]) -> Tuple[float, float]:
        """Calculate average interval and variance from watering history."""
        if len(history) < 2:
            return float(self.initial_water_interval), 0.0
        
        # Sort by date
        sorted_history = sorted(
            history, 
            key=lambda h: h['date'] if isinstance(h['date'], datetime) 
                         else datetime.fromisoformat(h['date'].replace('Z', '+00:00'))
        )
        
        intervals = []
        for i in range(1, len(sorted_history)):
            date1 = sorted_history[i-1]['date']
            date2 = sorted_history[i]['date']
            
            if isinstance(date1, str):
                date1 = datetime.fromisoformat(date1.replace('Z', '+00:00'))
            if isinstance(date2, str):
                date2 = datetime.fromisoformat(date2.replace('Z', '+00:00'))
            
            diff = (date2 - date1).days
            if self.min_cooldown_days <= diff <= self.max_interval:
                intervals.append(diff)
        
        if not intervals:
            return float(self.initial_water_interval), 0.0
        
        # Weighted average - recent intervals matter more
        weights = [1.5 ** i for i in range(len(intervals))]
        weighted_avg = sum(i * w for i, w in zip(intervals, weights)) / sum(weights)
        variance = np.var(intervals) if len(intervals) > 1 else 0.0
        
        return weighted_avg, variance
    
    def get_learned_interval(self, watering_history: List[Dict]) -> int:
        """Get the learned watering interval based on history."""
        avg, _ = self._calculate_interval_stats(watering_history)
        return max(self.min_interval, min(self.max_interval, round(avg)))
    
    def get_next_water_date(self, watering_history: List[Dict]) -> datetime:
        """Predict the next watering date."""
        learned_interval = self.get_learned_interval(watering_history)
        
        if watering_history:
            last_water = max(h['date'] for h in watering_history)
            if isinstance(last_water, str):
                last_water = datetime.fromisoformat(last_water.replace('Z', '+00:00'))
        else:
            last_water = datetime.utcnow()
        
        next_date = last_water + timedelta(days=learned_interval)
        
        # Ensure it's not in the past
        if next_date < datetime.utcnow():
            next_date = datetime.utcnow()
        
        return next_date
    
    def get_days_until_next_water(self, watering_history: List[Dict]) -> int:
        """Get days until next predicted watering."""
        next_date = self.get_next_water_date(watering_history)
        days = (next_date - datetime.utcnow()).days
        return max(0, days)
    
    def get_q_value(self, state: State, action: Action) -> float:
        """Get Q-value for state-action pair."""
        state_key = state.to_key()
        action_key = action.to_key()
        
        if state_key not in self.q_table:
            self.q_table[state_key] = {}
        
        return self.q_table[state_key].get(action_key, 0.0)
    
    def update_q_value(self, state: State, action: Action, reward: float, next_state: State):
        """Update Q-value using Q-learning update rule."""
        state_key = state.to_key()
        action_key = action.to_key()
        
        if state_key not in self.q_table:
            self.q_table[state_key] = {}
        
        current_q = self.q_table[state_key].get(action_key, 0.0)
        
        # Get max Q-value for next state
        next_state_key = next_state.to_key()
        if next_state_key in self.q_table:
            max_next_q = max(self.q_table[next_state_key].values()) if self.q_table[next_state_key] else 0.0
        else:
            max_next_q = 0.0
        
        # Q-learning update
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_next_q - current_q
        )
        
        self.q_table[state_key][action_key] = new_q
        self.episode_count += 1
    
    def record_watering(self, watering_history: List[Dict]) -> Dict:
        """
        Record a watering event and calculate reward.
        Returns reward info and next predicted date.
        """
        now = datetime.utcnow()
        
        if len(watering_history) < 2:
            reward = 5
            explanation = "First watering recorded! Starting to learn your pattern."
        else:
            # Get previous watering
            sorted_history = sorted(
                watering_history[:-1],  # Exclude current
                key=lambda h: h['date'] if isinstance(h['date'], datetime)
                             else datetime.fromisoformat(h['date'].replace('Z', '+00:00'))
            )
            last_water = sorted_history[-1]['date']
            if isinstance(last_water, str):
                last_water = datetime.fromisoformat(last_water.replace('Z', '+00:00'))
            
            actual_interval = (now - last_water).days
            expected_interval = self.get_learned_interval(watering_history[:-1])
            diff = abs(actual_interval - expected_interval)
            
            # Calculate reward based on timing
            if diff == 0:
                reward = self.REWARD_COMPLETION
                explanation = f"Perfect! Watered exactly on predicted day ({expected_interval}-day interval)"
            elif diff == 1:
                reward = self.REWARD_ON_TIME
                explanation = f"Great! 1 day {'later' if actual_interval > expected_interval else 'earlier'} than predicted"
            elif diff <= 3:
                reward = self.REWARD_CLOSE
                explanation = f"{diff} days {'later' if actual_interval > expected_interval else 'earlier'} - adjusting prediction"
            else:
                reward = self.PENALTY_FAR_OFF
                explanation = f"{diff} days off - significantly updating prediction model"
            
            # Penalty for overwatering (too frequent)
            if actual_interval < self.min_cooldown_days:
                reward = self.PENALTY_OVERWATER
                explanation = f"Warning: Only {actual_interval} days since last watering - too frequent for bottom watering!"
        
        # Update Q-table
        state = self.get_state(watering_history[:-1] if len(watering_history) > 1 else [])
        action = Action(action_type='water', days_ahead=0)
        next_state = self.get_state(watering_history)
        self.update_q_value(state, action, reward, next_state)
        
        # Get next water date
        next_date = self.get_next_water_date(watering_history)
        
        return {
            'reward': reward,
            'explanation': explanation,
            'next_date': next_date,
            'learned_interval': self.get_learned_interval(watering_history),
            'confidence': self.get_confidence(len(watering_history))
        }
    
    def record_skip(self, watering_history: List[Dict]) -> Dict:
        """Record a skipped watering event."""
        state = self.get_state(watering_history)
        action = Action(action_type='skip', days_ahead=0)
        
        reward = self.PENALTY_SKIP
        explanation = "Watering skipped - adjusting future predictions"
        
        # Don't update Q-table as severely for skips
        if state.to_key() not in self.q_table:
            self.q_table[state.to_key()] = {}
        self.q_table[state.to_key()][action.to_key()] = reward
        
        return {
            'reward': reward,
            'explanation': explanation
        }
    
    def get_confidence(self, num_waterings: int) -> float:
        """Calculate confidence percentage based on data points."""
        return min(95.0, 20.0 + num_waterings * 8 + self.episode_count * 3)
    
    def get_q_table_dict(self) -> Dict:
        """Return Q-table as regular dict for JSON serialization."""
        return dict(self.q_table)
    
    def suggest_adjusted_interval(self, death_cause: str, last_interval: float) -> int:
        """
        Suggest a new interval based on how the plant died.
        Used when reviving a plant of the same type.
        """
        if death_cause == 'overwatering':
            # Increase interval by 20-40%
            new_interval = last_interval * 1.3
        elif death_cause == 'underwatering':
            # Decrease interval by 20-30%
            new_interval = last_interval * 0.75
        else:
            # Unknown - slight increase to be safe
            new_interval = last_interval * 1.1
        
        return max(self.min_interval, min(self.max_interval, round(new_interval)))


class PlantRLManager:
    """
    Manager for all plant RL agents.
    Handles agent creation, loading, and coordination.
    """
    
    def __init__(self):
        self.agents: Dict[int, PlantRLAgent] = {}
    
    def get_agent(
        self, 
        plant_id: int, 
        initial_interval: int = 7,
        q_table: Optional[Dict] = None,
        episode_count: int = 0
    ) -> PlantRLAgent:
        """Get or create an agent for a plant."""
        if plant_id not in self.agents:
            self.agents[plant_id] = PlantRLAgent(
                plant_id=plant_id,
                initial_water_interval=initial_interval,
                q_table=q_table,
                episode_count=episode_count
            )
        return self.agents[plant_id]
    
    def remove_agent(self, plant_id: int):
        """Remove an agent (when plant dies or is deleted)."""
        if plant_id in self.agents:
            del self.agents[plant_id]


# Global manager instance
rl_manager = PlantRLManager()
