from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel
import uuid

class ReportStatsResponse(BaseModel):
    total_reports: int
    ai_reports: int
    scheduled_reports: int
    success_rate: float
    avg_generation_time_sec: float

class ReportItem(BaseModel):
    id: str
    title: str
    status: str
    report_type: str
    category: str
    created_at: str
    output_size_bytes: int
    dataset_id: Optional[str]

class ReportActivityItem(BaseModel):
    id: str
    action: str
    created_at: str
    type: str

class ReportActivitiesResponse(BaseModel):
    audit_logs: List[ReportActivityItem]

