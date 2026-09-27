import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, insert
from app.db.session import engine
from app.db.models.audit import webhooks_table, audit_logs_table
from app.db.models.project import projects_table
from app.api.deps import require_organizer
from app.core.security import generate_certificate_signature, verify_certificate_signature

router = APIRouter(prefix="/admin", tags=["admin"])

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
def generate_certificate(project_id: str):
    with engine.connect() as conn:
        stmt = select(projects_table).where(projects_table.c.id == project_id)
        proj = conn.execute(stmt).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        payload = f"CERT:{proj.id}:{proj.title}:{proj.team}"
        sig = generate_certificate_signature(payload)
        return {
            "project_id": proj.id,
            "project_title": proj.title,
            "team": proj.team,
            "certificate_payload": payload,
            "signature": sig,
            "verification_algorithm": "HMAC-SHA256"
        }

@router.post("/certificates/verify")
def verify_certificate(req: CertificateVerifyRequest):
    valid = verify_certificate_signature(req.payload, req.signature)
    return {"valid": valid}

@router.get("/audit-logs")
def list_audit_logs(organizer=Depends(require_organizer)):
    with engine.connect() as conn:
        stmt = select(audit_logs_table).order_by(audit_logs_table.c.timestamp.desc()).limit(100)
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
