import json

import httpx

from app.ai.provider import AIProvider
from app.core.config import settings


class OpenAIProvider(AIProvider):
    base_url = "https://api.openai.com/v1"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {settings.ai_api_key}",
            "Content-Type": "application/json",
        }

    def _require_key(self) -> None:
        if not settings.ai_api_key:
            raise RuntimeError("AI service is not configured. Add AI_API_KEY to the backend environment.")

    async def _responses(self, payload: dict) -> dict:
        self._require_key()
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(f"{self.base_url}/responses", headers=self._headers(), json=payload)
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _output_text(data: dict) -> str:
        text = data.get("output_text")
        if isinstance(text, str) and text.strip():
            return text.strip()
        for output_item in data.get("output", []):
            for content_item in output_item.get("content", []):
                text = content_item.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()
        raise RuntimeError("The AI service returned an empty response.")

    async def generate_reply(self, message: str, history: list[dict[str, str]] | None = None) -> str:
        input_items = [
            {
                "role": "system",
                "content": (
                    "You are StudyBuddy, a friendly, patient, voice-first AI tutor. "
                    "Teach with clarity, adapt to the student's level, use examples and analogies, "
                    "ask useful follow-up questions, encourage active recall, and never be condescending. "
                    "When the student asks to quiz, switch naturally into quiz mode. "
                    "When they say they do not understand, simplify the explanation. "
                    "Never invent curriculum requirements that were not provided."
                ),
            }
        ]
        input_items.extend(history or [])
        input_items.append({"role": "user", "content": message})
        data = await self._responses({"model": settings.ai_model, "input": input_items})
        return self._output_text(data)

    async def generate_json(self, instruction: str) -> dict:
        data = await self._responses({
            "model": settings.ai_model,
            "input": [
                {
                    "role": "system",
                    "content": "Return only valid JSON. No markdown fences. You are a careful educational content generator.",
                },
                {"role": "user", "content": instruction},
            ],
            "text": {"format": {"type": "json_object"}},
        })
        text = self._output_text(data)
        try:
            result = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError("The AI service returned invalid JSON.") from exc
        if not isinstance(result, dict):
            raise RuntimeError("The AI service returned an invalid structured response.")
        return result

    async def transcribe(self, audio: bytes, filename: str, content_type: str) -> str:
        self._require_key()
        files = {"file": (filename, audio, content_type)}
        data = {"model": "whisper-1"}
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.base_url}/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.ai_api_key}"},
                data=data,
                files=files,
            )
            response.raise_for_status()
            result = response.json()
        text = result.get("text")
        if not isinstance(text, str) or not text.strip():
            raise RuntimeError("No speech was detected in the recording.")
        return text.strip()
