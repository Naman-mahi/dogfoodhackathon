import uuid
from typing import Optional, Dict, Any
from sqlalchemy import select, insert, delete
from app.db.session import engine
from app.db.models.user import users_table, sessions_table
from app.core.security import generate_session_token

class AuthService:
    @staticmethod
    def get_session_user(token: str):
        with engine.connect() as conn:
            stmt = select(sessions_table).where(sessions_table.c.token == token)
            return conn.execute(stmt).first()

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
    def create_user(
        name: str,
        email: str,
        role: str = "participant",
        avatar_url: Optional[str] = None,
        github_handle: Optional[str] = None,
        bio: Optional[str] = None,
    ) -> Dict[str, Any]:
        prefix = "org" if role == "organizer" else "jdg" if role == "judge" else "prt"
        user_id = f"{prefix}_{uuid.uuid4().hex[:6]}"
        if not avatar_url:
            avatar_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}"

        values = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
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
        with engine.begin() as conn:
            stmt = insert(sessions_table).values(
                token=token,
                role=role,
                user_id=user_id,
                user_email=email,
            )
            conn.execute(stmt)
        return token

    @staticmethod
    def delete_session(token: str) -> bool:
        with engine.begin() as conn:
            stmt = delete(sessions_table).where(sessions_table.c.token == token)
            res = conn.execute(stmt)
            return res.rowcount > 0
