from sqlalchemy import Table, Column, String, JSON, DateTime, func
from app.db.base import metadata

judges_table = Table(
    "judges",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("name", String(255), nullable=False),
    Column("email", String(255), nullable=False),
    Column("tracks", JSON, nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
