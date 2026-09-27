from sqlalchemy import Table, Column, String, Text, DateTime, func
from app.db.base import metadata

users_table = Table(
    "users",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("email", String(255), unique=True, nullable=False),
    Column("hashed_password", String(255), nullable=True),
    Column("role", String(32), nullable=False, default="participant"),
    Column("name", String(128), nullable=False),
    Column("avatar_url", String(512), nullable=True),
    Column("bio", Text, nullable=True),
    Column("github_handle", String(128), nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

sessions_table = Table(
    "sessions",
    metadata,
    Column("token", String(128), primary_key=True),
    Column("role", String(64), nullable=False),
    Column("user_id", String(64), nullable=False),
    Column("user_email", String(255), nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
