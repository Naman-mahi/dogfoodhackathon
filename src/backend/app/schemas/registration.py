from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class RegistrationCreate(BaseModel):
    team_id: Optional[str] = None

class RegistrationOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    team_id: Optional[str] = None
    status: str = "confirmed"
    created_at: Optional[datetime] = None

class RegistrationStatusOut(BaseModel):
    registered: bool
    event_id: str
    user_id: Optional[str] = None
    registration: Optional[RegistrationOut] = None
    participant_count: int
    message: Optional[str] = None
