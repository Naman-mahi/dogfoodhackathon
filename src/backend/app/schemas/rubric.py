from typing import Optional
from pydantic import BaseModel

class RubricBase(BaseModel):
    criterion_name: str
    weight: float = 1.0
    max_score: int = 5
    description: Optional[str] = None

class RubricCreate(RubricBase):
    event_id: Optional[str] = "evt_01"

class RubricUpdate(BaseModel):
    criterion_name: Optional[str] = None
    weight: Optional[float] = None
    max_score: Optional[int] = None
    description: Optional[str] = None

class RubricOut(RubricBase):
    id: int
    event_id: Optional[str]
