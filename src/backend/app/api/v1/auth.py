from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    SocialLoginRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import StatusResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, require_auth, UserSession

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response):
    """Authenticate and obtain session token with cookie."""
    user = AuthService.get_user_by_email(payload.email)
    if user:
        user_id = user["id"]
        role = user["role"]
        name = user["name"]
        avatar_url = user.get("avatar_url")
    else:
        # Fallback for predefined test personas or dynamic email identification
        role = payload.role or "participant"
        user_id = "prt_01"
        name = payload.email.split("@")[0].capitalize()
        avatar_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={payload.email}"
        if "organizer" in payload.email.lower() or "admin" in payload.email.lower():
            role = "organizer"
            user_id = "org_01"
            name = "DOGFOOD Foundation Admin"
        elif "tomas" in payload.email.lower() or "jdg_01" in payload.email.lower():
            role = "judge"
            user_id = "jdg_01"
            name = "Tomas Varga"
        elif "wei" in payload.email.lower() or "jdg_02" in payload.email.lower():
            role = "judge"
            user_id = "jdg_02"
            name = "Wei Lindqvist"
        elif "elena" in payload.email.lower():
            role = "judge"
            user_id = "jdg_03"
            name = "Elena Rostova"
        elif "ada" in payload.email.lower():
            role = "participant"
            user_id = "prt_01"
            name = "Ada Lovelace"

    token = AuthService.create_session(user_id=user_id, email=payload.email, role=role)
    response.set_cookie(
        key="session",
        value=token,
        path="/",
        max_age=86400,
        samesite="lax",
    )
    return TokenResponse(
        token=token,
        access_token=token,
        role=role,
        user_id=user_id,
        email=payload.email,
        name=name,
        avatar_url=avatar_url,
    )

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, response: Response):
    """Register a new user account with role and obtain session token."""
    existing = AuthService.get_user_by_email(payload.email)
    if existing:
        user_id = existing["id"]
        role = existing["role"]
        name = existing["name"]
        avatar_url = existing.get("avatar_url")
    else:
        created = AuthService.create_user(
            name=payload.name,
            email=payload.email,
            role=payload.role or "participant",
            github_handle=payload.github_handle,
            avatar_url=payload.avatar_url,
        )
        user_id = created["id"]
        role = created["role"]
        name = created["name"]
        avatar_url = created.get("avatar_url")

    token = AuthService.create_session(user_id=user_id, email=payload.email, role=role)
    response.set_cookie(
        key="session",
        value=token,
        path="/",
        max_age=86400,
        samesite="lax",
    )
    return TokenResponse(
        token=token,
        access_token=token,
        role=role,
        user_id=user_id,
        email=payload.email,
        name=name,
        avatar_url=avatar_url,
    )

@router.post("/social", response_model=TokenResponse)
def social_login(payload: SocialLoginRequest, response: Response):
    """Authenticate or register via OAuth provider (Google, GitHub, LinkedIn)."""
    user = AuthService.get_user_by_email(payload.email)
    if not user:
        github_handle = payload.name.lower().replace(" ", "-") if payload.provider == "github" else None
        user = AuthService.create_user(
            name=payload.name,
            email=payload.email,
            role=payload.role or "participant",
            avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={payload.email}",
            github_handle=github_handle,
            bio=f"Authenticated via {payload.provider.capitalize()}.",
        )

    user_id = user["id"]
    role = user["role"]
    name = user["name"]
    avatar_url = user.get("avatar_url")

    token = AuthService.create_session(user_id=user_id, email=payload.email, role=role)
    response.set_cookie(
        key="session",
        value=token,
        path="/",
        max_age=86400,
        samesite="lax",
    )
    return TokenResponse(
        token=token,
        access_token=token,
        role=role,
        user_id=user_id,
        email=payload.email,
        name=name,
        avatar_url=avatar_url,
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: UserSession = Depends(require_auth)):
    """Get current authenticated user profile."""
    db_user = AuthService.get_user_by_id(user.user_id) or AuthService.get_user_by_email(user.email)
    name = db_user["name"] if db_user else user.email.split("@")[0].capitalize()
    avatar_url = db_user.get("avatar_url") if db_user else f"https://api.dicebear.com/7.x/identicon/svg?seed={user.user_id}"

    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        name=name,
        role=user.role,
        avatar_url=avatar_url,
        token=user.token,
    )

@router.post("/logout", response_model=StatusResponse)
def logout(response: Response, user: UserSession = Depends(require_auth)):
    """Terminate current session and clear session cookie."""
    AuthService.delete_session(user.token)
    response.delete_cookie(key="session", path="/")
    return StatusResponse(status="success", message="Logged out successfully")
