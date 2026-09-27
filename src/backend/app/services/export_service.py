from sqlalchemy import select
from app.db.session import engine
from app.db.models.score import scores_table
from app.db.models.project import projects_table
from app.utils.csv import generate_csv_string

class ExportService:
    @staticmethod
    def generate_results_csv() -> str:
        headers = ["project_id", "title", "track", "team", "judge_id", "functionality", "quality", "comment"]
        with engine.connect() as conn:
            stmt = select(
                scores_table.c.project,
                projects_table.c.title,
                projects_table.c.track,
                projects_table.c.team,
                scores_table.c.judge,
                scores_table.c.criteria,
                scores_table.c.comment,
            ).select_from(
                scores_table.join(projects_table, scores_table.c.project == projects_table.c.id, isouter=True)
            )
            rows = conn.execute(stmt).fetchall()

            data_rows = []
            for r in rows:
                crit = r.criteria or {}
                data_rows.append([
                    r.project,
                    r.title or "",
                    r.track or "",
                    r.team or "",
                    r.judge,
                    crit.get("functionality", ""),
                    crit.get("quality", ""),
                    r.comment or "",
                ])

        return generate_csv_string(headers, data_rows)
