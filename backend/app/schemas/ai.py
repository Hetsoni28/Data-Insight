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


# --- Phase 6: Copilot Sessions & Visual Artifacts Schemas ---

class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    artifact_data: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field("New Chat", max_length=100)
    dataset_id: Optional[uuid.UUID] = None


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    dataset_id: Optional[uuid.UUID] = None


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    dataset_id: Optional[uuid.UUID] = None
    dataset_name: Optional[str] = None
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
    message_count: int = 0
    messages: List[ChatMessageResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionResponse]
    total: int


class AICopilotMessageRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Natural language question")
    provider: Optional[str] = Field(None, description="Preferred provider: 'groq' | 'gemini'")
    stream: bool = Field(False, description="Whether to stream response via SSE")


class AICopilotMessageResponse(BaseModel):
    session_id: str
    message_id: str
    role: str
    content: str
    artifact_data: Optional[Dict[str, Any]] = None
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0
    created_at: Optional[str] = None


class AICopilotSuggestionItem(BaseModel):
    category: str = Field(..., description="'performance' | 'anomaly' | 'trend' | 'segmentation'")
    icon: str = Field(..., description="Lucide icon name")
    title: str
    question: str


class AICopilotSuggestionsResponse(BaseModel):
    dataset_id: uuid.UUID
    suggestions: List[AICopilotSuggestionItem]

