import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status, HTTPException
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.common import StatusResponse
from app.services.project_service import ProjectService
from app.api.deps import require_auth, require_organizer, get_current_user, UserSession
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectOut])
def list_projects(
    track: Optional[str] = Query(None, description="Filter by track ID or label"),
    hackathon: Optional[str] = Query(None, description="Filter by hackathon ID or slug"),
    featured: Optional[bool] = Query(None, description="Filter only featured projects"),
    search: Optional[str] = Query(None, description="Search keyword in title, summary, or tech"),
    sort: Optional[str] = Query("latest", description="Sort order: 'latest' or 'random' (anti-bias)"),
    judge_id: Optional[str] = Query(None, description="Filter projects assigned to a judge's tracks"),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List public project gallery submissions without requiring auth."""
    return ProjectService.list_projects(
        track=track,
        hackathon=hackathon,
        featured=featured,
        search=search,
        sort=sort,
        judge_id=judge_id,
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
def like_project(
    project_id_or_slug: str,
    request: Request,
    user: UserSession = Depends(require_auth),
):
    """Increment like counter — authenticated users only, 1 like per project per user."""
    proj = ProjectService.get_project(project_id_or_slug)
    if not proj:
        raise NotFoundException(f"Project '{project_id_or_slug}' not found")

    user_vote_key = f"user:{user.user_id}:{proj['id']}"
    if ProjectService.has_liked(proj["id"], user_vote_key):
        raise HTTPException(status_code=429, detail="You have already upvoted this project.")

    new_likes = ProjectService.like_project(proj["id"], fingerprint=user_vote_key)
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
    user: UserSession = Depends(require_auth),
):
    """
    Submit a project. Requires authentication as a participant.
    Strictly verifies that event submissions_close has not passed.
    """
    if user.role not in ("participant", "organizer"):
        raise ForbiddenException("Only participants can submit projects.")
    submitter_team = user.user_id
    return ProjectService.create_project(payload, submitter_team=submitter_team, user_id=user.user_id)

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: UserSession = Depends(require_auth),
):
    """Update project details. Only the submitting team or an organizer can update."""
    proj = ProjectService.get_project(project_id)
    if not proj:
        raise NotFoundException(f"Project '{project_id}' not found")
    # Ownership check: only the owner or organizer may edit
    if proj.get("team") != user.user_id and proj.get("user_id") != user.user_id and user.role != "organizer":
        raise ForbiddenException("You can only edit your own project submission.")
    return ProjectService.update_project(proj["id"], payload)

@router.delete("/{project_id}", response_model=StatusResponse)
def delete_project(project_id: str, user: UserSession = Depends(require_organizer)):
    """Delete a project (restricted to organizers)."""
    ok = ProjectService.delete_project(project_id)
    if not ok:
        raise NotFoundException(f"Project '{project_id}' not found")
    return StatusResponse(status="success", message=f"Project '{project_id}' deleted")
