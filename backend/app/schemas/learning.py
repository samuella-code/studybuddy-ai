from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class SubjectResponse(ORMBase):
    id: UUID
    name: str


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=12000)


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    messages: list[ChatMessage]


class QuizGenerateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    topic: str | None = Field(default=None, max_length=160)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    count: int = Field(default=5, ge=1, le=20)


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str] = Field(min_length=2, max_length=6)
    answer: str
    explanation: str


class QuizResponse(BaseModel):
    id: UUID
    subject: str
    topic: str | None
    difficulty: str
    questions: list[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str]


class QuizResultResponse(BaseModel):
    score: int
    total: int
    percentage: int
    feedback: list[str]


class FlashcardCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=160)
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=5000)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")


class FlashcardResponse(ORMBase, FlashcardCreate):
    id: UUID


class FlashcardGenerateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=160)
    count: int = Field(default=10, ge=1, le=30)


class StudyPlanCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    exam_date: date
    daily_minutes: int = Field(ge=10, le=720)
    confidence: str = Field(default="medium", pattern="^(low|medium|high)$")
    topics: list[str] = Field(default_factory=list, max_length=50)


class StudyPlanResponse(ORMBase, StudyPlanCreate):
    id: UUID
    plan: list[dict]


class StudySessionCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    topic: str | None = Field(default=None, max_length=160)
    minutes: int = Field(ge=1, le=1440)


class StudySessionResponse(BaseModel):
    id: UUID
    subject: str
    topic: str | None
    minutes: int
    started_at: str


class ProgressResponse(BaseModel):
    total_minutes: int
    current_streak: int
    quiz_score: int
    quizzes_taken: int
    weak_topics: list[str]
    strong_topics: list[str]
    weekly_activity: dict[str, int]


class MaterialResponse(BaseModel):
    id: UUID
    filename: str
    content_type: str
    characters: int


class MaterialSummaryRequest(BaseModel):
    material_id: UUID
    instruction: str = Field(default="Summarize this study material clearly for a student.", max_length=1000)
