"""Report generation and management endpoints."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.schemas.report import ReportGenerateRequest, ReportApproveRequest, ReportResponse, ReportJobResponse
from app.services.report import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post(
    "/generate",
    response_model=ReportJobResponse,
    status_code=202,
    summary="Trigger AI Excel report generation",
)
async def generate_report(
    body: ReportGenerateRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ReportService(db)
    report = await svc.generate_report(
        dataset_id=body.dataset_id,
        actor=current_user,
        title=body.title,
        report_type=body.report_type,
        generation_config=body.generation_config,
    )
    return report


@router.get("", response_model=list[ReportResponse], summary="List reports in workspace")
async def list_reports(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ReportService(db)
    return await svc.list_reports(workspace_id, current_user)


@router.get("/{report_id}", response_model=ReportResponse, summary="Get report status and download URL")
async def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ReportService(db)
    return await svc.get_report(report_id, current_user)


@router.post("/{report_id}/approve", response_model=ReportResponse, summary="Approve report for delivery")
async def approve_report(
    report_id: uuid.UUID,
    body: ReportApproveRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ReportService(db)
    return await svc.approve_report(report_id, current_user, notes=body.notes)


@router.delete("/{report_id}", status_code=204, summary="Delete report")
async def delete_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ReportService(db)
    await svc.delete_report(report_id, current_user)
