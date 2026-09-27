from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.judge import JudgeCreate, JudgeUpdate, JudgeOut
from app.schemas.common import StatusResponse
from app.services.judging_service import JudgingService
from app.api.deps import require_organizer, UserSession
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/judges", tags=["Judges"])

@router.get("", response_model=List[JudgeOut])
def list_judges():
    """List all invited judges and their assigned evaluation tracks."""
    return JudgingService.list_judges()

@router.get("/{judge_id}", response_model=JudgeOut)
def get_judge(judge_id: str):
    """Retrieve details for a single judge."""
    jdg = JudgingService.get_judge(judge_id)
    if not jdg:
        raise NotFoundException(f"Judge '{judge_id}' not found")
    return jdg

@router.post("", response_model=JudgeOut, status_code=status.HTTP_201_CREATED)
def create_judge(payload: JudgeCreate, user: UserSession = Depends(require_organizer)):
    """Invite and register an evaluator (restricted to organizers)."""
    return JudgingService.create_judge(payload)

@router.put("/{judge_id}", response_model=JudgeOut)
def update_judge(judge_id: str, payload: JudgeUpdate, user: UserSession = Depends(require_organizer)):
    """Update judge track assignments."""
    jdg = JudgingService.get_judge(judge_id)
    if not jdg:
        raise NotFoundException(f"Judge '{judge_id}' not found")
    return JudgingService.update_judge(judge_id, payload)

@router.delete("/{judge_id}", response_model=StatusResponse)
def delete_judge(judge_id: str, user: UserSession = Depends(require_organizer)):
    """Remove a judge (restricted to organizers)."""
    ok = JudgingService.delete_judge(judge_id)
    if not ok:
        raise NotFoundException(f"Judge '{judge_id}' not found")
    return StatusResponse(status="success", message=f"Judge '{judge_id}' removed")
