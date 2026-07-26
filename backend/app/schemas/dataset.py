"""Pydantic schemas for Dataset requests/responses."""
import uuid
from datetime import datetime
from pydantic import BaseModel


class DatasetResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    file_type: str
    file_size_bytes: int | None
    original_filename: str
    status: str
    row_count: int | None
    column_count: int | None
    data_quality_score: int | None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetProfileResponse(DatasetResponse):
    profile: dict | None = None


class DatasetUploadResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    celery_task_id: str | None
    message: str = "Dataset uploaded. Profiling has started."

    model_config = {"from_attributes": True}
