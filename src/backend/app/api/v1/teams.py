from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut
from app.schemas.common import StatusResponse
from app.services.team_service import TeamService
from app.api.deps import require_auth, require_organizer, UserSession
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamOut])
def list_teams():
    """List all builder squads and teams."""
    return TeamService.list_teams()

@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: str):
    """Get single team details."""
    team = TeamService.get_team(team_id)
    if not team:
        raise NotFoundException(f"Team '{team_id}' not found")
    return team

@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, user: UserSession = Depends(require_auth)):
    """Form a new team."""
    return TeamService.create_team(payload)

@router.put("/{team_id}", response_model=TeamOut)
def update_team(team_id: str, payload: TeamUpdate, user: UserSession = Depends(require_auth)):
    """Update team information."""
    team = TeamService.get_team(team_id)
    if not team:
        raise NotFoundException(f"Team '{team_id}' not found")
    return TeamService.update_team(team_id, payload)

@router.delete("/{team_id}", response_model=StatusResponse)
def delete_team(team_id: str, user: UserSession = Depends(require_organizer)):
    """Remove team (restricted to organizers)."""
    ok = TeamService.delete_team(team_id)
    if not ok:
        raise NotFoundException(f"Team '{team_id}' not found")
    return StatusResponse(status="success", message=f"Team '{team_id}' removed")
