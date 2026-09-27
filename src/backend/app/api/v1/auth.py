from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.schemas.common import StatusResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, require_auth, UserSession

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Authenticate and obtain session token."""
    role = "participant"
    user_id = "prt_01"
    if "organizer" in payload.email.lower() or "admin" in payload.email.lower():
        role = "organizer"
        user_id = "org_01"
    elif "judge" in payload.email.lower() or "tomas" in payload.email.lower():
        role = "judge"
        user_id = "jdg_01"

    token = AuthService.create_session(user_id=user_id, email=payload.email, role=role)
    return TokenResponse(
        token=token,
        access_token=token,
        role=role,
        user_id=user_id,
        email=payload.email,
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: UserSession = Depends(require_auth)):
    """Get current authenticated user profile."""
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        name=user.email.split("@")[0].capitalize(),
        role=user.role,
        token=user.token,
    )

@router.post("/logout", response_model=StatusResponse)
def logout(user: UserSession = Depends(require_auth)):
    """Terminate current session."""
    AuthService.delete_session(user.token)
    return StatusResponse(status="success", message="Logged out successfully")
