from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = "participant"

class TokenResponse(BaseModel):
    token: str
    access_token: Optional[str] = None
    role: str
    user_id: str
    email: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    name: Optional[str] = None
    token: str
