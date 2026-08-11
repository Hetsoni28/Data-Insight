"""Pydantic schemas for Dataset requests/responses."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str] = None
    file_type: str
    file_size_bytes: Optional[int] = None
    original_filename: str
    status: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    data_quality_score: Optional[int] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetProfileResponse(DatasetResponse):
    profile: Optional[Dict[str, Any]] = None


class DatasetUploadResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    celery_task_id: Optional[str] = None
    message: str = "Dataset uploaded. High-speed profiling has started."

    model_config = {"from_attributes": True}


class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    name: str
    total_rows: int
    total_columns: int
    columns: List[Dict[str, Any]]
    preview_rows: List[Dict[str, Any]]


class DatasetCorrelationsResponse(BaseModel):
    columns: List[str]
    matrix: Dict[str, Dict[str, Optional[float]]]


class StructuredQueryFilter(BaseModel):
    column: str
    operator: str  # eq, neq, gt, lt, gte, lte, in, not_in, contains
    value: Any

class StructuredQuerySort(BaseModel):
    column: str
    direction: str = "asc"

class StructuredQueryRequest(BaseModel):
    dataset_id: str
    dimension: Optional[str] = None
    metric: Optional[str] = None
    aggregation: Optional[str] = None  # count, sum, avg, min, max
    filters: Optional[List[StructuredQueryFilter]] = []
    sort: Optional[List[StructuredQuerySort]] = []
    limit: int = Field(default=1000, ge=1, le=10000, description="Max rows to return")

class DatasetQueryRequest(BaseModel):
    sql: str = Field(..., description="SQL query to execute over the dataset view")
    limit: int = Field(default=1000, ge=1, le=10000, description="Max rows to return")
    offset: int = Field(default=0, ge=0, description="Row offset for pagination")


class DatasetQueryResponse(BaseModel):
    columns: List[str]
    column_types: List[str]
    rows: List[List[Any]]
    total_rows: int
    returned_rows: int
    limit: int
    offset: int
    execution_time_ms: float
