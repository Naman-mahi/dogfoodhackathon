from sqlalchemy import Table, Column, String, Float, Text, Integer, ForeignKey
from app.db.base import metadata

rubrics_table = Table(
    "rubrics",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("event_id", String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=True),
    Column("criterion_name", String(128), nullable=False),
    Column("weight", Float, nullable=False, default=1.0),
    Column("max_score", Integer, nullable=False, default=5),
    Column("description", Text, nullable=True),
)
