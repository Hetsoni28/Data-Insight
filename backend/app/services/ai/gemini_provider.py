"""Google Gemini LLM provider implementation."""

from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.services.ai.base import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Deep analytical provider powered by Google Gemini models with 1M+ context."""

    provider_name: str = "gemini"
    default_model: str = "gemini-2.5-flash"

    # Model fallback chain — tried in order on 503/quota errors
    FALLBACK_MODELS: list[str] = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]

    # Pricing per 1M tokens in USD
    PRICING: dict[str, dict[str, float]] = {
        "gemini-2.5-flash": {"prompt": 0.075, "completion": 0.30},
        "gemini-2.5-flash-lite": {"prompt": 0.04, "completion": 0.15},
        "gemini-2.0-flash": {"prompt": 0.10, "completion": 0.40},
        "gemini-1.5-pro": {"prompt": 1.25, "completion": 5.00},
        "gemini-1.5-flash": {"prompt": 0.075, "completion": 0.30},
    }

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self._client: genai.Client | None = None
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(
                    f"[GeminiProvider] Failed to initialize Gemini client: {e}",
                )

    def is_available(self) -> bool:
        return bool(self.api_key and self._client)

    def _get_client(self) -> genai.Client:
        if not self._client:
            if not self.api_key:
                raise AIServiceException("GEMINI_API_KEY is not configured.")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def _is_retriable(self, err_str: str) -> bool:
        """Return True if the error is a transient quota/overload error worth retrying on a lighter model."""
        lower = err_str.lower()
        return (
            "503" in err_str
            or "UNAVAILABLE" in err_str
            or "exhausted" in lower
            or "quota" in lower
            or "resource_exhausted" in lower
            or "429" in err_str
            or "rate" in lower
        )

    def _models_to_try(self, requested_model: str | None) -> list[str]:
        """Build ordered list of models to attempt: requested first, then fallbacks."""
        target = requested_model or settings.GEMINI_DEFAULT_MODEL or self.default_model
        chain = [target]
        for m in self.FALLBACK_MODELS:
            if m != target:
                chain.append(m)
        return chain

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        json_mode: bool = False,
        model: str | None = None,
    ) -> LLMResponse:
        client = self._get_client()
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json" if json_mode else None,
            system_instruction=system_instruction,
        )

        start_time = time.perf_counter()
        last_error: Exception | None = None

        for trial_model in self._models_to_try(model):
            try:
                resp = await client.aio.models.generate_content(
                    model=trial_model,
                    contents=prompt,
                    config=config,
                )
                latency_ms = (time.perf_counter() - start_time) * 1000.0
                content = resp.text or ""
                usage = getattr(resp, "usage_metadata", None)
                prompt_tokens = (
                    getattr(usage, "prompt_token_count", 0) if usage else int(len(prompt) / 4)
                )
                completion_tokens = (
                    getattr(usage, "candidates_token_count", 0) if usage else int(len(content) / 4)
                )
                total_tokens = (
                    getattr(usage, "total_token_count", prompt_tokens + completion_tokens)
                    if usage
                    else (prompt_tokens + completion_tokens)
                )
                cost = self.calculate_cost(trial_model, prompt_tokens, completion_tokens)
                return LLMResponse(
                    content=content,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost,
                    latency_ms=round(latency_ms, 2),
                    provider=self.provider_name,
                    model=trial_model,
                )
            except Exception as e:
                err_str = str(e)
                logger.warning(f"[GeminiProvider] Model {trial_model} failed: {err_str[:200]}")
                last_error = e
                if self._is_retriable(err_str):
                    logger.info("[GeminiProvider] Retriable error — trying next model in chain")
                    continue
                break  # Non-retriable — stop immediately

        logger.error(f"[GeminiProvider] All models exhausted. Last error: {last_error}")
        raise AIServiceException(f"Gemini generation failed: {last_error!s}")

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        model: str | None = None,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction,
        )

        last_error: Exception | None = None
        for trial_model in self._models_to_try(model):
            try:
                stream = await client.aio.models.generate_content_stream(
                    model=trial_model,
                    contents=prompt,
                    config=config,
                )
                async for chunk in stream:
                    if chunk.text:
                        yield chunk.text
                return  # Success — stop trying models
            except Exception as e:
                err_str = str(e)
                logger.warning(f"[GeminiProvider] Streaming model {trial_model} failed: {err_str[:200]}")
                last_error = e
                if self._is_retriable(err_str):
                    logger.info("[GeminiProvider] Retriable streaming error — trying next model")
                    continue
                break

        logger.error(f"[GeminiProvider] All streaming models exhausted. Last error: {last_error}")
        raise AIServiceException(f"Gemini streaming failed: {last_error!s}")
