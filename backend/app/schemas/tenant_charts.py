from datetime import datetime
from typing import Any

from pydantic import UUID4, BaseModel, Field


class ChartBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = None
    chart_type: str = Field(..., max_length=50)
    dataset_id: UUID4
    configuration_json: dict[str, Any] = Field(default_factory=dict)
    visibility: str = Field("private", max_length=50)
    status: str = Field("active", max_length=50)


class ChartCreate(ChartBase):
    pass


class ChartUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    chart_type: str | None = Field(None, max_length=50)
    configuration_json: dict[str, Any] | None = None
    visibility: str | None = Field(None, max_length=50)
    status: str | None = Field(None, max_length=50)


class ChartResponse(ChartBase):
    id: UUID4
    tenant_id: UUID4
    workspace_id: UUID4 | None
    created_by_id: UUID4 | None
    view_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChartListResponse(BaseModel):
    items: list[ChartResponse]
    total: int
