from fastapi import APIRouter

from app.api.routes import auth, chat, learning

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "studybuddy-api"}


api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(learning.router)
