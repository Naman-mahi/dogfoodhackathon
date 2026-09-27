from typing import Optional, List
from sqlalchemy import select, insert, update, delete
from app.db.session import engine
from app.db.models.team import teams_table
from app.schemas.team import TeamCreate, TeamUpdate

class TeamService:
    @staticmethod
    def list_teams():
        with engine.connect() as conn:
            stmt = select(teams_table)
            return [dict(r._mapping) for r in conn.execute(stmt).fetchall()]

    @staticmethod
    def get_team(team_id: str):
        with engine.connect() as conn:
            stmt = select(teams_table).where(teams_table.c.id == team_id)
            row = conn.execute(stmt).first()
            return dict(row._mapping) if row else None

    @staticmethod
    def create_team(data: TeamCreate):
        with engine.begin() as conn:
            stmt = insert(teams_table).values(
                id=data.id,
                name=data.name,
                members=data.members,
            )
            conn.execute(stmt)
            return TeamService.get_team(data.id)

    @staticmethod
    def update_team(team_id: str, data: TeamUpdate):
        values = {k: v for k, v in data.model_dump().items() if v is not None}
        if not values:
            return TeamService.get_team(team_id)
        with engine.begin() as conn:
            stmt = update(teams_table).where(teams_table.c.id == team_id).values(**values)
            conn.execute(stmt)
            return TeamService.get_team(team_id)

    @staticmethod
    def delete_team(team_id: str) -> bool:
        with engine.begin() as conn:
            stmt = delete(teams_table).where(teams_table.c.id == team_id)
            res = conn.execute(stmt)
            return res.rowcount > 0
