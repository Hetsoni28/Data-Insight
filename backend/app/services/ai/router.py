"""Multi-Provider LLM Router with intelligent workload routing and failover."""

from __future__ import annotations

import logging
from typing import AsyncIterator, Optional, Dict, Any, List
from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.services.ai.base import BaseLLMProvider, LLMResponse
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)


class LLMRouter:
    """Intelligent multi-provider router with seamless fallback and latency/context optimization."""

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ):
        self.groq_provider = GroqProvider(api_key=groq_api_key)
        self.gemini_provider = GeminiProvider(api_key=gemini_api_key)

    def get_provider(self, name: str) -> Optional[BaseLLMProvider]:
        if name.lower() == "groq":
            return self.groq_provider
        elif name.lower() == "gemini":
            return self.gemini_provider
        return None

    def list_available_providers(self) -> List[Dict[str, Any]]:
        providers = []
        providers.append({
            "name": "groq",
            "display_name": "Groq LPU (Ultra-Fast)",
            "available": self.groq_provider.is_available(),
            "default_model": settings.GROQ_DEFAULT_MODEL or self.groq_provider.default_model,
            "models": list(self.groq_provider.PRICING.keys()),
        })
        providers.append({
            "name": "gemini",
            "display_name": "Google Gemini (Deep Context)",
            "available": self.gemini_provider.is_available(),
            "default_model": settings.GEMINI_DEFAULT_MODEL or self.gemini_provider.default_model,
            "models": list(self.gemini_provider.PRICING.keys()),
        })
        return providers

    def _determine_provider_chain(
        self,
        task_type: str = "chat",
        preferred_provider: Optional[str] = None,
    ) -> List[BaseLLMProvider]:
        """Determine primary and fallback provider chain based on task type and availability."""
        chain: List[BaseLLMProvider] = []

        if preferred_provider:
            pref = self.get_provider(preferred_provider)
            if pref and pref.is_available():
                chain.append(pref)

        # Workload-based priority
        if task_type in ("chat", "sql", "quick_insight", "copilot"):
            # Groq first for ultra-low latency interactive responses
            if self.groq_provider.is_available() and self.groq_provider not in chain:
                chain.append(self.groq_provider)
            if self.gemini_provider.is_available() and self.gemini_provider not in chain:
                chain.append(self.gemini_provider)
        else:
            # Gemini first for massive context, multi-table synthesis, deep narrative
            if self.gemini_provider.is_available() and self.gemini_provider not in chain:
                chain.append(self.gemini_provider)
            if self.groq_provider.is_available() and self.groq_provider not in chain:
                chain.append(self.groq_provider)

        # Fallback to any initialized provider if none marked available
        if not chain:
            if self.groq_provider.api_key:
                chain.append(self.groq_provider)
            if self.gemini_provider.api_key:
                chain.append(self.gemini_provider)

        return chain

    async def generate(
        self,
        prompt: str,
        task_type: str = "chat",
        preferred_provider: Optional[str] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        json_mode: bool = False,
        model: Optional[str] = None,
    ) -> LLMResponse:
        chain = self._determine_provider_chain(task_type, preferred_provider)
        if not chain:
            raise AIServiceException("No AI providers configured. Please set GROQ_API_KEY or GEMINI_API_KEY.")

        last_error: Optional[Exception] = None

        for provider in chain:
            try:
                logger.info(f"[LLMRouter] Routing request ({task_type}) to {provider.provider_name}")
                response = await provider.generate(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    json_mode=json_mode,
                    model=model if preferred_provider == provider.provider_name else None,
                )
                return response
            except Exception as e:
                logger.warning(f"[LLMRouter] Provider {provider.provider_name} failed: {e}. Attempting failover...")
                last_error = e

        raise AIServiceException(f"All configured AI providers failed. Last error: {str(last_error)}")

    async def generate_stream(
        self,
        prompt: str,
        task_type: str = "chat",
        preferred_provider: Optional[str] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        model: Optional[str] = None,
    ) -> AsyncIterator[str]:
        chain = self._determine_provider_chain(task_type, preferred_provider)
        if not chain:
            raise AIServiceException("No AI providers configured for streaming.")

        primary_provider = chain[0]
        try:
            logger.info(f"[LLMRouter] Streaming response using {primary_provider.provider_name}")
            async for token in primary_provider.generate_stream(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                model=model,
            ):
                yield token
        except Exception as e:
            logger.warning(f"[LLMRouter] Primary streaming provider {primary_provider.provider_name} failed: {e}")
            if len(chain) > 1:
                fallback_provider = chain[1]
                logger.info(f"[LLMRouter] Failing over stream to {fallback_provider.provider_name}")
                async for token in fallback_provider.generate_stream(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    yield token
            else:
                raise AIServiceException(f"Streaming failed: {str(e)}")
