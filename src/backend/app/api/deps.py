from typing import Optional
from fastapi import Request, Depends
from app.services.auth_service import AuthService
from app.core.permissions import Role, is_organizer, is_judge, is_participant
from app.core.exceptions import UnauthorizedException, ForbiddenException

class UserSession:
    def __init__(self, token: str, role: str, user_id: str, email: str):
        self.token = token
        self.role = role
        self.user_id = user_id
        self.email = email

def get_current_user(request: Request) -> Optional[UserSession]:
    token = None
    # 1. Check Cookie
    cookie_str = request.headers.get("Cookie", "")
    for part in cookie_str.split(";"):
        part = part.strip()
        if part.startswith("session="):
            token = part.split("=", 1)[1]
            break

    # 2. Check Authorization Header (Bearer or token)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
        elif auth_header.startswith("Cookie: session="):
            token = auth_header.split("session=", 1)[1]

    if not token:
        return None

    row = AuthService.get_session_user(token)
    if row:
        return UserSession(
            token=row.token,
            role=row.role,
            user_id=row.user_id,
            email=row.user_email,
        )
    return None

def require_auth(user: Optional[UserSession] = Depends(get_current_user)) -> UserSession:
    if not user:
        raise UnauthorizedException("Authentication session or bearer token required")
    return user

def require_organizer(user: UserSession = Depends(require_auth)) -> UserSession:
    if not is_organizer(user.role):
        raise ForbiddenException("Forbidden: Organizer role required")
    return user

def require_judge(user: UserSession = Depends(require_auth)) -> UserSession:
    if not is_judge(user.role):
        raise ForbiddenException("Forbidden: Evaluator / Judge role required")
    return user

def require_participant(user: UserSession = Depends(require_auth)) -> UserSession:
    if not is_participant(user.role):
        raise ForbiddenException("Forbidden: Participant role required")
    return user
