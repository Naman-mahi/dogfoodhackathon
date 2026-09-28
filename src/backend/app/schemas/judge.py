from typing import Optional, List
from pydantic import BaseModel

class JudgeCreate(BaseModel):
    id: str
    name: str
    email: str
    tracks: Optional[List[str]] = []
    password: Optional[str] = None

class JudgeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    tracks: Optional[List[str]] = None

class JudgeOut(BaseModel):
    id: str
    name: str
    email: str
    tracks: List[str]
    initial_password: Optional[str] = None
