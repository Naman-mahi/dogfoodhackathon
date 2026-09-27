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
        with engine.begin() as conn:
            stmt = insert(judges_table).values(
                id=data.id,
                name=data.name,
                email=data.email,
                tracks=data.tracks,
            )
            conn.execute(stmt)
            return JudgingService.get_judge(data.id)

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

    # --- Scores CRUD & Zero-Trust Peer Isolation ---
    @staticmethod
    def get_scores_for_judge(authenticated_judge_id: str, requested_judge_id: Optional[str] = None, is_organizer: bool = False):
        # Strict zero-trust peer isolation enforcement:
        if requested_judge_id and requested_judge_id != authenticated_judge_id and not is_organizer:
            raise PeerIsolationViolationException(
                "Zero-trust peer isolation barrier: you are not permitted to inspect another judge's evaluation records."
            )

        target_judge = requested_judge_id if (is_organizer and requested_judge_id) else authenticated_judge_id

        with engine.connect() as conn:
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
    def create_score(data: ScoreCreate, judge_id: str):
        with engine.begin() as conn:
            stmt = insert(scores_table).values(
                judge=judge_id,
                project=data.project,
                criteria=data.criteria,
                comment=data.comment or "",
            ).returning(scores_table.c.id)
            new_id = conn.execute(stmt).scalar()
            return {**data.model_dump(), "id": new_id, "judge": judge_id}
