import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, insert, update, func
from app.db.session import engine
from app.db.models.user import users_table
from app.db.models.event import events_table
from app.db.models.project import projects_table
from app.db.models.score import scores_table
from app.db.models.audit import webhooks_table, audit_logs_table
from app.api.deps import require_admin, require_organizer, UserSession
from app.core.security import generate_certificate_signature, verify_certificate_signature

router = APIRouter(prefix="/admin", tags=["admin"])

class UserRoleUpdate(BaseModel):
    role: str

class UserAdminOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None

class WebhookCreate(BaseModel):
    event_type: str
    target_url: str
    secret: str

class WebhookOut(BaseModel):
    id: str
    event_type: str
    target_url: str

class CertificateVerifyRequest(BaseModel):
    payload: str
    signature: str

@router.get("/stats")
def get_admin_stats(user: UserSession = Depends(require_organizer)):
    """System-level operational statistics for platform operators."""
    with engine.connect() as conn:
        user_count = conn.execute(select(func.count(users_table.c.id))).scalar() or 0
        event_count = conn.execute(select(func.count(events_table.c.id))).scalar() or 0
        project_count = conn.execute(select(func.count(projects_table.c.id))).scalar() or 0
        score_count = conn.execute(select(func.count(scores_table.c.id))).scalar() or 0
        audit_count = conn.execute(select(func.count(audit_logs_table.c.id))).scalar() or 0
        webhook_count = conn.execute(select(func.count(webhooks_table.c.id))).scalar() or 0

    return {
        "users": user_count,
        "events": event_count,
        "projects": project_count,
        "scores": score_count,
        "audit_logs": audit_count,
        "webhooks": webhook_count,
        "mode": "offline-autonomous",
        "system_status": "healthy",
    }

@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    role: Optional[str] = None,
    user: UserSession = Depends(require_organizer),
):
    """List all registered platform users with their authorization roles."""
    with engine.connect() as conn:
        stmt = select(users_table)
        if role:
            stmt = stmt.where(users_table.c.role == role)
        rows = conn.execute(stmt).fetchall()
        return [
            UserAdminOut(
                id=r.id,
                email=r.email,
                name=r.name,
                role=r.role,
                avatar_url=r.avatar_url,
                bio=r.bio,
                created_at=str(r.created_at) if hasattr(r, "created_at") and r.created_at else None,
            )
            for r in rows
        ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    user: UserSession = Depends(require_organizer),
):
    """Elevate or modify a user's platform role (admin, organizer, judge, participant)."""
    valid_roles = ("admin", "organizer", "judge", "participant")
    if payload.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of: {', '.join(valid_roles)}",
        )

    with engine.begin() as conn:
        stmt = update(users_table).where(users_table.c.id == user_id).values(role=payload.role)
        res = conn.execute(stmt)
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"user_id": user_id, "new_role": payload.role, "status": "updated"}

@router.get("/webhooks", response_model=List[WebhookOut])
def list_webhooks(organizer=Depends(require_organizer)):
    with engine.connect() as conn:
        stmt = select(webhooks_table)
        rows = conn.execute(stmt).fetchall()
        return [WebhookOut(id=r.id, event_type=r.event_type, target_url=r.target_url) for r in rows]

@router.post("/webhooks", response_model=WebhookOut)
def create_webhook(data: WebhookCreate, organizer=Depends(require_organizer)):
    wh_id = f"wh_{uuid.uuid4().hex[:8]}"
    with engine.connect() as conn:
        stmt = insert(webhooks_table).values(
            id=wh_id,
            event_type=data.event_type,
            target_url=data.target_url,
            secret=data.secret
        )
        conn.execute(stmt)
        conn.commit()
    return WebhookOut(id=wh_id, event_type=data.event_type, target_url=data.target_url)

@router.get("/certificates/{project_id}")
def generate_certificate(project_id: str, organizer=Depends(require_organizer)):
    """Generate a cryptographically signed certificate for a project (organizers only)."""
    with engine.connect() as conn:
        stmt = select(projects_table).where(projects_table.c.id == project_id)
        proj = conn.execute(stmt).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        # Canonical payload format (consistent across all certificate endpoints)
        payload = f"CERT:{proj.id}:{proj.title}:{proj.team}"
        sig = generate_certificate_signature(payload)
        return {
            "certificate_id": f"CERT-{proj.id.upper()}",
            "project_id": proj.id,
            "project_title": proj.title,
            "team": proj.team,
            "certificate_payload": payload,
            "hmac_sha256_signature": sig,
            "issued_by": "DOGFOOD Foundation",
            "verification_algorithm": "HMAC-SHA256",
            "verification_status": "cryptographically_verified",
        }

@router.post("/certificates/verify")
def verify_certificate(req: CertificateVerifyRequest):
    valid = verify_certificate_signature(req.payload, req.signature)
    return {"valid": valid}

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    organizer=Depends(require_organizer),
):
    with engine.connect() as conn:
        stmt = select(audit_logs_table).order_by(audit_logs_table.c.timestamp.desc()).limit(limit)
        rows = conn.execute(stmt).fetchall()
        return [
            {
                "id": r.id,
                "user_id": r.user_id,
                "action": r.action,
                "details": r.details,
                "timestamp": str(r.timestamp),
            }
            for r in rows
        ]
