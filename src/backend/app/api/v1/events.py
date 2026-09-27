from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.event import EventCreate, EventUpdate, EventOut, TrackCreate, TrackOut
from app.schemas.project import ProjectOut
from app.schemas.registration import RegistrationCreate, RegistrationOut, RegistrationStatusOut
from app.services.event_service import EventService
from app.services.project_service import ProjectService
from app.services.email_service import EmailService
from app.api.deps import require_organizer, require_auth, get_current_user, UserSession
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/events", tags=["Events & Hackathons"])

class TeamInviteRequest(BaseModel):
    email: str
    team_name: Optional[str] = "My Team"
    invite_url: Optional[str] = None

@router.get("/registrations/my", response_model=List[EventOut])
def get_my_registered_events(user: UserSession = Depends(require_auth)):
    """Retrieve all hackathons the currently authenticated user is registered for."""
    return EventService.list_user_registrations(user.user_id)

@router.get("/emails/logs")
def get_email_logs(user: UserSession = Depends(require_organizer)):
    """Retrieve audit record of dispatched emails (organizers only)."""
    return EmailService.list_email_logs()

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

@router.post("/{event_id_or_slug}/register", response_model=RegistrationStatusOut)
def register_for_event(
    event_id_or_slug: str,
    payload: Optional[RegistrationCreate] = None,
    user: UserSession = Depends(require_auth),
):
    """Register the current authenticated user for a hackathon. Only participants can register."""
    if user.role != "participant":
        raise ForbiddenException(
            f"Only participants can register for hackathons. You are signed in as '{user.role}'. "
            "Organizers and judges cannot participate as competitors."
        )

    team_id = payload.team_id if payload else None
    return EventService.register_user(
        event_id_or_slug=event_id_or_slug,
        user_id=user.user_id,
        user_role=user.role,
        email=user.email,
        team_id=team_id,
    )

@router.delete("/{event_id_or_slug}/register", response_model=RegistrationStatusOut)
def unregister_from_event(
    event_id_or_slug: str,
    user: UserSession = Depends(require_auth),
):
    """Unregister the current user from a hackathon."""
    return EventService.unregister_user(event_id_or_slug=event_id_or_slug, user_id=user.user_id)

@router.get("/{event_id_or_slug}/registration-status", response_model=RegistrationStatusOut)
def get_registration_status(
    event_id_or_slug: str,
    user: Optional[UserSession] = Depends(get_current_user),
):
    """Check if the user is registered for the hackathon and get updated participant count."""
    user_id = user.user_id if user else None
    return EventService.get_registration_status(event_id_or_slug=event_id_or_slug, user_id=user_id)

@router.get("/{event_id_or_slug}/registrations", response_model=List[RegistrationOut])
def list_event_registrations(
    event_id_or_slug: str,
    user: UserSession = Depends(require_organizer),
):
    """List all registered participants for an event (organizers only)."""
    return EventService.list_event_registrations(event_id_or_slug)

@router.delete("/{event_id_or_slug}/registrations/{participant_user_id}", response_model=RegistrationStatusOut)
def remove_participant_registration(
    event_id_or_slug: str,
    participant_user_id: str,
    user: UserSession = Depends(require_organizer),
):
    """Remove a participant's registration from an event (organizers only)."""
    return EventService.unregister_user(event_id_or_slug=event_id_or_slug, user_id=participant_user_id)

@router.get("/{event_id_or_slug}/my-submission", response_model=Optional[ProjectOut])
def get_my_event_submission(
    event_id_or_slug: str,
    user: UserSession = Depends(require_auth),
):
    """Retrieve the logged in participant's project submitted for this hackathon."""
    return ProjectService.get_user_event_submission(event_id_or_slug, user.user_id)

@router.post("/{event_id_or_slug}/invite-teammate")
def invite_teammate(
    event_id_or_slug: str,
    payload: TeamInviteRequest,
    user: UserSession = Depends(require_auth),
):
    """Send an automated team invitation email to a teammate."""
    evt = EventService.get_event(event_id_or_slug)
    if not evt:
        raise NotFoundException(f"Event '{event_id_or_slug}' not found")

    invite_url = payload.invite_url or f"http://localhost:8080/events?slug={evt['slug']}&tab=teams"
    inviter_display = user.email.split("@")[0].capitalize()

    res = EmailService.send_team_invite_email(
        invitee_email=payload.email,
        inviter_name=inviter_display,
        team_name=payload.team_name or "Builders Squad",
        event_data=evt,
        invite_url=invite_url,
    )
    return {
        "success": True,
        "message": f"Team invitation email dispatched to {payload.email}",
        "email_log": res,
    }


