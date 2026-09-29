from typing import Optional, List, Dict, Any
from sqlalchemy import select, insert, update, delete
from app.db.session import engine
from app.db.models.score import scores_table
from app.db.models.judge import judges_table
from app.db.models.rubric import rubrics_table
from app.schemas.judge import JudgeCreate, JudgeUpdate
from app.schemas.rubric import RubricCreate, RubricUpdate
from app.schemas.score import ScoreCreate, ScoreUpdate
from app.core.exceptions import PeerIsolationViolationException, ForbiddenException

class JudgingService:
    # --- Judges CRUD ---
    @staticmethod
    def list_judges():
        with engine.connect() as conn:
            stmt = select(judges_table)
            return [dict(r._mapping) for r in conn.execute(stmt).fetchall()]

    @staticmethod
    def get_judge(judge_id: str):
        with engine.connect() as conn:
            stmt = select(judges_table).where(judges_table.c.id == judge_id)
            row = conn.execute(stmt).first()
            return dict(row._mapping) if row else None

    @staticmethod
    def create_judge(data: JudgeCreate):
        import secrets
        from app.db.models.user import users_table
        from app.core.security import hash_password

        raw_password = data.password.strip() if data.password and data.password.strip() else f"Judge_{secrets.token_urlsafe(6)}!"
        hashed = hash_password(raw_password)

        with engine.begin() as conn:
            # 1. Upsert / register in users_table so judge can immediately log in
            existing_user = conn.execute(
                select(users_table).where(
                    (users_table.c.email == data.email) | (users_table.c.id == data.id)
                )
            ).first()

            if existing_user:
                conn.execute(
                    update(users_table)
                    .where(users_table.c.id == existing_user.id)
                    .values(
                        name=data.name,
                        email=data.email,
                        role="judge",
                        hashed_password=hashed,
                    )
                )
            else:
                conn.execute(
                    insert(users_table).values(
                        id=data.id,
                        name=data.name,
                        email=data.email,
                        role="judge",
                        hashed_password=hashed,
                        avatar_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={data.email}",
                    )
                )

            # 2. Upsert in judges_table
            existing_judge = conn.execute(
                select(judges_table).where(judges_table.c.id == data.id)
            ).first()

            if existing_judge:
                conn.execute(
                    update(judges_table)
                    .where(judges_table.c.id == data.id)
                    .values(
                        name=data.name,
                        email=data.email,
                        tracks=data.tracks or [],
                    )
                )
            else:
                conn.execute(
                    insert(judges_table).values(
                        id=data.id,
                        name=data.name,
                        email=data.email,
                        tracks=data.tracks or [],
                    )
                )

        res = JudgingService.get_judge(data.id)
        if res:
            res["initial_password"] = raw_password
        return res

    @staticmethod
    def update_judge(judge_id: str, data: JudgeUpdate):
        values = {k: v for k, v in data.model_dump().items() if v is not None}
        if not values:
            return JudgingService.get_judge(judge_id)
        with engine.begin() as conn:
            stmt = update(judges_table).where(judges_table.c.id == judge_id).values(**values)
            conn.execute(stmt)
        return JudgingService.get_judge(judge_id)

    @staticmethod
    def delete_judge(judge_id: str) -> bool:
        with engine.begin() as conn:
            stmt = delete(judges_table).where(judges_table.c.id == judge_id)
            res = conn.execute(stmt)
            return res.rowcount > 0

    # --- Rubrics CRUD ---
    @staticmethod
    def list_rubrics(event_id: str = "evt_01"):
        with engine.connect() as conn:
            stmt = select(rubrics_table).where(rubrics_table.c.event_id == event_id)
            return [dict(r._mapping) for r in conn.execute(stmt).fetchall()]

    @staticmethod
    def create_rubric(data: RubricCreate):
        with engine.begin() as conn:
            stmt = insert(rubrics_table).values(
                event_id=data.event_id,
                criterion_name=data.criterion_name,
                weight=data.weight,
                max_score=data.max_score,
                description=data.description,
            ).returning(rubrics_table.c.id)
            new_id = conn.execute(stmt).scalar()
            return {**data.model_dump(), "id": new_id}

    @staticmethod
    def update_rubric(rubric_id: int, data: RubricUpdate):
        values = {k: v for k, v in data.model_dump().items() if v is not None}
        with engine.begin() as conn:
            if values:
                stmt = update(rubrics_table).where(rubrics_table.c.id == rubric_id).values(**values).returning(rubrics_table)
                res = conn.execute(stmt).fetchone()
                return dict(res._mapping) if res else None
            stmt = select(rubrics_table).where(rubrics_table.c.id == rubric_id)
            row = conn.execute(stmt).fetchone()
            return dict(row._mapping) if row else None

    # --- Scores CRUD & Zero-Trust Peer Isolation ---
    @staticmethod
    def get_scores_for_judge(authenticated_judge_id: str, requested_judge_id: Optional[str] = None, is_organizer: bool = False):
        # Strict zero-trust peer isolation enforcement:
        if requested_judge_id and requested_judge_id != authenticated_judge_id and not is_organizer:
            raise PeerIsolationViolationException(
                "Zero-trust peer isolation barrier: you are not permitted to inspect another judge's evaluation records."
            )

        with engine.connect() as conn:
            if is_organizer and (not requested_judge_id or requested_judge_id == "all"):
                stmt = select(scores_table)
            else:
                target_judge = requested_judge_id if (is_organizer and requested_judge_id) else authenticated_judge_id
                stmt = select(scores_table).where(scores_table.c.judge == target_judge)
            rows = conn.execute(stmt).fetchall()
            return [
                {
                    "id": getattr(r, "id", None),
                    "judge": r.judge,
                    "project": r.project,
                    "criteria": r.criteria,
                    "comment": r.comment,
                }
                for r in rows
            ]

    @staticmethod
    def get_evaluation_progress(authenticated_user_id: str, is_organizer: bool = False) -> Dict[str, Any]:
        """
        Dynamically calculates evaluation progress across all judges and submissions.
        Organizers and Admins can see full progress for all evaluators;
        Judges only see their own queue and evaluated progress (preserving peer isolation).
        """
        from app.db.models.project import projects_table

        with engine.connect() as conn:
            # 1. Fetch judges
            if is_organizer:
                judges_rows = conn.execute(select(judges_table)).fetchall()
            else:
                judges_rows = conn.execute(
                    select(judges_table).where(judges_table.c.id == authenticated_user_id)
                ).fetchall()
                if not judges_rows:
                    judges_rows = conn.execute(
                        select(judges_table).where(judges_table.c.email.like(f"%{authenticated_user_id}%"))
                    ).fetchall()

            # 2. Fetch all active projects
            projects_rows = conn.execute(select(projects_table)).fetchall()
            all_projects = [dict(r._mapping) for r in projects_rows]

            # 3. Fetch scores
            if is_organizer:
                scores_rows = conn.execute(select(scores_table)).fetchall()
            else:
                scores_rows = conn.execute(
                    select(scores_table).where(scores_table.c.judge == authenticated_user_id)
                ).fetchall()
            all_scores = [dict(r._mapping) for r in scores_rows]

        # Group scores by judge: { judge_id: { project_id: score_record } }
        scores_by_judge: Dict[str, Dict[str, Dict[str, Any]]] = {}
        for s in all_scores:
            jid = s.get("judge") or ""
            pid = s.get("project") or ""
            if jid not in scores_by_judge:
                scores_by_judge[jid] = {}
            scores_by_judge[jid][pid] = s

        # Project lookup by id and slug
        project_by_id = {p["id"]: p for p in all_projects}
        for p in all_projects:
            if p.get("slug"):
                project_by_id[p["slug"]] = p

        judge_progress_list = []
        total_evaluations_assigned = 0
        total_evaluations_completed = 0

        for j in judges_rows:
            jid = j.id
            jname = j.name
            jemail = j.email
            assigned_tracks = j.tracks or []

            # Determine candidate projects for this judge
            if not assigned_tracks or "all" in [t.lower() for t in assigned_tracks]:
                candidate_projects = all_projects
            else:
                tracks_lower = [t.lower() for t in assigned_tracks]
                candidate_projects = [
                    p for p in all_projects
                    if any(
                        t in (p.get("track") or "").lower() or
                        t in (p.get("track_label") or "").lower()
                        for t in tracks_lower
                    )
                ]

            judge_scores = scores_by_judge.get(jid, {})

            # Scored projects
            scored_items = []
            scored_project_ids = set()
            for pid, s in judge_scores.items():
                proj = project_by_id.get(pid)
                criteria = s.get("criteria") or {}
                avg_score = 0.0
                if isinstance(criteria, dict) and criteria:
                    numeric_vals = [float(v) for v in criteria.values() if isinstance(v, (int, float))]
                    if numeric_vals:
                        avg_score = round(sum(numeric_vals) / len(numeric_vals), 1)

                scored_items.append({
                    "project_id": pid,
                    "project_title": proj.get("title") if proj else pid,
                    "track": proj.get("track_label") or proj.get("track") or "General",
                    "team": proj.get("team") if proj else "Unknown",
                    "average_score": avg_score,
                    "criteria": criteria,
                    "comment": s.get("comment") or "",
                    "scored_at": s.get("created_at").isoformat() if s.get("created_at") else None,
                })
                scored_project_ids.add(pid)
                if proj and proj.get("slug"):
                    scored_project_ids.add(proj["slug"])

            # Pending projects
            pending_items = []
            for p in candidate_projects:
                if p["id"] not in scored_project_ids and (not p.get("slug") or p["slug"] not in scored_project_ids):
                    pending_items.append({
                        "project_id": p["id"],
                        "project_title": p.get("title") or p["id"],
                        "track": p.get("track_label") or p.get("track") or "General",
                        "team": p.get("team") or "Unknown",
                    })

            total_assigned = len(candidate_projects)
            total_scored = len(scored_items)

            total_evaluations_assigned += total_assigned
            total_evaluations_completed += total_scored

            progress_pct = round((total_scored / total_assigned) * 100) if total_assigned > 0 else (100 if total_scored > 0 else 0)
            if progress_pct > 100:
                progress_pct = 100

            if total_assigned > 0 and total_scored >= total_assigned:
                status = "Completed"
            elif total_scored > 0:
                status = "In Progress"
            else:
                status = "Not Started"

            judge_progress_list.append({
                "id": jid,
                "name": jname,
                "email": jemail,
                "tracks": assigned_tracks,
                "total_assigned": total_assigned,
                "total_scored": total_scored,
                "progress_percentage": progress_pct,
                "status": status,
                "scored_projects": scored_items,
                "pending_projects": pending_items,
            })

        overall_rate = round((total_evaluations_completed / total_evaluations_assigned) * 100) if total_evaluations_assigned > 0 else 0
        if overall_rate > 100:
            overall_rate = 100

        return {
            "summary": {
                "total_judges": len(judges_rows),
                "total_projects": len(all_projects),
                "total_evaluations_submitted": len(all_scores),
                "total_evaluations_assigned": total_evaluations_assigned,
                "overall_completion_rate": overall_rate,
                "completed_judges_count": len([j for j in judge_progress_list if j["status"] == "Completed"]),
                "in_progress_judges_count": len([j for j in judge_progress_list if j["status"] == "In Progress"]),
                "not_started_judges_count": len([j for j in judge_progress_list if j["status"] == "Not Started"]),
            },
            "judges": judge_progress_list,
        }

    @staticmethod
    def create_score(data: ScoreCreate, judge_id: str):
        from app.services.audit_service import AuditService
        final_judge_id = judge_id or data.judge or "judge"
        with engine.begin() as conn:
            existing = conn.execute(
                select(scores_table.c.id).where(
                    scores_table.c.judge == final_judge_id,
                    scores_table.c.project == data.project,
                )
            ).scalar()

            if existing:
                stmt = (
                    update(scores_table)
                    .where(scores_table.c.id == existing)
                    .values(
                        criteria=data.criteria,
                        comment=data.comment or "",
                    )
                    .returning(scores_table.c.id)
                )
                new_id = conn.execute(stmt).scalar()
            else:
                stmt = insert(scores_table).values(
                    judge=final_judge_id,
                    project=data.project,
                    criteria=data.criteria,
                    comment=data.comment or "",
                ).returning(scores_table.c.id)
                new_id = conn.execute(stmt).scalar()

        AuditService.record(
            user_id=final_judge_id,
            action="score.submitted",
            details={"project_id": data.project, "judge": final_judge_id, "score_id": new_id},
        )
        return {**data.model_dump(), "id": new_id, "judge": final_judge_id}

    @staticmethod
    def auto_assign_judges_round_robin(event_id: str = "evt_01", judges_per_track: int = 2) -> Dict[str, Any]:
        """Algorithmic round-robin assignment of available judges across all event tracks."""
        from app.db.models.track import tracks_table
        from app.services.audit_service import AuditService

        with engine.connect() as conn:
            judges = conn.execute(select(judges_table)).fetchall()
            tracks = conn.execute(select(tracks_table).where(tracks_table.c.event_id == event_id)).fetchall()

        if not judges:
            return {"success": False, "message": "No judges registered to assign"}
        if not tracks:
            # Fallback to all tracks
            with engine.connect() as conn:
                tracks = conn.execute(select(tracks_table)).fetchall()

        if not tracks:
            return {"success": False, "message": "No tracks found"}

        judge_ids = [j.id for j in judges]
        track_ids = [t.id for t in tracks]
        judge_track_map: Dict[str, List[str]] = {jid: [] for jid in judge_ids}

        for i, trk in enumerate(track_ids):
            for k in range(min(judges_per_track, len(judge_ids))):
                assigned_judge = judge_ids[(i + k) % len(judge_ids)]
                if trk not in judge_track_map[assigned_judge]:
                    judge_track_map[assigned_judge].append(trk)

        with engine.begin() as conn:
            for jid, trks in judge_track_map.items():
                conn.execute(
                    update(judges_table)
                    .where(judges_table.c.id == jid)
                    .values(tracks=trks)
                )

        AuditService.record(
            user_id="organizer",
            action="judge.auto_assign",
            details={"event_id": event_id, "assignments": judge_track_map},
        )

        return {
            "success": True,
            "message": f"Successfully auto-assigned {len(judge_ids)} judges across {len(track_ids)} tracks.",
            "assignments": judge_track_map,
        }
