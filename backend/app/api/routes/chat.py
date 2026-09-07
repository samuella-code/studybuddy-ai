from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.factory import get_ai_provider
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: User = Depends(get_current_user)) -> ChatResponse:
    del current_user
    provider = get_ai_provider()
    history = [item.model_dump() for item in payload.history]

    try:
        reply = await provider.generate_reply(payload.message, history)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="StudyBuddy could not reach the AI service right now.",
        ) from exc

    return ChatResponse(message=reply)
