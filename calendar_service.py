"""
PlantMind - Calendar Integration Service
Handles Google Calendar API and Apple Calendar (CalDAV) integration
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from dataclasses import dataclass
import json

# Google Calendar
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Apple Calendar (CalDAV)
import caldav
from icalendar import Calendar, Event, Alarm

# ICS Export
from icalendar import Calendar as ICSCalendar, Event as ICSEvent


@dataclass
class CalendarEvent:
    """Unified calendar event representation"""
    id: str
    plant_id: int
    plant_name: str
    event_type: str  # 'water' or 'fertilize'
    start_time: datetime
    end_time: datetime
    description: str
    reminders: List[int] = None  # Minutes before event
    
    # Provider-specific IDs
    google_id: Optional[str] = None
    apple_uid: Optional[str] = None


class GoogleCalendarService:
    """
    Google Calendar API integration.
    Handles OAuth flow and calendar operations.
    """
    
    # OAuth 2.0 scopes
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self, client_id: str = None, client_secret: str = None, redirect_uri: str = None):
        """Initialize Google Calendar service."""
        self.client_id = client_id or os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = redirect_uri or os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/google/callback')
        
        self.credentials: Optional[Credentials] = None
        self.service = None
    
    def get_auth_url(self) -> str:
        """Get OAuth authorization URL for user to visit."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES
        )
        flow.redirect_uri = self.redirect_uri
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return auth_url
    
    def handle_callback(self, authorization_code: str) -> Dict:
        """Handle OAuth callback and get tokens."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.SCOPES
        )
        flow.redirect_uri = self.redirect_uri
        
        flow.fetch_token(code=authorization_code)
        credentials = flow.credentials
        
        return {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }
    
    def set_credentials(self, access_token: str, refresh_token: str = None):
        """Set credentials from stored tokens."""
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret
        )
        self.service = build('calendar', 'v3', credentials=self.credentials)
    
    async def create_watering_event(
        self,
        plant_id: int,
        plant_name: str,
        scheduled_date: datetime,
        learned_interval: int,
        confidence: float,
        ai_explanation: str = ""
    ) -> Optional[str]:
        """Create a watering event in Google Calendar."""
        if not self.service:
            raise ValueError("Not authenticated. Call set_credentials first.")
        
        event = {
            'summary': f'💧 Water {plant_name}',
            'description': f"""AI-scheduled watering for {plant_name}

Watering Method: Bottom watering
Predicted Interval: {learned_interval} days
AI Confidence: {confidence:.0f}%

{ai_explanation}

Powered by PlantMind 🌱""",
            'start': {
                'dateTime': scheduled_date.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': (scheduled_date + timedelta(hours=1)).isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 60},
                    {'method': 'popup', 'minutes': 10},
                ],
            },
            'extendedProperties': {
                'private': {
                    'plantmind_plant_id': str(plant_id),
                    'plantmind_event_type': 'water'
                }
            }
        }
        
        try:
            created = self.service.events().insert(calendarId='primary', body=event).execute()
            return created.get('id')
        except HttpError as e:
            print(f"Google Calendar API error: {e}")
            return None
    
    async def create_fertilize_event(
        self,
        plant_id: int,
        plant_name: str,
        scheduled_date: datetime
    ) -> Optional[str]:
        """Create a fertilizing event in Google Calendar."""
        if not self.service:
            raise ValueError("Not authenticated.")
        
        event = {
            'summary': f'🌱 Fertilize {plant_name}',
            'description': f'Time to fertilize {plant_name}!\n\nPowered by PlantMind 🌱',
            'start': {
                'dateTime': scheduled_date.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': (scheduled_date + timedelta(hours=1)).isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 60},
                ],
            },
            'extendedProperties': {
                'private': {
                    'plantmind_plant_id': str(plant_id),
                    'plantmind_event_type': 'fertilize'
                }
            }
        }
        
        try:
            created = self.service.events().insert(calendarId='primary', body=event).execute()
            return created.get('id')
        except HttpError as e:
            print(f"Google Calendar API error: {e}")
            return None
    
    async def update_event(self, event_id: str, new_date: datetime) -> bool:
        """Update an existing event's date."""
        if not self.service:
            return False
        
        try:
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            event['start']['dateTime'] = new_date.isoformat()
            event['end']['dateTime'] = (new_date + timedelta(hours=1)).isoformat()
            
            self.service.events().update(calendarId='primary', eventId=event_id, body=event).execute()
            return True
        except HttpError as e:
            print(f"Error updating event: {e}")
            return False
    
    async def delete_future_event(self, event_id: str) -> bool:
        """Delete a future event (never delete past events)."""
        if not self.service:
            return False
        
        try:
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            event_start = datetime.fromisoformat(event['start']['dateTime'].replace('Z', '+00:00'))
            
            # Only delete if in the future
            if event_start > datetime.now(event_start.tzinfo):
                self.service.events().delete(calendarId='primary', eventId=event_id).execute()
                return True
            return False
        except HttpError as e:
            print(f"Error deleting event: {e}")
            return False
    
    async def get_plantmind_events(self, days_ahead: int = 30) -> List[Dict]:
        """Get all PlantMind events from the calendar."""
        if not self.service:
            return []
        
        now = datetime.utcnow()
        time_max = now + timedelta(days=days_ahead)
        
        try:
            events_result = self.service.events().list(
                calendarId='primary',
                timeMin=now.isoformat() + 'Z',
                timeMax=time_max.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime',
                privateExtendedProperty='plantmind_plant_id=*'
            ).execute()
            
            return events_result.get('items', [])
        except HttpError as e:
            print(f"Error fetching events: {e}")
            return []


