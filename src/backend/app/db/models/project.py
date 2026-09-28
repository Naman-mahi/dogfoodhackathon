from sqlalchemy import Table, Column, String, Integer, Boolean, Text, DateTime, JSON, ForeignKey, func
from app.db.base import metadata

projects_table = Table(
    "projects",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("slug", String(128), index=True, nullable=True),
    Column("event_id", String(64), nullable=True),
    Column("hackathon_id", String(64), nullable=True),
    Column("hackathon_slug", String(128), nullable=True),
    Column("team", String(64), nullable=False),
    Column("user_id", String(64), index=True, nullable=True),
    Column("track", String(64), nullable=False),
    Column("track_label", String(128), nullable=True),
    Column("title", String(255), nullable=False),
    Column("summary", Text, nullable=True),
    Column("problem", Text, nullable=True),
    Column("solution", Text, nullable=True),
    Column("technologies", JSON, nullable=True),
    Column("repo_url", String(512), nullable=True),
    Column("demo_url", String(512), nullable=True),
    Column("likes_count", Integer, nullable=False, server_default="0"),
    Column("featured", Boolean, nullable=False, server_default="false"),
    Column("status", String(32), nullable=False, server_default="submitted"),
    Column("submitted_at", DateTime(timezone=True), nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
