from fastapi import APIRouter, Depends, Response
from app.api.deps import require_organizer, get_current_user
from app.services.normalization_service import NormalizationService
from app.services.export_service import ExportService
from app.schemas.score import CalibrationResultOut

router = APIRouter(prefix="/results", tags=["results"])

@router.get("/calibrated", response_model=CalibrationResultOut)
def get_calibrated_results(
    shrinkage_k: float = 2.0,
    hackathon: str = None,
    current_user = Depends(get_current_user)
):
    return NormalizationService.calculate_empirical_bayes(shrinkage_k=shrinkage_k, hackathon_id=hackathon)

@router.get("/export.csv")
def export_results_csv(current_user = Depends(get_current_user)):
    csv_data = ExportService.generate_results_csv()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=results.csv"})
