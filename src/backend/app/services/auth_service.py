import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, insert, delete
from app.db.session import engine
from app.db.models.user import users_table, sessions_table
from app.core.security import generate_session_token, hash_password, verify_password

# Sessions expire after 24 hours
SESSION_TTL_HOURS = 24

class AuthService:
    @staticmethod
    def get_session_user(token: str):
        """Retrieve session record only if it exists and has not expired."""
        with engine.connect() as conn:
            stmt = select(sessions_table).where(sessions_table.c.token == token)
            row = conn.execute(stmt).first()
            if not row:
                return None
            # Enforce session expiry
            if row.expires_at:
                expires = row.expires_at
                if expires.tzinfo is None:
                    expires = expires.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) > expires:
                    # Auto-delete expired session
                    with engine.begin() as wconn:
                        wconn.execute(delete(sessions_table).where(sessions_table.c.token == token))
                    return None
            return row

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(users_table).where(users_table.c.email == email)
            row = conn.execute(stmt).first()
            return dict(row._mapping) if row else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(users_table).where(users_table.c.id == user_id)
            row = conn.execute(stmt).first()
            return dict(row._mapping) if row else None

    @staticmethod
    def verify_user_password(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Verify email + password. Returns user dict if valid, None otherwise."""
        user = AuthService.get_user_by_email(email)
        if not user:
            return None
        hashed = user.get("hashed_password")
        if not hashed:
            # Legacy seeded users without passwords: reject unless it's a demo token
            return None
        if not verify_password(password, hashed):
            return None
        return user

    @staticmethod
    def create_user(
        name: str,
        email: str,
        role: str = "participant",
        password: Optional[str] = None,
        avatar_url: Optional[str] = None,
        github_handle: Optional[str] = None,
        bio: Optional[str] = None,
    ) -> Dict[str, Any]:
        prefix = "org" if role == "organizer" else "jdg" if role == "judge" else "prt"
        user_id = f"{prefix}_{uuid.uuid4().hex[:6]}"
        if not avatar_url:
            avatar_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}"

        hashed = hash_password(password) if password else None

        values = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "hashed_password": hashed,
            "avatar_url": avatar_url,
            "github_handle": github_handle,
            "bio": bio or f"Registered {role} member of the DOGFOOD portal.",
        }
        with engine.begin() as conn:
            stmt = insert(users_table).values(**values)
            conn.execute(stmt)
        return values

    @staticmethod
    def get_or_create_user(
        email: str,
        name: str,
        role: str = "participant",
        avatar_url: Optional[str] = None,
        github_handle: Optional[str] = None,
    ) -> Dict[str, Any]:
        existing = AuthService.get_user_by_email(email)
        if existing:
            return existing
        return AuthService.create_user(
            name=name,
            email=email,
            role=role,
            avatar_url=avatar_url,
            github_handle=github_handle,
        )

    @staticmethod
    def create_session(user_id: str, email: str, role: str) -> str:
        token = generate_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
        with engine.begin() as conn:
            stmt = insert(sessions_table).values(
                token=token,
                role=role,
                user_id=user_id,
                user_email=email,
                expires_at=expires_at,
            )
            conn.execute(stmt)
        return token

    @staticmethod
    def delete_session(token: str) -> bool:
        with engine.begin() as conn:
            stmt = delete(sessions_table).where(sessions_table.c.token == token)
            res = conn.execute(stmt)
            return res.rowcount > 0

    @staticmethod
    def change_password(user_id: str, current_password: str, new_password: str) -> bool:
        from sqlalchemy import update
        user = AuthService.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found.")
        
        hashed = user.get("hashed_password")
        if hashed and not verify_password(current_password, hashed):
            raise ValueError("Current password does not match.")
        
        new_hashed = hash_password(new_password)
        with engine.begin() as conn:
            stmt = update(users_table).where(users_table.c.id == user_id).values(hashed_password=new_hashed)
            conn.execute(stmt)
        return True
