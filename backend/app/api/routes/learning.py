from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.factory import get_ai_provider
from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models import Flashcard, Progress, Quiz, QuizAttempt, StudyMaterial, StudyPlan, StudySession, Subject, User
from app.schemas.learning import (
    FlashcardCreate,
    FlashcardGenerateRequest,
    FlashcardResponse,
    MaterialResponse,
    MaterialSummaryRequest,
    ProgressResponse,
    QuizGenerateRequest,
    QuizResponse,
    QuizResultResponse,
    QuizSubmitRequest,
    StudyPlanCreate,
    StudyPlanResponse,
    StudySessionCreate,
    StudySessionResponse,
    SubjectCreate,
    SubjectResponse,
)

router = APIRouter(tags=["learning"])


def get_progress(db: Session, user_id: UUID) -> Progress:
    progress = db.scalar(select(Progress).where(Progress.user_id == user_id))
    if progress is None:
        progress = Progress(user_id=user_id)
        db.add(progress)
        db.flush()
    return progress


@router.get("/subjects", response_model=list[SubjectResponse])
def list_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Subject).where(Subject.user_id == current_user.id).order_by(Subject.name)).all()


@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.name.strip()
    existing = db.scalar(select(Subject).where(Subject.user_id == current_user.id, Subject.name.ilike(name)))
    if existing:
        return existing
    subject = Subject(user_id=current_user.id, name=name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/progress", response_model=ProgressResponse)
def progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_progress(db, current_user.id)
    db.commit()
    return ProgressResponse(
        total_minutes=item.total_minutes,
        current_streak=item.current_streak,
        quiz_score=item.quiz_score,
        quizzes_taken=item.quizzes_taken,
        weak_topics=item.weak_topics or [],
        strong_topics=item.strong_topics or [],
        weekly_activity=item.weekly_activity or {},
    )


@router.post("/study-sessions", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def create_study_session(payload: StudySessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = StudySession(user_id=current_user.id, subject=payload.subject.strip(), topic=payload.topic, minutes=payload.minutes)
    progress_item = get_progress(db, current_user.id)
    progress_item.total_minutes += payload.minutes
    today = datetime.now(timezone.utc).date().isoformat()
    activity = dict(progress_item.weekly_activity or {})
    activity[today] = int(activity.get(today, 0)) + payload.minutes
    progress_item.weekly_activity = activity
    progress_item.current_streak = max(progress_item.current_streak, 1)
    db.add(session)
    db.commit()
    db.refresh(session)
    return StudySessionResponse(subject=session.subject, topic=session.topic, minutes=session.minutes, id=session.id, started_at=session.started_at.isoformat())


@router.get("/study-history", response_model=list[StudySessionResponse])
def study_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(StudySession).where(StudySession.user_id == current_user.id).order_by(StudySession.started_at.desc()).limit(50)).all()
    return [StudySessionResponse(subject=x.subject, topic=x.topic, minutes=x.minutes, id=x.id, started_at=x.started_at.isoformat()) for x in rows]


@router.post("/quizzes/generate", response_model=QuizResponse)
async def generate_quiz(payload: QuizGenerateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    provider = get_ai_provider()
    instruction = f"Create {payload.count} multiple-choice questions for a student studying {payload.subject}. Topic: {payload.topic or 'mixed topics'}. Difficulty: {payload.difficulty}. Return JSON {{\"questions\":[{{\"id\":\"q1\",\"question\":\"...\",\"options\":[\"...\"],\"answer\":\"exact correct option\",\"explanation\":\"...\"}}]}}. Exactly one option must be correct."
    try:
        data = await provider.generate_json(instruction)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Quiz generation is temporarily unavailable.") from exc
    questions = data.get("questions", [])
    if not isinstance(questions, list) or not questions:
        raise HTTPException(status_code=502, detail="The AI returned an invalid quiz.")
    questions = questions[: payload.count]
    quiz = Quiz(user_id=current_user.id, subject=payload.subject.strip(), topic=payload.topic, difficulty=payload.difficulty, questions=questions)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return QuizResponse(id=quiz.id, subject=quiz.subject, topic=quiz.topic, difficulty=quiz.difficulty, questions=questions)


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz(quiz_id: UUID, payload: QuizSubmitRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.scalar(select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == current_user.id))
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    score = 0
    feedback = []
    for question in quiz.questions:
        selected = payload.answers.get(str(question.get("id")), "")
        correct = str(question.get("answer", ""))
        if selected.strip().lower() == correct.strip().lower():
            score += 1
        else:
            feedback.append(f"{question.get('question', 'Question')}: {question.get('explanation', 'Review this concept again.')}")
    total = len(quiz.questions)
    percentage = round(score / total * 100) if total else 0
    db.add(QuizAttempt(quiz_id=quiz.id, user_id=current_user.id, score=score, total=total, answers=payload.answers))
    progress_item = get_progress(db, current_user.id)
    progress_item.quiz_score = percentage
    progress_item.quizzes_taken += 1
    db.commit()
    return QuizResultResponse(score=score, total=total, percentage=percentage, feedback=feedback)


@router.get("/flashcards", response_model=list[FlashcardResponse])
def list_flashcards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Flashcard).where(Flashcard.user_id == current_user.id).order_by(Flashcard.created_at.desc()).limit(100)).all()


@router.post("/flashcards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(payload: FlashcardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = Flashcard(user_id=current_user.id, **payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.post("/flashcards/generate", response_model=list[FlashcardResponse])
async def generate_flashcards(payload: FlashcardGenerateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    provider = get_ai_provider()
    instruction = f"Create {payload.count} useful study flashcards for {payload.subject}, topic {payload.topic}. Return JSON {{\"flashcards\":[{{\"question\":\"...\",\"answer\":\"...\",\"difficulty\":\"easy|medium|hard\"}}]}}. Keep answers concise but educational."
    try:
        data = await provider.generate_json(instruction)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Flashcard generation is temporarily unavailable.") from exc
    result = []
    for item in data.get("flashcards", [])[: payload.count]:
        card = Flashcard(user_id=current_user.id, subject=payload.subject.strip(), topic=payload.topic.strip(), question=item.get("question", ""), answer=item.get("answer", ""), difficulty=item.get("difficulty", "medium"))
        if card.question and card.answer:
            db.add(card)
            result.append(card)
    db.commit()
    for card in result:
        db.refresh(card)
    return result


@router.post("/study-plans", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_study_plan(payload: StudyPlanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    provider = get_ai_provider()
    topics = ", ".join(payload.topics) if payload.topics else "the most important topics"
    instruction = f"Create a practical study plan for {payload.subject}. Exam date: {payload.exam_date.isoformat()}. Daily study time: {payload.daily_minutes} minutes. Confidence: {payload.confidence}. Topics: {topics}. Return JSON {{\"plan\":[{{\"date\":\"YYYY-MM-DD\",\"minutes\":30,\"topic\":\"...\",\"activity\":\"...\"}}]}}. Use the available days efficiently and include review/practice."
    try:
        data = await provider.generate_json(instruction)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Study plan generation is temporarily unavailable.") from exc
    plan = data.get("plan", [])
    if not isinstance(plan, list):
        raise HTTPException(status_code=502, detail="The AI returned an invalid study plan.")
    item = StudyPlan(user_id=current_user.id, subject=payload.subject.strip(), exam_date=payload.exam_date.isoformat(), daily_minutes=payload.daily_minutes, confidence=payload.confidence, topics=payload.topics, plan=plan)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/study-plans", response_model=list[StudyPlanResponse])
def list_study_plans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(StudyPlan).where(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc())).all()


@router.post("/materials/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = {"text/plain", "application/pdf", "text/markdown"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=415, detail="StudyBuddy currently accepts PDF, TXT, and Markdown files.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    if file.content_type == "application/pdf":
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(data))
            content = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=422, detail="We could not read this PDF.") from exc
    else:
        content = data.decode("utf-8", errors="replace")
    if not content.strip():
        raise HTTPException(status_code=422, detail="The uploaded material contains no readable text.")
    material = StudyMaterial(user_id=current_user.id, filename=file.filename or "study-material", content_type=file.content_type or "text/plain", content=content)
    db.add(material)
    db.commit()
    db.refresh(material)
    return MaterialResponse(id=material.id, filename=material.filename, content_type=material.content_type, characters=len(content))


@router.post("/materials/summarize")
async def summarize_material(payload: MaterialSummaryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    material = db.scalar(select(StudyMaterial).where(StudyMaterial.id == payload.material_id, StudyMaterial.user_id == current_user.id))
    if material is None:
        raise HTTPException(status_code=404, detail="Study material not found")
    provider = get_ai_provider()
    content = material.content[:30000]
    try:
        summary = await provider.generate_reply(payload.instruction + "\n\nStudy material:\n" + content)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="The material could not be processed right now.") from exc
    return {"material_id": material.id, "summary": summary}


@router.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    del current_user
    if file.content_type not in {"audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm", "audio/x-m4a"}:
        raise HTTPException(status_code=415, detail="Unsupported audio format.")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Voice recordings must be 25 MB or smaller.")
    try:
        text = await get_ai_provider().transcribe(data, file.filename or "recording.m4a", file.content_type or "audio/m4a")
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Speech recognition is temporarily unavailable.") from exc
    return {"text": text}
