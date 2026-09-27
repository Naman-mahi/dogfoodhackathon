from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.score import ScoreCreate, ScoreOut
from app.services.judging_service import JudgingService
from app.api.deps import require_judge, UserSession
from app.core.exceptions import PeerIsolationViolationException, ForbiddenException

router = APIRouter(prefix="/judge/scores", tags=["Judging & Scores"])

@router.get("", response_model=List[ScoreOut])
def get_judge_scores(
    judge: Optional[str] = Query(None, description="Target judge ID to inspect"),
    user: UserSession = Depends(require_judge),
):
    """
    Returns scores for the authenticated judge.
    Enforces zero-trust peer isolation:
    Attempts to read another judge's scores return HTTP 403.
    """
    is_org = user.role == "organizer"
    return JudgingService.get_scores_for_judge(
        authenticated_judge_id=user.user_id,
        requested_judge_id=judge,
        is_organizer=is_org,
    )

@router.post("", response_model=ScoreOut, status_code=status.HTTP_201_CREATED)
def submit_score(payload: ScoreCreate, user: UserSession = Depends(require_judge)):
    """Submit double-blind evaluation rating and rubric scores."""
    return JudgingService.create_score(payload, judge_id=user.user_id)
