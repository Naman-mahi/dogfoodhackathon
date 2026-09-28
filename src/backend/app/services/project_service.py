import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, insert, update, delete, or_, func
from app.db.session import engine
from app.db.models.project import projects_table
from app.db.models.event import events_table
from app.db.models.user import users_table, sessions_table
from app.db.models.audit import votes_table
from app.db.models.judge import judges_table
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.event_service import EventService
from app.services.email_service import EmailService
from app.services.audit_service import AuditService
from app.core.exceptions import DeadlineExpiredException

class ProjectService:
    @staticmethod
    def list_projects(
        track: Optional[str] = None,
        hackathon: Optional[str] = None,
        search: Optional[str] = None,
        featured: Optional[bool] = None,
        sort: Optional[str] = "latest",
        include_drafts: bool = False,
        judge_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(projects_table)

            # Public gallery only shows submitted projects unless include_drafts is True
            if not include_drafts:
                stmt = stmt.where(or_(
                    projects_table.c.status == None,
                    projects_table.c.status != "draft",
                ))

            if judge_id:
                j_stmt = select(judges_table).where(or_(
                    judges_table.c.id == judge_id,
                    judges_table.c.email == judge_id,
                ))
                judge_row = conn.execute(j_stmt).first()
                if judge_row and judge_row.tracks:
                    track_conds = []
                    for t in judge_row.tracks:
                        track_conds.append(projects_table.c.track == t)
                        track_conds.append(projects_table.c.track_label.ilike(f"%{t}%"))
                    if track_conds:
                        stmt = stmt.where(or_(*track_conds))

            if track and track != "all":
                stmt = stmt.where(or_(
                    projects_table.c.track == track,
                    projects_table.c.track_label.ilike(f"%{track}%"),
                ))
            if hackathon and hackathon != "all":
                stmt = stmt.where(or_(
                    projects_table.c.event_id == hackathon,
                    projects_table.c.hackathon_id == hackathon,
                    projects_table.c.hackathon_slug == hackathon,
                ))
            if featured is not None:
                stmt = stmt.where(projects_table.c.featured == featured)
            if search:
                term = f"%{search}%"
                stmt = stmt.where(or_(
                    projects_table.c.title.ilike(term),
                    projects_table.c.summary.ilike(term),
                    projects_table.c.team.ilike(term),
                    projects_table.c.track_label.ilike(term),
                ))

            # Anti-bias sorting: shuffle projects randomly to avoid early-submission bias
            if sort == "random":
                stmt = stmt.order_by(func.random())
            else:
                stmt = stmt.order_by(projects_table.c.submitted_at.desc())

            stmt = stmt.limit(limit).offset(offset)
            rows = conn.execute(stmt).mappings().fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_project(project_id_or_slug: str) -> Optional[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(projects_table).where(or_(
                projects_table.c.id == project_id_or_slug,
                projects_table.c.slug == project_id_or_slug,
            ))
            row = conn.execute(stmt).mappings().first()
            return dict(row) if row else None

    @staticmethod
    def get_user_event_submission(event_id_or_slug: str, user_id: str) -> Optional[Dict[str, Any]]:
        evt = EventService.get_event(event_id_or_slug)
        event_id = evt["id"] if evt else event_id_or_slug
        event_slug = evt["slug"] if evt else event_id_or_slug

        with engine.connect() as conn:
            stmt = select(projects_table).where(
                or_(
                    projects_table.c.event_id == event_id,
                    projects_table.c.hackathon_id == event_id,
                    projects_table.c.hackathon_slug == event_slug,
                ),
                or_(
                    projects_table.c.user_id == user_id,
                    projects_table.c.team == user_id,
                ),
            ).order_by(projects_table.c.submitted_at.desc())
            row = conn.execute(stmt).mappings().first()
            return dict(row) if row else None

    @staticmethod
    def create_project(data: ProjectCreate, submitter_team: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        event_target = data.hackathon_id or data.hackathon_slug or "sample-hack-2026"
        is_submitting_final = (data.status or "submitted") != "draft"

        # Deadline enforcement strictly triggers on final submission
        if is_submitting_final and EventService.is_event_closed(event_target):
            raise DeadlineExpiredException(
                "Submissions closed for this event. Submissions made after the deadline are refused."
            )

        evt = EventService.get_event(event_target)
        event_id = evt["id"] if evt else "evt_01"
        hackathon_id = evt["id"] if evt else event_target
        hackathon_slug = evt["slug"] if evt else event_target

        new_id = data.id or f"prj_{int(datetime.now(timezone.utc).timestamp())}"
        slug = data.slug or data.title.lower().replace(" ", "-")
        submitted_at = datetime.now(timezone.utc)
        project_status = data.status or "submitted"

        with engine.begin() as conn:
            stmt = insert(projects_table).values(
                id=new_id,
                slug=slug,
                event_id=event_id,
                hackathon_id=hackathon_id,
                hackathon_slug=hackathon_slug,
                team=data.team or submitter_team or "tm_01",
                user_id=user_id or data.user_id,
                track=data.track or "trk_01",
                track_label=data.track_label or "General Track",
                title=data.title,
                summary=data.summary or "",
                problem=data.problem or "",
                solution=data.solution or "",
                technologies=data.technologies or [],
                repo_url=data.repo_url or "",
                demo_url=data.demo_url or "",
                likes_count=0,
                featured=data.featured or False,
                status=project_status,
                submitted_at=submitted_at,
            )
            conn.execute(stmt)

            if evt and project_status != "draft":
                conn.execute(
                    update(events_table)
                    .where(events_table.c.id == event_id)
                    .values(submission_count=events_table.c.submission_count + 1)
                )

        proj = ProjectService.get_project(new_id)

        # Audit logging
        AuditService.record(
            user_id=user_id or submitter_team,
            action="project.create" if project_status == "draft" else "project.submitted",
            details={"project_id": new_id, "title": data.title, "status": project_status, "event": event_id},
        )

        # Dispatch submission confirmation email to submitter
        try:
            submitter_email = None
            if user_id:
                with engine.connect() as conn:
                    u_row = conn.execute(select(users_table.c.email).where(users_table.c.id == user_id)).mappings().first()
                    if u_row:
                        submitter_email = u_row["email"]
            if submitter_email:
                EmailService.send_submission_confirmation(
                    user_email=submitter_email,
                    user_name=data.team or submitter_team,
                    project_data=proj,
                    event_data=evt or {"title": event_target, "slug": event_target},
                )
        except Exception:
            pass

        return proj

    @staticmethod
    def update_project(project_id: str, data: ProjectUpdate) -> Optional[Dict[str, Any]]:
        values = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        if not values:
            return ProjectService.get_project(project_id)
        with engine.begin() as conn:
            stmt = update(projects_table).where(or_(
                projects_table.c.id == project_id,
                projects_table.c.slug == project_id,
            )).values(**values)
            conn.execute(stmt)

        proj = ProjectService.get_project(project_id)

        # Audit logging
        AuditService.record(
            user_id=proj.get("user_id") if proj else None,
            action="project.update",
            details={"project_id": project_id, "updated_fields": list(values.keys())},
        )
        return proj

    @staticmethod
    def delete_project(project_id: str) -> bool:
        with engine.begin() as conn:
            stmt = delete(projects_table).where(or_(
                projects_table.c.id == project_id,
                projects_table.c.slug == project_id,
            ))
            res = conn.execute(stmt)
            return res.rowcount > 0

    @staticmethod
    def has_liked(project_id: str, fingerprint: str) -> bool:
        with engine.connect() as conn:
            stmt = select(votes_table).where(
                votes_table.c.project_id == project_id,
                votes_table.c.voter_fingerprint == fingerprint,
            )
            return conn.execute(stmt).first() is not None

    @staticmethod
    def like_project(project_id: str, fingerprint: Optional[str] = None) -> int:
        with engine.begin() as conn:
            if fingerprint:
                conn.execute(
                    insert(votes_table).values(
                        project_id=project_id,
                        voter_fingerprint=fingerprint,
                    )
                )

            stmt = (
                update(projects_table)
                .where(or_(
                    projects_table.c.id == project_id,
                    projects_table.c.slug == project_id,
                ))
                .values(likes_count=projects_table.c.likes_count + 1)
            )
            conn.execute(stmt)

            fetch_stmt = select(projects_table.c.likes_count).where(or_(
                projects_table.c.id == project_id,
                projects_table.c.slug == project_id,
            ))
            row = conn.execute(fetch_stmt).first()
            return row[0] if row else 0
