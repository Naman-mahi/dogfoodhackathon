from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class UserBase(BaseModel):
    email: str
    name: str
    role: str = "participant"
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_handle: Optional[str] = None

class UserCreate(UserBase):
    id: Optional[str] = None
    password: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    github_handle: Optional[str] = None

class UserOut(UserBase):
    id: str
    created_at: Optional[datetime] = None

class UserProfile(UserOut):
    projects: List[Dict[str, Any]] = []
    reviews_count: int = 0
    stats: Dict[str, Any] = {}
