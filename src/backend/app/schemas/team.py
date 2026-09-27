from typing import List, Optional
from pydantic import BaseModel

class TeamBase(BaseModel):
    name: str
    members: List[str] = []

class TeamCreate(TeamBase):
    id: str

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    members: Optional[List[str]] = None

class TeamOut(TeamBase):
    id: str
