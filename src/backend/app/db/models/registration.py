from sqlalchemy import Table, Column, String, DateTime, UniqueConstraint, func
from app.db.base import metadata

event_registrations_table = Table(
    "event_registrations",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("event_id", String(64), index=True, nullable=False),
    Column("user_id", String(64), index=True, nullable=False),
    Column("user_email", String(255), nullable=True),
    Column("user_name", String(128), nullable=True),
    Column("team_id", String(64), nullable=True),
    Column("status", String(32), nullable=False, server_default="confirmed"),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
    UniqueConstraint("event_id", "user_id", name="uq_event_user_registration"),
)
