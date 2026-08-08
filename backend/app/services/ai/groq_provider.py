"""Groq LPU ultra-high-speed LLM provider implementation."""

from __future__ import annotations

import time
import logging
from typing import AsyncIterator, Optional, Dict, Any, List
from groq import AsyncGroq

from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.services.ai.base import BaseLLMProvider, LLMResponse

logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):
    """Ultra-low latency inference provider powered by Groq LPUs."""

    provider_name: str = "groq"
    default_model: str = "llama-3.3-70b-versatile"

    # Pricing per 1M tokens in USD
    PRICING: Dict[str, Dict[str, float]] = {
        "llama-3.3-70b-versatile": {"prompt": 0.59, "completion": 0.79},
        "deepseek-r1-distill-llama-70b": {"prompt": 0.59, "completion": 0.79},
        "llama-3.1-8b-instant": {"prompt": 0.05, "completion": 0.08},
        "mixtral-8x7b-32768": {"prompt": 0.24, "completion": 0.24},
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self._client: Optional[AsyncGroq] = None
        if self.api_key:
            try:
                self._client = AsyncGroq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"[GroqProvider] Failed to initialize Groq client: {e}")

    def is_available(self) -> bool:
        return bool(self.api_key and self._client)

    def _get_client(self) -> AsyncGroq:
        if not self._client:
            if not self.api_key:
                raise AIServiceException("GROQ_API_KEY is not configured.")
            self._client = AsyncGroq(api_key=self.api_key)
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
        target_model = model or settings.GROQ_DEFAULT_MODEL or self.default_model

        messages: List[Dict[str, str]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        response_format = {"type": "json_object"} if json_mode else None

        start_time = time.perf_counter()
        try:
            kwargs: Dict[str, Any] = {
                "model": target_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format:
                kwargs["response_format"] = response_format

            resp = await client.chat.completions.create(**kwargs)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            content = resp.choices[0].message.content or ""
            usage = resp.usage
            prompt_tokens = usage.prompt_tokens if usage else int(len(prompt) / 4)
            completion_tokens = usage.completion_tokens if usage else int(len(content) / 4)
            total_tokens = usage.total_tokens if usage else (prompt_tokens + completion_tokens)

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
            err_str = str(e)
            # Automatic fallback to llama-3.1-8b-instant on rate limits
            if ("429" in err_str or "rate_limit" in err_str.lower()) and target_model != "llama-3.1-8b-instant":
                logger.warning(f"[GroqProvider] {target_model} rate limited. Falling back to llama-3.1-8b-instant...")
                try:
                    kwargs["model"] = "llama-3.1-8b-instant"
                    resp = await client.chat.completions.create(**kwargs)
                    latency_ms = (time.perf_counter() - start_time) * 1000.0
                    content = resp.choices[0].message.content or ""
                    usage = resp.usage
                    prompt_tokens = usage.prompt_tokens if usage else int(len(prompt) / 4)
                    completion_tokens = usage.completion_tokens if usage else int(len(content) / 4)
                    return LLMResponse(
                        content=content,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=prompt_tokens + completion_tokens,
                        cost_usd=self.calculate_cost("llama-3.1-8b-instant", prompt_tokens, completion_tokens),
                        latency_ms=round(latency_ms, 2),
                        provider=self.provider_name,
                        model="llama-3.1-8b-instant",
                    )
                except Exception as fb_err:
                    logger.error(f"[GroqProvider] Fallback model also failed: {fb_err}")

            logger.error(f"[GroqProvider] Generation failed with error: {e}")
            raise AIServiceException(f"Groq generation failed: {str(e)}")

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        model: Optional[str] = None,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        target_model = model or settings.GROQ_DEFAULT_MODEL or self.default_model

        messages: List[Dict[str, str]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await client.chat.completions.create(
                model=target_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"[GroqProvider] Streaming failed: {e}")
            raise AIServiceException(f"Groq streaming failed: {str(e)}")
