from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.events import router as events_router
from app.api.v1.teams import router as teams_router
from app.api.v1.projects import router as projects_router
from app.api.v1.judges import router as judges_router
from app.api.v1.rubrics import router as rubrics_router
from app.api.v1.scores import router as scores_router
from app.api.v1.results import router as results_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(teams_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(judges_router)
api_v1_router.include_router(rubrics_router)
api_v1_router.include_router(scores_router)
api_v1_router.include_router(results_router)
api_v1_router.include_router(admin_router)

# Provide clean REST alias for /hackathons -> /events
hackathons_router = APIRouter(prefix="/hackathons", tags=["Hackathons"])
hackathons_router.include_router(events_router, prefix="")
api_v1_router.include_router(hackathons_router)
