from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChartBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    chart_type: str = Field(..., max_length=50)
    dataset_id: UUID4
    configuration_json: Dict[str, Any] = Field(default_factory=dict)
    visibility: str = Field("private", max_length=50)
    status: str = Field("active", max_length=50)


class ChartCreate(ChartBase):
    pass


class ChartUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    chart_type: Optional[str] = Field(None, max_length=50)
    configuration_json: Optional[Dict[str, Any]] = None
    visibility: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)


class ChartResponse(ChartBase):
    id: UUID4
    tenant_id: UUID4
    workspace_id: Optional[UUID4]
    created_by_id: Optional[UUID4]
    view_count: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChartListResponse(BaseModel):
    items: List[ChartResponse]
    total: int
