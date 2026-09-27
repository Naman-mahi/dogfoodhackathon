from typing import Dict, Any, List
from sqlalchemy import select
from app.db.session import engine
from app.db.models.score import scores_table
from app.core.config import settings

class NormalizationService:
    @staticmethod
    def calculate_empirical_bayes(shrinkage_k: float = 2.0) -> Dict[str, Any]:
        """Calculates Empirical Bayes score calibration with shrinkage factor (k=2.0)."""
        with engine.connect() as conn:
            stmt = select(scores_table)
            scores = conn.execute(stmt).fetchall()

        if not scores:
            return {"global_prior_mean": 3.0, "shrinkage_k": shrinkage_k, "rankings": []}

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
            calibrated_results.append({
                "project_id": proj_id,
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
        }
