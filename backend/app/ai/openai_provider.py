import httpx

from app.ai.provider import AIProvider
from app.core.config import settings


class OpenAIProvider(AIProvider):
    async def generate_reply(self, message: str, history: list[dict[str, str]] | None = None) -> str:
        if not settings.ai_api_key:
            raise RuntimeError("AI service is not configured. Add AI_API_KEY to the backend environment.")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are StudyBuddy, a friendly, patient AI tutor. "
                    "Explain concepts clearly, adapt to the student's level, "
                    "encourage learning, and never be condescending."
                ),
            }
        ]
        messages.extend(history or [])
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.ai_api_key}"},
                json={"model": settings.ai_model, "messages": messages},
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]
