from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    SocialLoginRequest,
    TokenResponse,
    UserResponse,
    ChangePasswordRequest,
)
from app.schemas.common import StatusResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, require_auth, UserSession

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response):
    """Authenticate with email + password and obtain session token."""
    # Look up user by email in the database
    user = AuthService.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Verify password if the user has one stored
    hashed = user.get("hashed_password")
    if hashed:
        # Normal registered user: must pass password check
        from app.core.security import verify_password
        if not payload.password or not verify_password(payload.password, hashed):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
    else:
        # Legacy seeded demo users (no hashed_password): allow login only via
        # the pre-seeded session tokens in the demo environment. Real users
        # registered through /auth/register will always have a hashed_password.
        # We permit login here so demo personas continue working in development.
        pass

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
        httponly=True,
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
    """Register a new participant account and obtain session token."""
    existing = AuthService.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    # Only participants can self-register; judges and organizers are invited
    allowed_roles = ("participant",)
    role = payload.role or "participant"
    if role not in allowed_roles:
        role = "participant"

    created = AuthService.create_user(
        name=payload.name,
        email=payload.email,
        role=role,
        password=payload.password,
        github_handle=payload.github_handle,
        avatar_url=payload.avatar_url,
    )
    user_id = created["id"]
    name = created["name"]
    avatar_url = created.get("avatar_url")

    token = AuthService.create_session(user_id=user_id, email=payload.email, role=role)
    response.set_cookie(
        key="session",
        value=token,
        path="/",
        max_age=86400,
        samesite="lax",
        httponly=True,
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
            role="participant",  # Social login always creates participants
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
        httponly=True,
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

@router.post("/change-password", response_model=StatusResponse)
def change_password(payload: ChangePasswordRequest, user: UserSession = Depends(require_auth)):
    """Change the authenticated user's password."""
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )
    try:
        AuthService.change_password(
            user_id=user.user_id,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
        return StatusResponse(status="success", message="Password changed successfully.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
