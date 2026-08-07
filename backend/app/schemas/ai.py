"""Pydantic schemas for AI Copilot, NL-to-SQL, Multi-Provider routing, and dataset analysis."""

from __future__ import annotations

import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str


class AIChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Natural language question")
    dataset_id: Optional[uuid.UUID] = Field(None, description="Optional dataset ID for context-grounded analysis")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Previous conversation turns")
    provider: Optional[str] = Field(None, description="Preferred provider: 'groq' | 'gemini'")
    stream: bool = Field(False, description="Whether to stream response via SSE")


class AIChatResponse(BaseModel):
    answer: str
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0


class AINLQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    dataset_id: uuid.UUID
    provider: Optional[str] = Field(None, description="Preferred provider: 'groq' | 'gemini'")


class AINLQueryResponse(BaseModel):
    question: str
    generated_sql: str
    query_result: Dict[str, Any]
    answer: str
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0


class AIAnalyzeRequest(BaseModel):
    dataset_id: uuid.UUID
    provider: Optional[str] = Field(None, description="'groq' | 'gemini'")


class AIAnalyzeResponse(BaseModel):
    job_id: str
    status: str
    message: str


class AIProviderModel(BaseModel):
    name: str
    display_name: str
    available: bool
    default_model: str
    models: List[str]


class AIProvidersListResponse(BaseModel):
    providers: List[AIProviderModel]
    active_default: str
