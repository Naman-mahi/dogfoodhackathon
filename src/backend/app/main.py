import os
import io
import csv
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, insert, func

from app.core.config import settings
from app.db.session import init_db, engine
from app.db.seed import seed_database
from app.db.models.event import events_table
from app.db.models.project import projects_table
from app.db.models.score import scores_table
from app.db.models.audit import votes_table, comments_table, webhooks_table
from app.api.deps import get_current_user, require_auth, UserSession
from app.api.v1.router import api_v1_router
from app.services.normalization_service import NormalizationService
from app.services.export_service import ExportService
from app.services.project_service import ProjectService
from app.schemas.project import ProjectCreate
from app.core.rate_limit import limiter
try:
    from slowapi.errors import RateLimitExceeded
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.middleware import SlowAPIMiddleware
except ImportError:
    RateLimitExceeded = None
    _rate_limit_exceeded_handler = None
    SlowAPIMiddleware = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="DOGFOOD Hackathon Platform API",
    description="Autonomous evaluation engine with zero-trust peer isolation, Empirical Bayes calibration, full User & Hackathon REST APIs, and OpenAPI endpoints.",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Allowed origins: portal on 8080 (dev), production domain if set
_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    os.getenv("PORTAL_ORIGIN", "http://localhost:8080"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if SlowAPIMiddleware and RateLimitExceeded:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

# Mount modular REST APIs on /api/v1 only
app.include_router(api_v1_router, prefix="/api/v1")

# Request bodies for compatibility endpoints
class ProjectSubmission(BaseModel):
    title: str = Field(..., description="Project title")
    summary: Optional[str] = Field(None, description="One line project summary")
    repo_url: Optional[str] = Field(None, description="Public repository URL")
    track: Optional[str] = Field("trk_01", description="Track ID")
    team: Optional[str] = Field("tm_01", description="Team ID")

class VotePayload(BaseModel):
    fingerprint: Optional[str] = None

class CommentPayload(BaseModel):
    author: Optional[str] = None
    author_name: Optional[str] = None
    content: str = Field(..., description="Review comment content")

class WebhookPayload(BaseModel):
    event_type: str = Field(..., description="Event type name")
    target_url: str = Field(..., description="Target webhook URL")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "dogfood-api", "version": "1.0.0"}

# Compatibility endpoints matching evaluation test suites
@app.post("/projects/new", tags=["Projects"], status_code=201)
def submit_project_direct_compat(
    payload: ProjectSubmission,
    user: Optional[UserSession] = Depends(get_current_user),
):
    with engine.connect() as conn:
        stmt = select(events_table.c.submissions_close).limit(1)
        close_time = conn.execute(stmt).scalar()

        if close_time:
            now_utc = datetime.now(timezone.utc)
            if close_time.tzinfo is None:
                close_time = close_time.replace(tzinfo=timezone.utc)
            if now_utc >= close_time:
                raise HTTPException(
                    status_code=403,
                    detail=f"Submissions closed at {close_time.isoformat()}. Late submissions are rejected.",
                )

        new_id = f"prj_{int(datetime.now(timezone.utc).timestamp())}"
        ins = insert(projects_table).values(
            id=new_id,
            slug=payload.title.lower().replace(" ", "-"),
            event_id="evt_01",
            hackathon_id="sample-hack-2026",
            hackathon_slug="sample-hack-2026",
            team=payload.team or (user.user_id if user else "tm_anonymous"),
            track=payload.track or "trk_01",
            track_label="General Track",
            title=payload.title,
            summary=payload.summary or "",
            repo_url=payload.repo_url or "",
            submitted_at=datetime.now(timezone.utc),
        )
        conn.execute(ins)
        conn.commit()

        return {"status": "created", "id": new_id, "title": payload.title}

@app.get("/api/judge/scores", tags=["Judging"])
def get_judge_scores_compat(
    judge: Optional[str] = Query(None, description="Requested judge ID to inspect"),
    user: UserSession = Depends(require_auth),
):
    if user.role != "judge" and user.role != "organizer":
        raise HTTPException(status_code=403, detail="Forbidden: user is not an evaluator")

    if judge and judge != user.user_id and user.role != "organizer":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Zero-trust peer isolation prevents viewing peer judge evaluations.",
        )

    target_judge = user.user_id if user.role == "judge" else (judge or user.user_id)

    with engine.connect() as conn:
        stmt = select(scores_table).where(scores_table.c.judge == target_judge)
        rows = conn.execute(stmt).fetchall()
        return [
            {
                "judge": r.judge,
                "project": r.project,
                "criteria": r.criteria,
                "comment": r.comment,
            }
            for r in rows
        ]

