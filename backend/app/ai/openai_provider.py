import httpx

from app.ai.provider import AIProvider
from app.core.config import settings


class OpenAIProvider(AIProvider):
    async def generate_reply(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        if not settings.ai_api_key:
            raise RuntimeError("AI service is not configured. Add AI_API_KEY to the backend environment.")

        input_items = [
            {
                "role": "system",
                "content": (
                    "You are StudyBuddy, a friendly, patient AI tutor. "
                    "Explain concepts clearly, adapt to the student's level, "
                    "use examples when useful, encourage active learning, and "
                    "never be condescending. Do not pretend to know a student's "
                    "school curriculum when it has not been provided."
                ),
            }
        ]
        input_items.extend(history or [])
        input_items.append({"role": "user", "content": message})

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.ai_api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": settings.ai_model, "input": input_items},
            )
            response.raise_for_status()
            data = response.json()

        text = data.get("output_text")
        if isinstance(text, str) and text.strip():
            return text.strip()

        for output_item in data.get("output", []):
            for content_item in output_item.get("content", []):
                text = content_item.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()

        raise RuntimeError("The AI service returned an empty response.")
