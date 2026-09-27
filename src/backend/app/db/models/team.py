from sqlalchemy import Table, Column, String, JSON, DateTime, func
from app.db.base import metadata

teams_table = Table(
    "teams",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("name", String(255), nullable=False),
    Column("members", JSON, nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
