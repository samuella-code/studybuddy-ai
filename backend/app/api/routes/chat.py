from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models import Conversation, Message, User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChatResponse:
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    provider = get_ai_provider()
    history = [item.model_dump() for item in payload.history][-30:]

    try:
        reply = await provider.generate_reply(payload.message.strip(), history)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="StudyBuddy could not reach the AI service right now.") from exc

    conversation = db.scalar(
        select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).limit(1)
    )
    if conversation is None:
        conversation = Conversation(user_id=current_user.id, title=payload.message.strip()[:80] or "Study session")
        db.add(conversation)
        db.flush()

    db.add(Message(conversation_id=conversation.id, user_id=current_user.id, role="user", content=payload.message.strip()))
    db.add(Message(conversation_id=conversation.id, user_id=current_user.id, role="assistant", content=reply))
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()

    return ChatResponse(message=reply)


@router.get("/history")
def chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.scalars(select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).limit(20)).all()
    result = []
    for conversation in conversations:
        messages = db.scalars(select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)).all()
        result.append({
            "id": str(conversation.id),
            "title": conversation.title,
            "messages": [{"role": item.role, "content": item.content} for item in messages],
        })
    return result
