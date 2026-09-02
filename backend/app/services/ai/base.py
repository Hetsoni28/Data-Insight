"""Base abstraction for LLM providers in Data Insight."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider."""

    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: float
    provider: str
    model: str
    raw_response: dict[str, Any] | None = None


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers (Groq, Gemini, OpenAI, etc.)."""

    provider_name: str = "base"

    # Pricing per 1M tokens in USD
    PRICING: dict[str, dict[str, float]] = {}

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        json_mode: bool = False,
        model: str | None = None,
    ) -> LLMResponse:
        """Generate a complete response from the LLM."""

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        model: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream response tokens from the LLM asynchronously."""

    def calculate_cost(
        self, model: str, prompt_tokens: int, completion_tokens: int,
    ) -> float:
        """Calculate call cost in USD based on model pricing per 1M tokens."""
        pricing = self.PRICING.get(model, {"prompt": 0.0, "completion": 0.0})
        prompt_cost = (prompt_tokens / 1_000_000.0) * pricing.get("prompt", 0.0)
        completion_cost = (completion_tokens / 1_000_000.0) * pricing.get(
            "completion", 0.0,
        )
        return round(prompt_cost + completion_cost, 7)

    @abstractmethod
    def is_available(self) -> bool:
        """Check whether the provider has valid credentials and is ready."""
