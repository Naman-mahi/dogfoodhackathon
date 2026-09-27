from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.rubric import RubricCreate, RubricUpdate, RubricOut
from app.services.judging_service import JudgingService
from app.api.deps import require_organizer, UserSession

router = APIRouter(prefix="/rubrics", tags=["Rubrics"])

@router.get("", response_model=List[RubricOut])
def list_rubrics(event_id: str = Query("evt_01", description="Event ID")):
    """List weighted scoring criteria for an event."""
    return JudgingService.list_rubrics(event_id=event_id)

@router.post("", response_model=RubricOut, status_code=status.HTTP_201_CREATED)
def create_rubric(payload: RubricCreate, user: UserSession = Depends(require_organizer)):
    """Define a new evaluation rubric with weight (restricted to organizers)."""
    return JudgingService.create_rubric(payload)
