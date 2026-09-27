from sqlalchemy import Table, Column, String, Text, DateTime, func
from app.db.base import metadata

email_logs_table = Table(
    "email_logs",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("recipient", String(255), nullable=False, index=True),
    Column("subject", String(255), nullable=False),
    Column("template", String(64), nullable=False),
    Column("status", String(32), nullable=False, server_default="sent"),
    Column("body_preview", Text, nullable=True),
    Column("error_message", Text, nullable=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)
