from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.event import EventCreate, EventUpdate, EventOut, TrackCreate, TrackOut
from app.schemas.project import ProjectOut
from app.services.event_service import EventService
from app.services.project_service import ProjectService
from app.api.deps import require_organizer, UserSession
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/events", tags=["Events & Hackathons"])

@router.get("", response_model=List[EventOut])
def list_events(
    category: Optional[str] = Query(None, description="Filter by category (ai, web3, devtools, opensource, climate)"),
    status: Optional[str] = Query(None, description="Filter by status (live, upcoming, completed)"),
    search: Optional[str] = Query(None, description="Search by title or tagline"),
):
    """List all hackathons and events with rich metadata and filters."""
    return EventService.list_events(category=category, status=status, search=search)

@router.get("/{event_id_or_slug}", response_model=EventOut)
def get_event(event_id_or_slug: str):
    """Get single event or hackathon by ID or slug with associated tracks, timeline, and criteria."""
    evt = EventService.get_event(event_id_or_slug)
    if not evt:
        raise NotFoundException(f"Event with id/slug '{event_id_or_slug}' not found")
    return evt

@router.get("/{event_id_or_slug}/projects", response_model=List[ProjectOut])
def list_event_projects(event_id_or_slug: str):
    """List all projects submitted to a specific event or hackathon."""
    evt = EventService.get_event(event_id_or_slug)
    if not evt:
        raise NotFoundException(f"Event with id/slug '{event_id_or_slug}' not found")
    return ProjectService.list_projects(hackathon=evt["id"])

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, user: UserSession = Depends(require_organizer)):
    """Create a new event (restricted to organizers)."""
    return EventService.create_event(payload)

@router.put("/{event_id_or_slug}", response_model=EventOut)
def update_event(event_id_or_slug: str, payload: EventUpdate, user: UserSession = Depends(require_organizer)):
    """Update event metadata or deadline (restricted to organizers)."""
    evt = EventService.get_event(event_id_or_slug)
    if not evt:
        raise NotFoundException(f"Event '{event_id_or_slug}' not found")
    return EventService.update_event(evt["id"], payload)

@router.post("/{event_id_or_slug}/tracks", response_model=TrackOut, status_code=status.HTTP_201_CREATED)
def add_track_to_event(event_id_or_slug: str, payload: TrackCreate, user: UserSession = Depends(require_organizer)):
    """Add a competition track to the event."""
    evt = EventService.get_event(event_id_or_slug)
    if not evt:
        raise NotFoundException(f"Event '{event_id_or_slug}' not found")
    return EventService.add_track(evt["id"], payload)
