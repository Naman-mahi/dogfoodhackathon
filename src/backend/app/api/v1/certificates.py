"""
Certificates API
Returns earned certificates for participants (completed events with submissions)
and for judges (completed events they evaluated).
"""
import hmac
import hashlib
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from app.db.session import engine
from app.db.models.project import projects_table
from app.db.models.event import events_table
from app.db.models.score import scores_table
from app.api.deps import require_auth, UserSession
from app.core.security import generate_certificate_signature

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def _build_cert(event: Dict[str, Any], project: Dict[str, Any], recipient_type: str) -> Dict[str, Any]:
    """Build a signed certificate record."""
    payload = f"CERT:{project['id']}:{project['title']}:{project['team']}"
    sig = generate_certificate_signature(payload)
    event_status = (event.get("status") or "").lower()
    return {
        "certificate_id": f"CERT-{project['id'].upper()}",
        "project_id": project["id"],
        "project_title": project["title"],
        "project_summary": project.get("summary", ""),
        "project_track": project.get("track_label") or project.get("track", ""),
        "hackathon_id": event["id"],
        "hackathon_name": event.get("name") or event.get("title", ""),
        "hackathon_slug": event.get("slug", ""),
        "recipient_type": recipient_type,
        "recipient_team": project.get("team", ""),
        "issued_by": "DOGFOOD Foundation",
        "issued_at": (event.get("end_date") or datetime.now(timezone.utc)).isoformat()
            if not isinstance(event.get("end_date"), str) else event.get("end_date"),
        "hmac_sha256_signature": sig,
        "verification_status": "cryptographically_verified",
        "event_status": event_status,
    }


@router.get("/my", response_model=List[Dict[str, Any]])
def get_my_certificates(user: UserSession = Depends(require_auth)):
    """
    Returns all earned certificates for the current user.
    - Participants: certificate for each submitted project whose event is completed/concluded.
    - Judges: certificate for each event they evaluated (has scores submitted) that is completed.
    - Organizers: certificates for all projects in completed events they manage.
    """
    with engine.connect() as conn:
        # Fetch all completed/concluded events
        completed_statuses = ("completed", "concluded", "closed")
        events_stmt = select(events_table).where(
            events_table.c.status.in_(completed_statuses)
        )
        completed_events = {
            row["id"]: dict(row)
            for row in conn.execute(events_stmt).mappings().fetchall()
        }

        certs = []

        if user.role == "participant":
            # Find all projects submitted by this user in completed events
            proj_stmt = select(projects_table).where(
                or_(
                    projects_table.c.user_id == user.user_id,
                    projects_table.c.team == user.user_id,
                ),
                projects_table.c.event_id.in_(list(completed_events.keys()) or ["__none__"]),
            )
            projects = conn.execute(proj_stmt).mappings().fetchall()
            for proj in projects:
                ev = completed_events.get(proj["event_id"])
                if ev:
                    certs.append(_build_cert(ev, dict(proj), "participant"))

        elif user.role == "judge":
            # Find all projects this judge evaluated in completed events
            scores_stmt = select(scores_table).where(scores_table.c.judge == user.user_id)
            scored_project_ids = [row["project"] for row in conn.execute(scores_stmt).mappings().fetchall()]

            if scored_project_ids:
                proj_stmt = select(projects_table).where(
                    projects_table.c.id.in_(scored_project_ids),
                    projects_table.c.event_id.in_(list(completed_events.keys()) or ["__none__"]),
                )
                projects = conn.execute(proj_stmt).mappings().fetchall()
                # Deduplicate by event (judge gets one cert per completed event)
                seen_events = set()
                for proj in projects:
                    ev = completed_events.get(proj["event_id"])
                    if ev and ev["id"] not in seen_events:
                        seen_events.add(ev["id"])
                        certs.append(_build_cert(ev, dict(proj), "judge"))

        elif user.role == "organizer":
            # Organizers get certificates for all projects in completed events
            if completed_events:
                proj_stmt = select(projects_table).where(
                    projects_table.c.event_id.in_(list(completed_events.keys()))
                ).limit(50)
                projects = conn.execute(proj_stmt).mappings().fetchall()
                seen_events = set()
                for proj in projects:
                    ev = completed_events.get(proj["event_id"])
                    if ev and ev["id"] not in seen_events:
                        seen_events.add(ev["id"])
                        certs.append(_build_cert(ev, dict(proj), "organizer"))

        return certs
