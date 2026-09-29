from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.score import ScoreCreate, ScoreOut
from app.services.judging_service import JudgingService
from app.api.deps import require_auth, require_judge, UserSession
from app.core.exceptions import PeerIsolationViolationException, ForbiddenException

router = APIRouter(prefix="/judge/scores", tags=["Judging & Scores"])

@router.get("/progress")
def get_evaluation_progress(user: UserSession = Depends(require_auth)):
    """
    Returns real-time dynamic evaluation progress for all judges or the caller's queue.
    Organizers and Admins can see full progress for all evaluators;
    Judges only see their own queue and evaluated progress (preserving peer isolation).
    """
    if user.role not in ("judge", "organizer", "admin"):
        raise ForbiddenException("Forbidden: Evaluator, Organizer, or Admin credentials required")
    is_org = user.role in ("organizer", "admin")
    return JudgingService.get_evaluation_progress(
        authenticated_user_id=user.user_id,
        is_organizer=is_org,
    )

@router.get("", response_model=List[ScoreOut])
def get_judge_scores(
    judge: Optional[str] = Query(None, description="Target judge ID to inspect"),
    user: UserSession = Depends(require_auth),
):
    """
    Returns scores for the authenticated judge or (for organizers) any specified judge.
    Enforces zero-trust peer isolation: judges cannot see each other's scores.
    """
    if user.role not in ("judge", "organizer"):
        raise ForbiddenException("Forbidden: Evaluator or Organizer credentials required")
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

