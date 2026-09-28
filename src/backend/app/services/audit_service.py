from typing import Optional, Any, Dict
from sqlalchemy import insert
from app.db.session import engine
from app.db.models.audit import audit_logs_table

class AuditService:
    @staticmethod
    def record(user_id: Optional[str], action: str, details: Optional[Dict[str, Any]] = None):
        """Append an immutable audit log record to audit_logs_table."""
        try:
            with engine.begin() as conn:
                stmt = insert(audit_logs_table).values(
                    user_id=user_id or "system",
                    action=action,
                    details=details or {},
                )
                conn.execute(stmt)
        except Exception as e:
            # Audit logging should never crash the primary business logic
            print(f"[audit_service] Warning: Failed to record audit log: {e}")
