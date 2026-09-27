from sqlalchemy import Table, Column, String, Integer, Text, DateTime, JSON, func
from app.db.base import metadata

votes_table = Table(
    "votes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("project_id", String(64), nullable=False),
    Column("voter_fingerprint", String(128), nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

comments_table = Table(
    "comments",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("project_id", String(64), nullable=False),
    Column("author_name", String(128), nullable=False),
    Column("content", Text, nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

webhooks_table = Table(
    "webhooks",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("event_type", String(64), nullable=False),
    Column("target_url", String(512), nullable=False),
    Column("secret", String(128), nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

audit_logs_table = Table(
    "audit_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", String(64), nullable=False),
    Column("action", String(64), nullable=False),
    Column("details", JSON, nullable=True),
    Column("timestamp", DateTime(timezone=True), server_default=func.now()),
)
