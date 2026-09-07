from app.ai.openai_provider import OpenAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings


def get_ai_provider() -> AIProvider:
    if settings.ai_provider.lower() == "openai":
        return OpenAIProvider()
    raise RuntimeError(f"Unsupported AI provider: {settings.ai_provider}")
