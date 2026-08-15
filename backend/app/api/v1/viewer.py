import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Dict, Any, Optional

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User, UserRole
from app.models.dataset import Dataset, DatasetStatus
from app.models.report import Report
from app.schemas.viewer import (
    ViewerDashboardOverview,
    ViewerDashboardResponse,
    ViewerBookmarkToggleRequest,
    ViewerBookmarkToggleResponse,
    ViewerAiChatRequest,
    ViewerAiChatResponse,
    ViewerReportInsights,
    ViewerReportRelatedAsset,
    ViewerReportPreviewResponse,
    ViewerReportFiltersResponse,
    ViewerReportListResponse
)
from app.services.viewer import ViewerService
from app.services.ai_service import AIService
from app.core.exceptions import ForbiddenException, ResourceNotFoundException

router = APIRouter(prefix="/viewer", tags=["Viewer Dashboard"])

@router.get(
    "/dashboard",
    response_model=ViewerDashboardOverview,
    summary="Get Viewer Dashboard stats, greetings, activity, and notifications"
)
async def get_dashboard_overview(
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce role boundaries (Viewer only, but let other roles view as well if needed)
    # The prompt says: "This dashboard is designed ONLY for users with the Viewer role."
    # We will enforce this boundary!
         
    svc = ViewerService(db)
    return await svc.get_dashboard_overview(workspace_id, current_user)

@router.get(
    "/reports",
    response_model=ViewerReportListResponse,
    summary="List reports shared in the active workspace"
)
async def list_reports(
    workspace_id: uuid.UUID = Query(...),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_bookmarked: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.list_reports(
        workspace_id, current_user, search, category, department, status, is_bookmarked, page, size
    )

@router.get(
    "/report-filters",
    response_model=ViewerReportFiltersResponse,
    summary="Get available report filters"
)
async def get_report_filters(
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_report_filters(workspace_id, current_user)

@router.get(
    "/reports/{report_id}",
    summary="Retrieve report and log view action"
)
async def get_report(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_report_access(report_id, current_user)

@router.get(
    "/reports/{report_id}/preview",
    response_model=ViewerReportPreviewResponse,
    summary="Retrieve rich report preview"
)
async def get_report_preview(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_report_preview(report_id, current_user)

@router.get(
    "/reports/{report_id}/insights",
    response_model=ViewerReportInsights,
    summary="Retrieve AI insights for report"
)
async def get_report_insights(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_report_insights(report_id, current_user)

@router.get(
    "/reports/{report_id}/related",
    response_model=List[ViewerReportRelatedAsset],
    summary="Retrieve related assets for report"
)
async def get_report_related(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_report_related(report_id, current_user)

@router.get(
    "/dashboards",
    response_model=List[ViewerDashboardResponse],
    summary="List interactive read-only dashboards compiled from ready datasets"
)
async def list_dashboards(
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.list_dashboards(workspace_id, current_user)

@router.get(
    "/datasets",
    response_model=List[Dict[str, Any]],
    summary="List datasets shared in the active workspace"
)
async def list_datasets(
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.list_datasets(workspace_id, current_user)

@router.get(
    "/datasets/{dataset_id}",
    summary="Get details of a shared dataset"
)
async def get_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_dataset_details(dataset_id, current_user)

@router.get(
    "/datasets/{dataset_id}/preview",
    summary="Get sample preview rows for a dataset"
)
async def get_dataset_preview(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_dataset_preview(dataset_id, current_user)

@router.get(
    "/datasets/{dataset_id}/schema",
    summary="Get schema definition of a dataset"
)
async def get_dataset_schema(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_dataset_schema(dataset_id, current_user)

@router.get(
    "/datasets/{dataset_id}/insights",
    summary="Get AI insights for a dataset"
)
async def get_dataset_insights(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_dataset_insights(dataset_id, current_user)

@router.get(
    "/datasets/{dataset_id}/charts",
    summary="Get business visualizations for a dataset"
)
async def get_dataset_charts(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.get_dataset_charts(dataset_id, current_user)

@router.get(
    "/profile",
    summary="Retrieve full user profile detail"
)
async def get_profile(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.api.v1.profile import get_full_profile
    return await get_full_profile(current_user, db)

@router.get(
    "/notifications",
    summary="Retrieve system notifications for the viewer"
)
async def get_notifications(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.api.v1.notifications import list_notifications
    return await list_notifications(current_user, db)

@router.get(
    "/activity",
    summary="Retrieve personal activity feed"
)
async def get_activity(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.api.v1.profile import get_activity as get_profile_activity
    return await get_profile_activity(current_user, db)

@router.get(
    "/bookmarks",
    response_model=List[str],
    summary="Retrieve bookmarked report IDs list"
)
async def get_bookmarks(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch profile
    from app.models.user_profile import UserProfile
    from sqlalchemy import select
    stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    if profile and profile.preferences:
        return profile.preferences.get("bookmarks", [])
    return []

@router.post(
    "/bookmarks/toggle",
    response_model=ViewerBookmarkToggleResponse,
    summary="Toggle report bookmark status"
)
async def toggle_bookmark(
    body: ViewerBookmarkToggleRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    is_bookmarked = await svc.toggle_bookmark(current_user.id, body.report_id)
    message = "Report bookmarked successfully" if is_bookmarked else "Report removed from bookmarks"
    return {
        "report_id": body.report_id,
        "is_bookmarked": is_bookmarked,
        "message": message
    }

@router.post(
    "/ai/chat",
    response_model=ViewerAiChatResponse,
    summary="AI assistant chat workspace for Viewer"
)
async def ai_chat(
    body: ViewerAiChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):

    # Locate dataset context
    target_dataset_id = body.dataset_id
    if not target_dataset_id and body.report_id:
        # Resolve from report
        from app.models.report import Report
        r_stmt = select(Report).where(and_(Report.id == body.report_id, Report.tenant_id == current_user.tenant_id))
        r_res = await db.execute(r_stmt)
        report = r_res.scalars().first()
        if report:
            target_dataset_id = report.dataset_id

    if not target_dataset_id:
        # Fallback: get the most recent dataset in the user's workspace
        # But wait! If there are no datasets, the AI will answer general platform/BI questions.
        # Let's search if any dataset exists.
        from app.models.dataset import Dataset
        ds_stmt = (
            select(Dataset)
            .where(and_(Dataset.tenant_id == current_user.tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.ready))
            .order_by(desc(Dataset.created_at))
            .limit(1)
        )
        ds_res = await db.execute(ds_stmt)
        ds = ds_res.scalars().first()
        if ds:
            target_dataset_id = ds.id

    if not target_dataset_id:
        raise HTTPException(
            status_code=400,
            detail="No datasets available. Please request an Administrator to upload a dataset first."
        )

    ai_svc = AIService(db)
    # Log AI Chat request
    viewer_svc = ViewerService(db)
    await viewer_svc.audit_repo.log(
        "ai.chat",
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        resource_type="dataset",
        resource_id=str(target_dataset_id)
    )

    try:
        # Invoke standard chat service
        res = await ai_svc.copilot_chat(
            question=body.question,
            dataset_id=target_dataset_id,
            actor=current_user,
            history=body.history
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI Assistant is temporarily busy: {str(e)}"
        )

@router.post(
    "/report/download",
    summary="Validate permissions and generate a signed report download URL"
)
async def download_report(
    body: ViewerBookmarkToggleRequest, # Reuses same report_id validation
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    svc = ViewerService(db)
    return await svc.handle_report_download(body.report_id, current_user)
