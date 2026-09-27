from typing import Optional
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
