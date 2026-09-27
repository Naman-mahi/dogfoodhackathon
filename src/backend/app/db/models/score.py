from sqlalchemy import Table, Column, String, Integer, JSON, Text, DateTime, func
from app.db.base import metadata

scores_table = Table(
    "scores",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("judge", String(64), nullable=False),
    Column("project", String(64), nullable=False),
    Column("criteria", JSON, nullable=False),
    Column("comment", Text, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