class AppleCalendarService:
    """
    Apple Calendar (iCloud) integration via CalDAV.
    Requires app-specific password from Apple ID settings.
    """
    
    CALDAV_URL = "https://caldav.icloud.com"
    
    def __init__(self):
        """Initialize Apple Calendar service."""
        self.client: Optional[caldav.DAVClient] = None
        self.calendar: Optional[caldav.Calendar] = None
        self.connected = False
        self.apple_id = None
    
    def connect(self, apple_id: str, app_password: str, calendar_name: str = "Planty") -> bool:
        """
        Connect to Apple Calendar via CalDAV.
        
        Args:
            apple_id: Apple ID email
            app_password: App-specific password (not regular password)
            calendar_name: Name of calendar to use/create
        """
        try:
            # iCloud CalDAV requires specific URL format
            self.client = caldav.DAVClient(
                url=self.CALDAV_URL,
                username=apple_id,
                password=app_password
            )
            
            principal = self.client.principal()
            calendars = principal.calendars()
            
            # Find Planty calendar or use default
            for cal in calendars:
                if hasattr(cal, 'name') and cal.name == calendar_name:
                    self.calendar = cal
                    self.connected = True
                    self.apple_id = apple_id
                    return True
            
            # Use first calendar if Planty not found
            if calendars:
                # Try to create Planty calendar
                try:
                    self.calendar = principal.make_calendar(name=calendar_name)
                except:
                    # If creation fails, use first available calendar
                    self.calendar = calendars[0]
                
                self.connected = True
                self.apple_id = apple_id
                return True
            
            return False
            
        except Exception as e:
            print(f"CalDAV connection error: {e}")
            self.connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if connected to Apple Calendar."""
        return self.connected and self.calendar is not None
    
    async def create_watering_event(
        self,
        plant_id: int,
        plant_name: str,
        scheduled_date: datetime,
        learned_interval: int,
        confidence: float,
        location: str = ""
    ) -> Optional[str]:
        """Create a watering event in Apple Calendar."""
        if not self.is_connected():
            raise ValueError("Not connected. Call connect() first.")
        
        cal = Calendar()
        cal.add('prodid', '-//Planty//Plant Care Scheduler//EN')
        cal.add('version', '2.0')
        
        event = Event()
        uid = f"planty-water-{plant_id}-{int(scheduled_date.timestamp())}@planty.app"
        
        display_name = f"{plant_name} ({location})" if location else plant_name
        
        event.add('uid', uid)
        event.add('dtstamp', datetime.utcnow())
        event.add('dtstart', scheduled_date)
        event.add('dtend', scheduled_date + timedelta(minutes=30))
        event.add('summary', f'💧 Water {display_name}')
        event.add('description', f'Time to water your {plant_name}!\n\nWatering interval: {learned_interval} days\nAI Confidence: {confidence:.0f}%\n\nPowered by Planty 🌱')
        
        # Add reminder 1 hour before
        alarm1 = Alarm()
        alarm1.add('action', 'DISPLAY')
        alarm1.add('trigger', timedelta(hours=-1))
        alarm1.add('description', f'Water {display_name} in 1 hour')
        event.add_component(alarm1)
        
        # Add reminder at event time
        alarm2 = Alarm()
        alarm2.add('action', 'DISPLAY')
        alarm2.add('trigger', timedelta(minutes=0))
        alarm2.add('description', f'Time to water {display_name}!')
        event.add_component(alarm2)
        
        cal.add_component(event)
        
        try:
            self.calendar.save_event(cal.to_ical().decode('utf-8'))
            return uid
        except Exception as e:
            print(f"Error creating Apple Calendar event: {e}")
            return None
    
    async def update_event(self, plant_id: int, plant_name: str, new_date: datetime, 
                          learned_interval: int, confidence: float, location: str = "") -> Optional[str]:
        """Update an existing event by deleting and recreating."""
        # Delete old events for this plant
        await self.delete_events_for_plant(plant_id)
        # Create new event
        return await self.create_watering_event(plant_id, plant_name, new_date, learned_interval, confidence, location)
    
    async def delete_events_for_plant(self, plant_id: int) -> bool:
        """Delete all future events for a plant."""
        if not self.is_connected():
            return False
        
        try:
            events = self.calendar.events()
            for event in events:
                if f"planty-water-{plant_id}-" in str(event.data):
                    # Only delete future events
                    try:
                        event.delete()
                    except:
                        pass
            return True
        except Exception as e:
            print(f"Error deleting events: {e}")
            return False
    
    async def delete_event(self, uid: str) -> bool:
        """Delete an event by UID."""
        if not self.is_connected():
            return False
        
        try:
            events = self.calendar.events()
            for event in events:
                if uid in str(event.data):
                    event.delete()
                    return True
            return False
        except Exception as e:
            print(f"Error deleting event: {e}")
            return False
    
    async def sync_all_plants(self, plants: List[dict]) -> int:
        """Sync all plants to Apple Calendar. Returns number synced."""
        if not self.is_connected():
            return 0
        
        synced = 0
        for plant in plants:
            try:
                # Delete old events
                await self.delete_events_for_plant(plant['id'])
                
                # Create new event
                next_date = datetime.fromisoformat(plant['nextDate'].replace('Z', '+00:00'))
                uid = await self.create_watering_event(
                    plant_id=plant['id'],
                    plant_name=plant['name'],
                    scheduled_date=next_date,
                    learned_interval=plant.get('interval', 7),
                    confidence=plant.get('confidence', 50),
                    location=plant.get('location', '')
                )
                if uid:
                    synced += 1
            except Exception as e:
                print(f"Error syncing plant {plant['name']}: {e}")
        
        return synced


class ICSExportService:
    """
    Export events to .ics file format.
    Works with any calendar app.
    """
    
    @staticmethod
    def export_events(events: List[Dict]) -> bytes:
        """
        Export events to ICS format.
        
        Args:
            events: List of event dicts with keys:
                - id, plant_id, plant_name, type (water/fertilize)
                - date (datetime or ISO string)
                - ai_explanation (optional)
        
        Returns:
            ICS file content as bytes
        """
        cal = ICSCalendar()
        cal.add('prodid', '-//PlantMind//Plant Care Scheduler//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        cal.add('x-wr-calname', 'PlantMind Watering Schedule')
        
        for event_data in events:
            event = ICSEvent()
            
            # Parse date
            event_date = event_data.get('date') or event_data.get('scheduled_date')
            if isinstance(event_date, str):
                event_date = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
            
            # Only include future events
            if event_date < datetime.utcnow().replace(tzinfo=event_date.tzinfo if event_date.tzinfo else None):
                continue
            
            event_id = event_data.get('id', int(datetime.utcnow().timestamp() * 1000))
            event_type = event_data.get('type', 'water')
            plant_name = event_data.get('plant_name', 'Plant')
            
            uid = f"{event_id}@plantmind.app"
            summary = f"{'💧' if event_type == 'water' else '🌱'} {'Water' if event_type == 'water' else 'Fertilize'} {plant_name}"
            description = event_data.get('ai_explanation', 'Scheduled by PlantMind AI')
            
            event.add('uid', uid)
            event.add('dtstamp', datetime.utcnow())
            event.add('dtstart', event_date)
            event.add('dtend', event_date + timedelta(hours=1))
            event.add('summary', summary)
            event.add('description', description)
            
            # Add reminder
            alarm = Alarm()
            alarm.add('action', 'DISPLAY')
            alarm.add('trigger', timedelta(hours=-1))
            alarm.add('description', f'Time to {event_type} {plant_name}!')
            event.add_component(alarm)
            
            cal.add_component(event)
        
        return cal.to_ical()


# Service instances
_google_calendar: Optional[GoogleCalendarService] = None
_apple_calendar: Optional[AppleCalendarService] = None


def get_google_calendar_service() -> GoogleCalendarService:
    """Get or create Google Calendar service."""
    global _google_calendar
    if _google_calendar is None:
        _google_calendar = GoogleCalendarService()
    return _google_calendar


def get_apple_calendar_service() -> AppleCalendarService:
    """Get or create Apple Calendar service."""
    global _apple_calendar
    if _apple_calendar is None:
        _apple_calendar = AppleCalendarService()
    return _apple_calendar
