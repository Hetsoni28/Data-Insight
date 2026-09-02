from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import uuid


class DatasetStatsResponse(BaseModel):
    total_datasets: int
    processing_jobs: int
    completed_jobs: int
    failed_jobs: int
    storage_used_bytes: int
    storage_remaining_bytes: int
    rows_processed: int
    columns_analyzed: int
    ai_reports_generated: int
    ai_excel_generated: int
    dashboards_created: int
    avg_quality_score: float


class OwnerInfo(BaseModel):
    name: str
    email: Optional[str]


class DatasetItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    file_type: str
    file_size_bytes: int
    status: str
    row_count: Optional[int]
    column_count: Optional[int]
    data_quality_score: Optional[int]
    created_at: datetime
    updated_at: datetime
    owner: OwnerInfo


class DatasetDetailsItem(DatasetItem):
    original_filename: str
    error_message: Optional[str]
    profile: Optional[dict]


class AuditLogItem(BaseModel):
    id: str
    action: str
    resource_id: Optional[str]
    created_at: datetime
    actor_name: str
    type: str


class AIActivityItem(BaseModel):
    id: str
    action: str
    cost_usd: float
    tokens: int
    created_at: datetime
    type: str


class ActivitiesResponse(BaseModel):
    audit_logs: List[AuditLogItem]
    ai_activities: List[AIActivityItem]
