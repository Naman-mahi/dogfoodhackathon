from typing import Optional, List
from pydantic import BaseModel

class JudgeCreate(BaseModel):
    id: str
    name: str
    email: str
    tracks: Optional[List[str]] = []

class JudgeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    tracks: Optional[List[str]] = None

class JudgeOut(BaseModel):
    id: str
    name: str
    email: str
    tracks: List[str]
