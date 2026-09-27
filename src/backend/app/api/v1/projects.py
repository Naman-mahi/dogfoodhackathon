from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.common import StatusResponse
from app.services.project_service import ProjectService
from app.api.deps import require_auth, require_organizer, get_current_user, UserSession
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectOut])
def list_projects(
    track: Optional[str] = Query(None, description="Filter by track ID or label"),
    hackathon: Optional[str] = Query(None, description="Filter by hackathon ID or slug"),
    featured: Optional[bool] = Query(None, description="Filter only featured projects"),
    search: Optional[str] = Query(None, description="Search keyword in title, summary, or tech"),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List public project gallery submissions without requiring auth."""
    return ProjectService.list_projects(
        track=track,
        hackathon=hackathon,
        featured=featured,
        search=search,
        limit=limit,
        offset=offset,
    )

@router.get("/{project_id_or_slug}", response_model=ProjectOut)
def get_project(project_id_or_slug: str):
    """Retrieve full project architecture and submission details by ID or slug."""
    proj = ProjectService.get_project(project_id_or_slug)
    if not proj:
        raise NotFoundException(f"Project '{project_id_or_slug}' not found")
    return proj

@router.post("/{project_id_or_slug}/like")
def like_project(project_id_or_slug: str):
    """Increment like counter on a project."""
    proj = ProjectService.get_project(project_id_or_slug)
    if not proj:
        raise NotFoundException(f"Project '{project_id_or_slug}' not found")
    new_likes = ProjectService.like_project(proj["id"])
    return {"project_id": proj["id"], "likes_count": new_likes}

@router.get("/user/my-submission", response_model=Optional[ProjectOut])
def get_my_submission(
    hackathon: str = Query(..., description="Hackathon ID or slug"),
    user: UserSession = Depends(require_auth),
):
    """Retrieve the current logged-in participant's submission for a hackathon."""
    return ProjectService.get_user_event_submission(hackathon, user.user_id)

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
@router.post("/new", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def submit_project(
    payload: ProjectCreate,
    user: Optional[UserSession] = Depends(get_current_user),
):
    """
    Submit a project.
    Strictly verifies that event submissions_close has not passed.
    If the event is closed, refuses submission with HTTP 4xx.
    """
    submitter_team = user.user_id if user else "tm_anonymous"
    user_id = user.user_id if user else None
    return ProjectService.create_project(payload, submitter_team=submitter_team, user_id=user_id)

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: UserSession = Depends(require_auth),
):
    """Update project details before deadline."""
    proj = ProjectService.get_project(project_id)
    if not proj:
        raise NotFoundException(f"Project '{project_id}' not found")
    return ProjectService.update_project(proj["id"], payload)

@router.delete("/{project_id}", response_model=StatusResponse)
def delete_project(project_id: str, user: UserSession = Depends(require_organizer)):
    """Delete a project (restricted to organizers)."""
    ok = ProjectService.delete_project(project_id)
    if not ok:
        raise NotFoundException(f"Project '{project_id}' not found")
    return StatusResponse(status="success", message=f"Project '{project_id}' deleted")
