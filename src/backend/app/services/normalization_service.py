from typing import Dict, Any, List, Optional
from sqlalchemy import select, or_
from app.db.session import engine
from app.db.models.score import scores_table
from app.db.models.project import projects_table
from app.db.models.event import events_table

class NormalizationService:
    @staticmethod
    def calculate_empirical_bayes(shrinkage_k: float = 2.0, hackathon_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates Empirical Bayes score calibration with shrinkage factor (k=2.0),
        optionally filtered per hackathon (by event_id or slug)."""
        with engine.connect() as conn:
            # Fetch all events to populate available_hackathons list
            events = conn.execute(select(events_table.c.id, events_table.c.name, events_table.c.slug)).fetchall()
            available_hackathons = [
                {"id": ev.id, "name": ev.name, "slug": ev.slug or ev.id}
                for ev in events
            ]

            target_event = None
            if hackathon_id and hackathon_id != "all":
                for ev in events:
                    if ev.id == hackathon_id or ev.slug == hackathon_id:
                        target_event = ev
                        break

            # Fetch projects and scores
            if target_event:
                # Query projects matching target event
                proj_stmt = select(
                    projects_table.c.id,
                    projects_table.c.title,
                    projects_table.c.team,
                    projects_table.c.track,
                    projects_table.c.track_label,
                ).where(
                    or_(
                        projects_table.c.event_id == target_event.id,
                        projects_table.c.hackathon_id == target_event.id,
                        projects_table.c.hackathon_slug == target_event.slug,
                    )
                )
                projects = conn.execute(proj_stmt).fetchall()
                target_project_ids = {p.id for p in projects}
                project_meta = {p.id: p for p in projects}

                # Query scores for these projects
                if target_project_ids:
                    score_stmt = select(scores_table).where(scores_table.c.project.in_(target_project_ids))
                    scores = conn.execute(score_stmt).fetchall()
                else:
                    scores = []
            else:
                # Global / all hackathons
                proj_stmt = select(
                    projects_table.c.id,
                    projects_table.c.title,
                    projects_table.c.team,
                    projects_table.c.track,
                    projects_table.c.track_label,
                )
                projects = conn.execute(proj_stmt).fetchall()
                project_meta = {p.id: p for p in projects}

                score_stmt = select(scores_table)
                scores = conn.execute(score_stmt).fetchall()

        if not scores:
            return {
                "global_prior_mean": 3.0,
                "shrinkage_k": shrinkage_k,
                "rankings": [],
                "hackathon_id": target_event.id if target_event else None,
                "hackathon_name": target_event.name if target_event else "All Competitions",
                "available_hackathons": available_hackathons,
            }

        # 1. Compute all judge ratings per project
        all_raw_averages = []
        project_scores: Dict[str, List[float]] = {}
        for sc in scores:
            vals = [v for v in (sc.criteria or {}).values() if isinstance(v, (int, float))]
            if vals:
                avg = sum(vals) / len(vals)
                all_raw_averages.append(avg)
                project_scores.setdefault(sc.project, []).append(avg)

        global_mean = sum(all_raw_averages) / len(all_raw_averages) if all_raw_averages else 3.0

        calibrated_results = []
        for proj_id, ratings in project_scores.items():
            n = len(ratings)
            sample_mean = sum(ratings) / n
            # Empirical Bayes shrinkage formula: (n * sample_mean + k * global_mean) / (n + k)
            eb_score = round((n * sample_mean + shrinkage_k * global_mean) / (n + shrinkage_k), 3)
            pinfo = project_meta.get(proj_id)
            calibrated_results.append({
                "project_id": proj_id,
                "project_title": pinfo.title if pinfo else proj_id,
                "team": pinfo.team if pinfo else None,
                "track": (pinfo.track_label or pinfo.track) if pinfo else None,
                "review_count": n,
                "raw_mean": round(sample_mean, 2),
                "calibrated_score": eb_score,
                "shrinkage_delta": round(eb_score - sample_mean, 3),
            })

        calibrated_results.sort(key=lambda x: x["calibrated_score"], reverse=True)
        return {
            "global_prior_mean": round(global_mean, 3),
            "shrinkage_k": shrinkage_k,
            "rankings": calibrated_results,
            "hackathon_id": target_event.id if target_event else None,
            "hackathon_name": target_event.name if target_event else "All Competitions",
            "available_hackathons": available_hackathons,
        }
