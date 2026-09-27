import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, insert, update, delete, or_
from app.db.session import engine
from app.db.models.project import projects_table
from app.db.models.event import events_table
from app.db.models.user import users_table, sessions_table
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.event_service import EventService
from app.services.email_service import EmailService
from app.core.exceptions import DeadlineExpiredException

class ProjectService:
    @staticmethod
    def list_projects(
        track: Optional[str] = None,
        hackathon: Optional[str] = None,
        search: Optional[str] = None,
        featured: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        with engine.connect() as conn:
            stmt = select(projects_table)
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
            stmt = stmt.order_by(projects_table.c.submitted_at.desc()).limit(limit).offset(offset)
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
        if EventService.is_event_closed(event_target):
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
                submitted_at=submitted_at,
            )
            conn.execute(stmt)

            if evt:
                conn.execute(
                    update(events_table)
                    .where(events_table.c.id == event_id)
                    .values(submission_count=events_table.c.submission_count + 1)
                )

        proj = ProjectService.get_project(new_id)

        # Dispatch submission confirmation email to submitter
        try:
            submitter_email = None
            if user_id:
                with engine.connect() as conn:
                    # check users_table
                    u_row = conn.execute(select(users_table.c.email).where(users_table.c.id == user_id)).mappings().first()
                    if u_row:
                        submitter_email = u_row.get("email")
                    else:
                        # check sessions_table
                        s_row = conn.execute(select(sessions_table.c.user_email).where(sessions_table.c.user_id == user_id)).mappings().first()
                        if s_row:
                            submitter_email = s_row.get("user_email")

            if submitter_email and proj:
                EmailService.send_submission_email(
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
        return ProjectService.get_project(project_id)

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
    def like_project(project_id: str) -> Optional[int]:
        with engine.begin() as conn:
            stmt = update(projects_table).where(or_(
                projects_table.c.id == project_id,
                projects_table.c.slug == project_id,
            )).values(likes_count=projects_table.c.likes_count + 1).returning(projects_table.c.likes_count)
            count = conn.execute(stmt).scalar()
            return count
