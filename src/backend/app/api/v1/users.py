from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, UserOut, UserProfile
from app.schemas.project import ProjectOut
from app.api.deps import require_auth, require_organizer, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def list_users(
    role: Optional[str] = Query(None, description="Filter by role (organizer, judge, participant)"),
    search: Optional[str] = Query(None, description="Search by name, email, or user ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List users with filtering, search, and pagination."""
    return UserService.list_users(role=role, search=search, limit=limit, offset=offset)

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str):
    """Get user details by user ID."""
    user = UserService.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(user_id: str):
    """Get rich user profile including associated projects and evaluator metrics."""
    profile = UserService.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile

@router.get("/{user_id}/projects")
def get_user_projects(user_id: str):
    """Get projects submitted by or associated with this user."""
    profile = UserService.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile.get("projects", [])

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, organizer=Depends(require_organizer)):
    """Create a new user account (organizer only)."""
    existing = UserService.get_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    return UserService.create_user(data)

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, data: UserUpdate, current_user=Depends(require_auth)):
    """Update user information (user themselves or organizer)."""
    if current_user.user_id != user_id and current_user.role != "organizer":
        raise HTTPException(status_code=403, detail="Forbidden: You can only update your own profile")

    updated = UserService.update_user(user_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, organizer=Depends(require_organizer)):
    """Delete a user account (organizer only)."""
    success = UserService.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
