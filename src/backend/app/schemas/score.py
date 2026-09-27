from typing import Dict, Any, Optional, List
from pydantic import BaseModel

class ScoreBase(BaseModel):
    judge: str
    project: str
    criteria: Dict[str, Any]
    comment: Optional[str] = None

class ScoreCreate(ScoreBase):
    pass

class ScoreUpdate(BaseModel):
    criteria: Optional[Dict[str, Any]] = None
    comment: Optional[str] = None

class ScoreOut(ScoreBase):
    id: Optional[int] = None

class CalibratedRankOut(BaseModel):
    project_id: str
    review_count: int
    raw_mean: float
    calibrated_score: float
    shrinkage_delta: float

class CalibrationResultOut(BaseModel):
    global_prior_mean: float
    shrinkage_k: float
    rankings: List[CalibratedRankOut]
