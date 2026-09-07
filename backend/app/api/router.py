from fastapi import APIRouter

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "studybuddy-api"}
