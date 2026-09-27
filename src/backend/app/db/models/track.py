from sqlalchemy import Table, Column, String, ForeignKey
from app.db.base import metadata

tracks_table = Table(
    "tracks",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("event_id", String(64), ForeignKey("events.id", ondelete="CASCADE"), nullable=True),
    Column("name", String(255), nullable=False),
)
