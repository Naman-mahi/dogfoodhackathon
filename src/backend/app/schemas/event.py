from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class TrackCreate(BaseModel):
    id: str
    name: str
    prize: Optional[str] = None
    description: Optional[str] = None

class TrackOut(BaseModel):
    id: str
    name: str
    prize: Optional[str] = None
    description: Optional[str] = None

class TimelineMilestone(BaseModel):
    id: str
    phase: str
    timestamp: str
    title: str
    description: str
    status: str = "upcoming"
    statusLabel: Optional[str] = None

class PrizeTier(BaseModel):
    place: str
    amount: str
    title: str
    description: str

class RuleItem(BaseModel):
    title: str
    description: str

class FaqItem(BaseModel):
    id: str
    question: str
    answer: str

class OverviewHighlight(BaseModel):
    title: str
    description: str

class JudgingCriterion(BaseModel):
    title: str
    weight: str
    description: str

class SponsorPartner(BaseModel):
    name: str
    tier: str

class EventBase(BaseModel):
    name: str
    title: Optional[str] = None
    slug: Optional[str] = None
    tagline: Optional[str] = None
    status: str = "live"
    format: str = "online"
    category: str = "devtools"
    category_label: Optional[str] = None
    location: str = "Global · Online"
    prize_amount: int = 0
    prize_display: Optional[str] = None
    participant_count: int = 0
    submission_count: int = 0
    deadline_display: Optional[str] = None
    gradient: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    submissions_close: datetime
    timezone: str = "UTC"
    is_free: bool = True
    entry_fee_display: str = "Free"
    host: Optional[str] = None
    level: str = "All Experience Levels"
    team_size_limit: str = "1-4 Members"
    eligibility_summary: Optional[str] = None
    community_links: Optional[Dict[str, Any]] = None
    judges: Optional[List[Dict[str, Any]]] = None
    judging_criteria: Optional[List[Dict[str, Any]]] = None
    sponsors: Optional[List[Dict[str, Any]]] = None
    overview: Optional[Dict[str, Any]] = None
    rules: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    faqs: Optional[List[Dict[str, Any]]] = None

class EventCreate(EventBase):
    id: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    tagline: Optional[str] = None
    status: Optional[str] = None
    format: Optional[str] = None
    category: Optional[str] = None
    category_label: Optional[str] = None
    location: Optional[str] = None
    prize_amount: Optional[int] = None
    prize_display: Optional[str] = None
    deadline_display: Optional[str] = None
    gradient: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    submissions_close: Optional[datetime] = None
    timezone: Optional[str] = None
    is_free: Optional[bool] = None
    entry_fee_display: Optional[str] = None
    host: Optional[str] = None
    level: Optional[str] = None
    team_size_limit: Optional[str] = None
    eligibility_summary: Optional[str] = None
    community_links: Optional[Dict[str, Any]] = None
    judges: Optional[List[Dict[str, Any]]] = None
    judging_criteria: Optional[List[Dict[str, Any]]] = None
    sponsors: Optional[List[Dict[str, Any]]] = None
    overview: Optional[Dict[str, Any]] = None
    rules: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    faqs: Optional[List[Dict[str, Any]]] = None

class EventOut(EventBase):
    id: str
    tracks: Optional[List[TrackOut]] = []
    created_at: Optional[datetime] = None