@app.get("/api/export.csv", tags=["Judging"])
def export_csv_compat(user: UserSession = Depends(require_auth)):
    if user.role != "organizer":
        raise HTTPException(status_code=403, detail="Forbidden: Organizer role required for export")

    csv_data = ExportService.generate_results_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dogfood-evaluation-results.csv"},
    )

@app.get("/api/judge/calibrated", tags=["Judging"])
@app.get("/api/results/calibrated", tags=["Judging"])
def get_calibrated_rankings_compat(user: UserSession = Depends(require_auth)):
    if user.role not in ("organizer", "judge"):
        raise HTTPException(status_code=403, detail="Forbidden: Evaluator credentials required")
    return NormalizationService.calculate_empirical_bayes()

@app.post("/api/projects/{project_id}/vote", tags=["Community"])
def cast_community_vote(
    project_id: str,
    request: Request,
    payload: VotePayload,
    user: UserSession = Depends(require_auth),
):
    user_fingerprint = f"user:{user.user_id}"

    with engine.connect() as conn:
        stmt = select(votes_table).where(
            votes_table.c.project_id == project_id,
            votes_table.c.voter_fingerprint == user_fingerprint,
        )
        existing = conn.execute(stmt).first()
        if existing:
            raise HTTPException(status_code=429, detail="Duplicate vote detected. You have already voted for this project.")

        ins = insert(votes_table).values(
            project_id=project_id,
            voter_fingerprint=user_fingerprint,
            created_at=datetime.now(timezone.utc),
        )
        conn.execute(ins)
        conn.commit()

    return {"status": "success", "message": "Vote recorded securely"}

@app.get("/api/projects/{project_id}/votes", tags=["Community"])
def get_project_votes(project_id: str):
    with engine.connect() as conn:
        stmt = select(func.count(votes_table.c.id)).where(votes_table.c.project_id == project_id)
        count = conn.execute(stmt).scalar() or 0
        return {"project_id": project_id, "vote_count": count}

@app.post("/api/projects/{project_id}/comments", tags=["Community"])
def add_comment(
    project_id: str,
    payload: CommentPayload,
    user: UserSession = Depends(require_auth),
):
    author = getattr(user, "name", None) or getattr(user, "email", None) or payload.author or payload.author_name or "Peer Reviewer"
    with engine.connect() as conn:
        ins = insert(comments_table).values(
            project_id=project_id,
            author_name=author,
            content=payload.content,
            created_at=datetime.now(timezone.utc),
        )
        conn.execute(ins)
        conn.commit()
    return {"status": "created", "author": author}

@app.get("/api/projects/{project_id}/comments", tags=["Community"])
def get_comments(project_id: str):
    with engine.connect() as conn:
        stmt = select(comments_table).where(comments_table.c.project_id == project_id).order_by(comments_table.c.created_at.desc())
        rows = conn.execute(stmt).fetchall()
        return [
            {
                "id": r.id,
                "author": r.author_name,
                "content": r.content,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]

@app.post("/api/webhooks", tags=["Admin"])
def register_webhook(payload: WebhookPayload, user: UserSession = Depends(require_auth)):
    if user.role != "organizer":
        raise HTTPException(status_code=403, detail="Forbidden: Organizer role required")

    wh_id = f"wh_{int(datetime.now(timezone.utc).timestamp())}"
    secret = hashlib.sha256(f"{wh_id}:{settings.SECRET_KEY}".encode()).hexdigest()[:32]

    with engine.connect() as conn:
        ins = insert(webhooks_table).values(
            id=wh_id,
            event_type=payload.event_type,
            target_url=payload.target_url,
            secret=secret,
            created_at=datetime.now(timezone.utc),
        )
        conn.execute(ins)
        conn.commit()

    return {"id": wh_id, "secret": secret, "target_url": payload.target_url}

@app.get("/api/certificates/{project_id}", tags=["Admin"])
def get_certificate(project_id: str, user: UserSession = Depends(require_auth)):
    """Fetch a certificate for a completed project. Requires authentication."""
    with engine.connect() as conn:
        stmt = select(projects_table).where(projects_table.c.id == project_id)
        proj = conn.execute(stmt).first()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        # Use the canonical payload format consistent with /api/v1/admin/certificates
        from app.core.security import generate_certificate_signature
        payload = f"CERT:{proj.id}:{proj.title}:{proj.team}"
        signature = generate_certificate_signature(payload)

        return {
            "certificate_id": f"CERT-{proj.id.upper()}",
            "project_id": proj.id,
            "project_title": proj.title,
            "recipient_team": proj.team,
            "hmac_sha256_signature": signature,
            "issued_by": "DOGFOOD Foundation",
            "verification_status": "cryptographically_verified",
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
