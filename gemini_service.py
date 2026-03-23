"""
PlantMind - Gemini AI Service
Integration with Google's Gemini API for plant care insights
"""

import google.generativeai as genai
from typing import Optional, Dict, List
from datetime import datetime
import json
import re


class GeminiService:
    """
    Service for interacting with Google's Gemini AI.
    Provides plant care insights, death analysis, and chat functionality.
    """
    
    def __init__(self, api_key: str):
        """Initialize with Gemini API key."""
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # System context for plant care
        self.system_context = """You are PlantMind AI, an expert plant care assistant specializing in:
- Bottom watering techniques and schedules
- Learning from user watering patterns
- Preventing plant deaths through data analysis
- Providing concise, actionable advice

Rules:
- Keep responses brief (2-4 sentences unless asked for more)
- Focus on practical, actionable advice
- Consider bottom watering has longer absorption time than top watering
- Minimum 2 days between waterings for bottom watering
- Be friendly and encouraging
"""
    
    async def analyze_plant_death(
        self,
        plant_name: str,
        death_cause: str,
        notes: str,
        avg_interval: float,
        total_waterings: int,
        watering_history: List[Dict] = None
    ) -> Dict:
        """
        Analyze why a plant died and suggest improvements for future plants.
        Returns analysis, new suggested interval, and prevention tip.
        """
        prompt = f"""{self.system_context}

A plant has died and we need to learn from it to protect future plants.

Plant: {plant_name}
Death cause reported by user: {death_cause}
User notes: {notes or 'None provided'}
Watering method: Bottom watering only
Average watering interval used: {avg_interval:.1f} days
Total waterings recorded: {total_waterings}

Based on this information:
1. Analyze what likely went wrong (1-2 sentences)
2. Suggest a new watering interval in days for a replacement plant
3. Provide one key prevention tip

Format your response EXACTLY as:
ANALYSIS: [your analysis]
NEW_INTERVAL: [number only]
TIP: [prevention tip]
"""

        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            # Parse response
            analysis = "Based on the reported cause, adjusting watering schedule."
            new_interval = self._calculate_fallback_interval(death_cause, avg_interval)
            tip = "Monitor soil moisture before watering."
            
            # Extract ANALYSIS
            analysis_match = re.search(r'ANALYSIS:\s*(.+?)(?=NEW_INTERVAL|$)', text, re.IGNORECASE | re.DOTALL)
            if analysis_match:
                analysis = analysis_match.group(1).strip()
            
            # Extract NEW_INTERVAL
            interval_match = re.search(r'NEW_INTERVAL:\s*(\d+)', text, re.IGNORECASE)
            if interval_match:
                new_interval = int(interval_match.group(1))
                # Ensure reasonable bounds
                new_interval = max(2, min(30, new_interval))
            
            # Extract TIP
            tip_match = re.search(r'TIP:\s*(.+?)$', text, re.IGNORECASE | re.DOTALL)
            if tip_match:
                tip = tip_match.group(1).strip()
            
            return {
                'analysis': analysis,
                'new_interval': new_interval,
                'tip': tip,
                'raw_response': text
            }
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return {
                'analysis': f"Unable to get AI analysis. Based on {death_cause}, adjusting interval.",
                'new_interval': self._calculate_fallback_interval(death_cause, avg_interval),
                'tip': "Check soil moisture before watering to prevent over/under watering.",
                'error': str(e)
            }
    
    def _calculate_fallback_interval(self, death_cause: str, avg_interval: float) -> int:
        """Calculate new interval without AI if API fails."""
        if death_cause == 'overwatering':
            return max(2, min(30, round(avg_interval * 1.3)))
        elif death_cause == 'underwatering':
            return max(2, min(30, round(avg_interval * 0.75)))
        else:
            return max(2, min(30, round(avg_interval)))
    
    async def get_plant_advice(
        self,
        plant_name: str,
        location: str,
        learned_interval: float,
        total_waterings: int,
        context: str
    ) -> str:
        """Get general advice about a specific plant."""
        prompt = f"""{self.system_context}

Plant: {plant_name}
Location: {location or 'Not specified'}
Watering method: Bottom watering only
Current learned interval: {learned_interval:.1f} days
Total waterings recorded: {total_waterings}
User's question/context: {context}

Provide brief, actionable advice (2-3 sentences max).
"""

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Sorry, I couldn't connect to get advice. Error: {str(e)}"
    
    async def chat(
        self,
        user_message: str,
        plants_context: str = "",
        dead_plants_context: str = ""
    ) -> str:
        """
        General chat about plant care.
        Includes context about user's plants.
        """
        prompt = f"""{self.system_context}

Current plants: {plants_context or 'None'}
Past plants that died: {dead_plants_context or 'None'}

User message: {user_message}

Respond helpfully and concisely (3-4 sentences max unless more detail is needed).
"""

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Sorry, I had trouble connecting. Please try again. Error: {str(e)}"
    
    async def explain_schedule_change(
        self,
        plant_name: str,
        old_interval: float,
        new_interval: float,
        reason: str
    ) -> str:
        """Generate a plain-language explanation for a schedule change."""
        prompt = f"""{self.system_context}

Explain this schedule change in simple, friendly language (1-2 sentences):

Plant: {plant_name}
Previous watering interval: {old_interval:.1f} days
New watering interval: {new_interval:.1f} days
Reason: {reason}

Be encouraging and explain briefly why this change is good.
"""

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            direction = "increased" if new_interval > old_interval else "decreased"
            return f"I've {direction} {plant_name}'s watering interval from {old_interval:.0f} to {new_interval:.0f} days based on your watering pattern."
    
    async def get_revival_advice(
        self,
        plant_name: str,
        death_cause: str,
        old_interval: float,
        new_interval: float,
        gemini_tip: str = ""
    ) -> str:
        """Get advice when reviving a previously dead plant type."""
        prompt = f"""{self.system_context}

The user is getting a new {plant_name} after their previous one died from {death_cause}.

Previous interval: {old_interval:.1f} days
New AI-suggested interval: {new_interval:.1f} days
Previous tip: {gemini_tip or 'None'}

Give a brief, encouraging message (2-3 sentences) about how this new plant has a better chance because we learned from the past.
"""

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Your new {plant_name} is set up with an adjusted {new_interval:.0f}-day watering schedule. We learned from the past - this one will thrive!"


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service(api_key: str = None) -> GeminiService:
    """Get or create Gemini service instance."""
    global _gemini_service
    
    if _gemini_service is None:
        if api_key is None:
            api_key = "AIzaSyDJZAXxiXmOBbPPCioY1Mpj_c8bWp9kEIk"  # Default key
        _gemini_service = GeminiService(api_key)
    
    return _gemini_service
