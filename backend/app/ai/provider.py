from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def generate_reply(self, message: str, history: list[dict[str, str]] | None = None) -> str:
        """Generate a tutor response from the user's message and conversation history."""
        raise NotImplementedError
