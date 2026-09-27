from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = "participant"

class RegisterRequest(BaseModel):
    email: str
    password: Optional[str] = None
    name: str
    role: Optional[str] = "participant"
    github_handle: Optional[str] = None
    avatar_url: Optional[str] = None

class SocialLoginRequest(BaseModel):
    provider: str  # google, github, linkedin
    provider_id: Optional[str] = None
    email: str
    name: str
    avatar_url: Optional[str] = None
    role: Optional[str] = "participant"

class TokenResponse(BaseModel):
    token: str
    access_token: Optional[str] = None
    role: str
    user_id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    email: str
    role: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    token: str
