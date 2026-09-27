import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select, insert, update, delete, or_, func
from app.db.session import engine
from app.db.models.user import users_table
from app.db.models.project import projects_table
from app.db.models.score import scores_table
from app.schemas.user import UserCreate, UserUpdate

class UserService:
    @staticmethod
    def get_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(users_table).where(users_table.c.id == user_id)
            row = conn.execute(stmt).mappings().first()
            return dict(row) if row else None

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(users_table).where(users_table.c.email == email)
            row = conn.execute(stmt).mappings().first()
            return dict(row) if row else None

    @staticmethod
    def list_users(role: Optional[str] = None, search: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(users_table)
            if role and role != "all":
                stmt = stmt.where(users_table.c.role == role)
            if search:
                term = f"%{search}%"
                stmt = stmt.where(or_(
                    users_table.c.name.ilike(term),
                    users_table.c.email.ilike(term),
                    users_table.c.id.ilike(term),
                ))
            stmt = stmt.order_by(users_table.c.created_at.desc()).limit(limit).offset(offset)
            rows = conn.execute(stmt).mappings().fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def count_users(role: Optional[str] = None) -> int:
        with engine.connect() as conn:
            stmt = select(func.count(users_table.c.id))
            if role and role != "all":
                stmt = stmt.where(users_table.c.role == role)
            return conn.execute(stmt).scalar() or 0

    @staticmethod
    def create_user(data: UserCreate) -> Dict[str, Any]:
        user_id = data.id or f"usr_{uuid.uuid4().hex[:8]}"
        with engine.connect() as conn:
            stmt = insert(users_table).values(
                id=user_id,
                email=data.email,
                name=data.name,
                role=data.role,
                avatar_url=data.avatar_url,
                bio=data.bio,
                github_handle=data.github_handle,
            ).returning(users_table)
            row = conn.execute(stmt).mappings().first()
            conn.commit()
            return dict(row)

    @staticmethod
    def update_user(user_id: str, data: UserUpdate) -> Optional[Dict[str, Any]]:
        values = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        if not values:
            return UserService.get_by_id(user_id)

        with engine.connect() as conn:
            stmt = update(users_table).where(users_table.c.id == user_id).values(**values).returning(users_table)
            row = conn.execute(stmt).mappings().first()
            conn.commit()
            return dict(row) if row else None

    @staticmethod
    def delete_user(user_id: str) -> bool:
        with engine.connect() as conn:
            stmt = delete(users_table).where(users_table.c.id == user_id)
            res = conn.execute(stmt)
            conn.commit()
            return res.rowcount > 0

    @staticmethod
    def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
        user = UserService.get_by_id(user_id)
        if not user:
            return None

        with engine.connect() as conn:
            # User's projects
            p_stmt = select(projects_table).where(or_(
                projects_table.c.team == user_id,
                projects_table.c.team == user.get("name"),
            ))
            projects = [dict(r) for r in conn.execute(p_stmt).mappings().fetchall()]

            # Judge review count if applicable
            s_stmt = select(func.count(scores_table.c.id)).where(scores_table.c.judge == user_id)
            reviews_count = conn.execute(s_stmt).scalar() or 0

        user_data = dict(user)
        user_data["projects"] = projects
        user_data["reviews_count"] = reviews_count
        user_data["stats"] = {
            "submissions_count": len(projects),
            "evaluations_count": reviews_count,
            "role": user.get("role"),
        }
        return user_data
