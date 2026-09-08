from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def generate_reply(self, message: str, history: list[dict[str, str]] | None = None) -> str:
        raise NotImplementedError

    @abstractmethod
    async def generate_json(self, instruction: str) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def transcribe(self, audio: bytes, filename: str, content_type: str) -> str:
        raise NotImplementedError
