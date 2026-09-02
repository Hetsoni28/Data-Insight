"""Pydantic schemas for Dataset requests/responses."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None = None
    file_type: str
    file_size_bytes: int | None = None
    original_filename: str
    status: str
    row_count: int | None = None
    column_count: int | None = None
    data_quality_score: int | None = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetProfileResponse(DatasetResponse):
    profile: dict[str, Any] | None = None


class DatasetUploadResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    celery_task_id: str | None = None
    message: str = "Dataset uploaded. High-speed profiling has started."

    model_config = {"from_attributes": True}


class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    name: str
    total_rows: int
    total_columns: int
    columns: list[dict[str, Any]]
    preview_rows: list[dict[str, Any]]


class DatasetCorrelationsResponse(BaseModel):
    columns: list[str]
    matrix: dict[str, dict[str, float | None]]


class StructuredQueryFilter(BaseModel):
    column: str
    operator: str  # eq, neq, gt, lt, gte, lte, in, not_in, contains
    value: Any


class StructuredQuerySort(BaseModel):
    column: str
    direction: str = "asc"


class StructuredQueryRequest(BaseModel):
    dataset_id: str
    dimension: str | None = None
    metric: str | None = None
    aggregation: str | None = None  # count, sum, avg, min, max
    filters: list[StructuredQueryFilter] | None = []
    sort: list[StructuredQuerySort] | None = []
    limit: int = Field(default=1000, ge=1, le=10000, description="Max rows to return")


class DatasetQueryRequest(BaseModel):
    sql: str = Field(..., description="SQL query to execute over the dataset view")
    limit: int = Field(default=1000, ge=1, le=10000, description="Max rows to return")
    offset: int = Field(default=0, ge=0, description="Row offset for pagination")


class DatasetQueryResponse(BaseModel):
    columns: list[str]
    column_types: list[str]
    rows: list[list[Any]]
    total_rows: int
    returned_rows: int
    limit: int
    offset: int
    execution_time_ms: float
