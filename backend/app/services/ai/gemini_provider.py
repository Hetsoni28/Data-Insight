"""Google Gemini LLM provider implementation."""

from __future__ import annotations

import time
import logging
from typing import AsyncIterator, Optional, Dict, Any
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.services.ai.base import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Deep analytical provider powered by Google Gemini models with 1M+ context."""

    provider_name: str = "gemini"
    default_model: str = "gemini-2.0-flash"

    # Pricing per 1M tokens in USD
    PRICING: Dict[str, Dict[str, float]] = {
        "gemini-2.0-flash": {"prompt": 0.10, "completion": 0.40},
        "gemini-1.5-pro": {"prompt": 1.25, "completion": 5.00},
        "gemini-1.5-flash": {"prompt": 0.075, "completion": 0.30},
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self._client: Optional[genai.Client] = None
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"[GeminiProvider] Failed to initialize Gemini client: {e}")

    def is_available(self) -> bool:
        return bool(self.api_key and self._client)

    def _get_client(self) -> genai.Client:
        if not self._client:
            if not self.api_key:
                raise AIServiceException("GEMINI_API_KEY is not configured.")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        json_mode: bool = False,
        model: Optional[str] = None,
    ) -> LLMResponse:
        client = self._get_client()
        target_model = model or settings.GEMINI_DEFAULT_MODEL or self.default_model

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json" if json_mode else None,
            system_instruction=system_instruction,
        )

        start_time = time.perf_counter()
        try:
            # Call async client
            resp = await client.aio.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            content = resp.text or ""
            usage = getattr(resp, "usage_metadata", None)
            prompt_tokens = getattr(usage, "prompt_token_count", 0) if usage else int(len(prompt) / 4)
            completion_tokens = getattr(usage, "candidates_token_count", 0) if usage else int(len(content) / 4)
            total_tokens = getattr(usage, "total_token_count", prompt_tokens + completion_tokens) if usage else (prompt_tokens + completion_tokens)

            cost = self.calculate_cost(target_model, prompt_tokens, completion_tokens)

            return LLMResponse(
                content=content,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost_usd=cost,
                latency_ms=round(latency_ms, 2),
                provider=self.provider_name,
                model=target_model,
            )
        except Exception as e:
            logger.error(f"[GeminiProvider] Generation failed: {e}")
            raise AIServiceException(f"Gemini generation failed: {str(e)}")

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        model: Optional[str] = None,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        target_model = model or settings.GEMINI_DEFAULT_MODEL or self.default_model

        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction,
        )

        try:
            stream = await client.aio.models.generate_content_stream(
                model=target_model,
                contents=prompt,
                config=config,
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"[GeminiProvider] Streaming failed: {e}")
            raise AIServiceException(f"Gemini streaming failed: {str(e)}")
