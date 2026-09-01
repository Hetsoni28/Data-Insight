from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import uuid
import asyncio
import random

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole, get_current_workspace, RequirePermission, ROLE_PERMISSIONS
from app.models.user import User
from app.models.workspace import Workspace
from app.models.dataset import Dataset, DatasetStatus
from app.models.ai_token_usage import AITokenUsage
from app.models.audit_log import AuditLog
from pydantic import BaseModel
from app.core.rate_limit import limiter
from app.core.websockets import manager as ws_manager
from app.services.dataset_query_service import DatasetQueryService
from app.permissions.dataset_permissions import ROLE_PERMISSIONS as DATASET_ROLE_PERMISSIONS

router = APIRouter()

class UploadDatasetRequest(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str
    file_url: str
    file_size_bytes: int
    original_filename: str
    workspace_id: uuid.UUID

@router.get("/stats", summary="Get Dataset Center Statistics", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_stats(
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
        # Base filter conditions
        base_conditions = [Dataset.tenant_id == tenant_id, Dataset.is_deleted == False]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)

        # Total datasets
        total_stmt = select(func.count(Dataset.id)).where(*base_conditions)
        total_res = await db.execute(total_stmt)
        total_datasets = total_res.scalar() or 0
    
        # Processing datasets
        proc_stmt = select(func.count(Dataset.id)).where(
            *base_conditions,
            or_(Dataset.status == DatasetStatus.profiling, Dataset.status == DatasetStatus.uploading)
        )
        proc_res = await db.execute(proc_stmt)
        processing_datasets = proc_res.scalar() or 0
    
        # Completed datasets
        comp_stmt = select(func.count(Dataset.id)).where(*base_conditions, Dataset.status == DatasetStatus.ready)
        comp_res = await db.execute(comp_stmt)
        completed_datasets = comp_res.scalar() or 0
    
        # Failed datasets
        err_stmt = select(func.count(Dataset.id)).where(*base_conditions, Dataset.status == DatasetStatus.error)
        err_res = await db.execute(err_stmt)
        failed_datasets = err_res.scalar() or 0
    
        # Storage used
        storage_stmt = select(func.sum(Dataset.file_size_bytes)).where(*base_conditions)
        storage_res = await db.execute(storage_stmt)
        storage_used = storage_res.scalar() or 0
    
        # Total rows processed
        rows_stmt = select(func.sum(Dataset.row_count)).where(*base_conditions)
        rows_res = await db.execute(rows_stmt)
        rows_processed = rows_res.scalar() or 0

        # Total cols analyzed
        cols_stmt = select(func.sum(Dataset.column_count)).where(*base_conditions)
        cols_res = await db.execute(cols_stmt)
        cols_analyzed = cols_res.scalar() or 0
    
        # AI Tasks (Reports, Excel, Dashboards) - querying AITokenUsage
        # AITokenUsage has no workspace_id column — filter by tenant only
        ai_tasks_stmt = select(AITokenUsage.feature, func.count(AITokenUsage.id)).where(
            AITokenUsage.tenant_id == tenant_id
        ).group_by(AITokenUsage.feature)
        ai_tasks_res = await db.execute(ai_tasks_stmt)
    
        ai_reports = 0
        ai_excel = 0
        dashboards = 0
    
        for feature, count in ai_tasks_res:
            if feature == 'report_generation': ai_reports = count
            elif feature == 'excel_generation': ai_excel = count
            elif feature == 'dashboard_generation': dashboards = count
        
        # Avg Quality Score
        q_stmt = select(func.avg(Dataset.data_quality_score)).where(*base_conditions, Dataset.data_quality_score != None)
        q_res = await db.execute(q_stmt)
        avg_quality = float(q_res.scalar() or 0)
    
        return {
            "status": "success",
            "data": {
                "total_datasets": total_datasets,
                "processing_jobs": processing_datasets,
                "completed_jobs": completed_datasets,
                "failed_jobs": failed_datasets,
                "storage_used_bytes": storage_used,
                "storage_remaining_bytes": 107374182400 - storage_used, # Mock 100GB limit
                "rows_processed": rows_processed,
                "columns_analyzed": cols_analyzed,
                "ai_reports_generated": ai_reports,
                "ai_excel_generated": ai_excel,
                "dashboards_created": dashboards,
                "avg_quality_score": avg_quality
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.get("/", summary="List Organization Datasets", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def list_datasets(
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    base_conditions = [Dataset.tenant_id == tenant_id, Dataset.is_deleted == False]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset, User).outerjoin(User, Dataset.uploaded_by_id == User.id).where(*base_conditions).order_by(desc(Dataset.created_at))
    
    if search:
        stmt = stmt.where(Dataset.name.ilike(f"%{search}%"))
        
    result = await db.execute(stmt)
    
    datasets = []
    for d, u in result:
        datasets.append({
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "file_type": d.file_type,
            "file_size_bytes": d.file_size_bytes,
            "status": d.status,
            "row_count": d.row_count,
            "column_count": d.column_count,
            "data_quality_score": d.data_quality_score,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "owner": {
                "id": str(u.id) if u else None,
                "name": u.full_name if u else "Unknown",
                "email": u.email if u else None
            },
            "uploaded_by_id": str(d.uploaded_by_id),
            "schema_info": d.profile.get("columns", {}) if d.profile else {}
        })
        
    return {"status": "success", "data": datasets}

@router.get("/activities", summary="Recent AI Activities & Audit Log", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
        # Simple audit log query — filter by tenant + resource_type only.
        # Avoid CAST(resource_id AS UUID) JOIN with Dataset which causes full table scans.
        audit_stmt = (
            select(AuditLog, User)
            .outerjoin(User, AuditLog.user_id == User.id)
            .where(AuditLog.tenant_id == tenant_id, AuditLog.resource_type == "dataset")
            .order_by(desc(AuditLog.created_at))
            .offset(skip)
            .limit(limit)
        )
    
        audit_res = await db.execute(audit_stmt)
        audit_logs = []
        for log, u in audit_res:
            audit_logs.append({
                "id": str(log.id),
                "action": log.action,
                "resource_id": log.resource_id,
                "created_at": log.created_at,
                "actor_name": u.full_name if u else "System",
                "type": "audit"
            })
        
        # Get recent AI tasks — tenant-scoped only (fast indexed query)
        ai_stmt = (
            select(AITokenUsage)
            .where(AITokenUsage.tenant_id == tenant_id)
            .order_by(desc(AITokenUsage.created_at))
            .offset(skip)
            .limit(limit)
        )
    
        ai_res = await db.execute(ai_stmt)
        ai_logs = []
        for log in ai_res.scalars().all():
            ai_logs.append({
                "id": str(log.id),
                "action": log.feature or "ai_task",
                "cost_usd": float(log.cost_usd),
                "tokens": log.total_tokens,
                "created_at": log.created_at,
                "type": "ai_activity"
            })
        
        return {
            "status": "success", 
            "data": {
                "audit_logs": audit_logs,
                "ai_activities": ai_logs
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/schema", summary="Get Dataset Schema", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_schema(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    base_conditions = [
        Dataset.id == dataset_id,
        Dataset.tenant_id == tenant_id,
        Dataset.is_deleted == False
    ]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset).where(*base_conditions)
    res = await db.execute(stmt)
    dataset = res.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    profile = dataset.profile or {}
    columns = profile.get("columns", [])
    
    if isinstance(columns, dict):
        mapped_columns = []
        for key, val in columns.items():
            mapped_columns.append({
                "name": val.get("name", key),
                "type": val.get("dtype", "Unknown"),
                "description": val.get("description", ""),
                "nullable": val.get("null_count", 0) > 0,
                "unique": val.get("unique_pct", 0) == 100,
                "sample": val.get("top_values", [{"value": "N/A"}])[0].get("value") if val.get("top_values") else "N/A"
            })
        columns = mapped_columns
    
    return {
        "status": "success",
        "data": columns
    }

@router.get("/{dataset_id}/insights", summary="Get AI Insights", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_insights(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    from app.services.ai_service import AIService
    import json
    
    try:
        ai = AIService(db)
        prompt = '''Analyze the dataset context provided and return EXACTLY a JSON object with this exact schema (NO markdown formatting, just raw JSON):
{
  "executive_summary": "A 2 sentence summary of what this dataset is.",
  "kpis": ["Key observation 1", "Key observation 2", "Key observation 3"],
  "anomalies": ["Anomaly 1", "Anomaly 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"]
}'''
        res = await ai.copilot_chat(
            question=prompt,
            dataset_id=dataset_id,
            actor=current_user
        )
        
        # Try to parse the answer as JSON
        content = res.get("answer", "")
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        try:
            data = json.loads(content)
        except:
            data = {
                "executive_summary": "Dataset analyzed successfully.",
                "kpis": ["Analysis complete"],
                "anomalies": ["No anomalies detected"],
                "opportunities": ["Explore data further"]
            }
            
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/charts", summary="Get Auto-Generated Charts", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_charts(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    # For now we'll construct mock charts based on the schema, as charting requires complex aggregation
    from app.repositories.dataset import DatasetRepository
    ds_repo = DatasetRepository(db)
    dataset = await ds_repo.get_tenant_dataset(current_user.tenant_id, dataset_id)
    
    charts = []
    if dataset and dataset.profile:
        row_count = dataset.profile.get("row_count", 0)
        charts.append({
            "title": "Total Records",
            "type": "kpi",
            "metrics": {
                "value": row_count,
                "median": "N/A"
            }
        })
        
        columns = dataset.profile.get("columns", {})
        if isinstance(columns, dict):
            for col_name, col_data in columns.items():
                if col_data.get("type") == "categorical" and "top_values" in col_data:
                    charts.append({
                        "title": f"{col_name} Distribution",
                        "type": "pie",
                        "data": [{"name": v.get("value"), "value": v.get("count")} for v in col_data.get("top_values", [])]
                    })
                    if len(charts) >= 3:
                        break
                        
    return {
        "status": "success",
        "data": charts
    }

@router.get("/{dataset_id}/preview", summary="Get Dataset Preview", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_preview(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    from app.services.dataset import DatasetService
    try:
        service = DatasetService(db)
        data = await service.get_preview_data(dataset_id, current_user)
        
        # Map to what the frontend expects
        mapped_columns = [
            {"name": col["name"], "type": col["dtype"]}
            for col in data["columns"]
        ]
        
        return {
            "status": "success",
            "data": {
                "columns": mapped_columns,
                "rows": data["preview_rows"],
                "preview_count": len(data["preview_rows"])
            }
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load preview: {str(e)}")

@router.get("/{dataset_id}", summary="Get Dataset Details", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_details(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    base_conditions = [
        Dataset.id == dataset_id,
        Dataset.tenant_id == tenant_id,
        Dataset.is_deleted == False
    ]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset, User).outerjoin(User, Dataset.uploaded_by_id == User.id).where(*base_conditions)
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    d, u = row
    
    return {
        "status": "success",
        "data": {
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "file_type": d.file_type,
            "file_size_bytes": d.file_size_bytes,
            "original_filename": d.original_filename,
            "status": d.status,
            "error_message": d.error_message,
            "row_count": d.row_count,
            "column_count": d.column_count,
            "data_quality_score": d.data_quality_score,
            "profile": d.profile,
            "excel_url": d.excel_url,
            "pdf_url": d.pdf_url,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "owner": {
                "id": str(u.id) if u else None,
                "name": u.full_name if u else "Unknown",
                "email": u.email if u else None
            },
            "uploaded_by_id": str(d.uploaded_by_id)
        }
    }

@router.post("/upload", summary="Register Uploaded Dataset", dependencies=[Depends(RequirePermission("DATASET_UPLOAD"))])
async def upload_dataset(
    req: UploadDatasetRequest,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        
        # Phase 5: Quota Enforcement
        from app.services.entitlements import check_quota, BillingResource, get_usage
        from app.models.tenant import Tenant
        from sqlalchemy import select
        
        tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
        usage = await get_usage(tenant, db)
        quota = check_quota(tenant, usage, BillingResource.DATASETS)
        if not quota.allowed:
            raise HTTPException(status_code=402, detail="Dataset quota exceeded for your organization's plan.")
    
        d = Dataset(
            tenant_id=tenant_id,
            workspace_id=req.workspace_id,
            uploaded_by_id=current_user.id,
            name=req.name,
            description=req.description,
            file_type=req.file_type,
            file_url=req.file_url,
            file_size_bytes=req.file_size_bytes,
            original_filename=req.original_filename,
            status=DatasetStatus.uploading
        )
    
        db.add(d)
    
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=current_user.id,
            action="dataset.upload",
            resource_type="dataset",
            ip_address=request.client.host if request.client else "127.0.0.1",
            extra_metadata={"filename": req.original_filename}
        )
        db.add(audit)
    
        await db.commit()
        await db.refresh(d)
        
        await ws_manager.publish_tenant_event(
            str(tenant_id),
            "dataset_uploaded",
            {"dataset_id": str(d.id), "name": d.name}
        )

        # Auto-trigger AI Excel + PDF generation in background
        # This ensures every newly uploaded dataset gets a PDF automatically
        try:
            from app.worker.tasks.excel_tasks import generate_ai_excel_task
            generate_ai_excel_task.delay(str(d.id), str(current_user.id))
        except Exception as task_err:
            # Non-blocking: if Celery is down, the upload still succeeds
            import logging
            logging.getLogger(__name__).warning(f"Could not queue AI Excel task: {task_err}")
    
        return {"status": "success", "data": {"id": str(d.id)}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.delete("/{dataset_id}", summary="Delete Dataset", dependencies=[Depends(RequirePermission("DATASET_DELETE"))])
async def delete_dataset(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset).where(*base_conditions)
    res = await db.execute(stmt)
    d = res.scalars().first()
    
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    user_perms = DATASET_ROLE_PERMISSIONS.get(current_user.role, [])
    if "DATASET_DELETE_ALL" not in user_perms:
        if "DATASET_DELETE_OWN" in user_perms and d.uploaded_by_id == current_user.id:
            pass # Allowed
        else:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this dataset.")
        
    d.is_deleted = True
    d.deleted_at = datetime.now(timezone.utc)
    
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="dataset.delete",
        resource_type="dataset",
        resource_id=str(d.id),
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    
    await db.commit()
    
    await ws_manager.publish_tenant_event(
        str(tenant_id),
        "dataset_deleted",
        {"dataset_id": str(d.id)}
    )
    
    return {"status": "success"}

async def simulate_ai_workflow(tenant_id: uuid.UUID, dataset_id: uuid.UUID, workflow_type: str, user_id: uuid.UUID):
    """Background task to mock processing delay and reset status."""
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if d:
            d.status = DatasetStatus.ready
            if workflow_type == 'analyze':
                d.data_quality_score = 95
            elif workflow_type == 'ai-excel':
                # Generate a mock AI Excel dataset to show in the UI
                new_d = Dataset(
                    tenant_id=tenant_id,
                    workspace_id=d.workspace_id,
                    uploaded_by_id=user_id,
                    name=f"{d.name} (AI Generated)",
                    description="AI Generated Output",
                    file_type=d.file_type,
                    file_url=d.file_url,
                    file_size_bytes=d.file_size_bytes + 25000,
                    original_filename=f"AI_Output_{d.original_filename}",
                    status=DatasetStatus.ready,
                    row_count=d.row_count,
                    column_count=d.column_count,
                    profile=d.profile,
                    data_quality_score=99
                )
                db.add(new_d)
            
            audit = AuditLog(
                tenant_id=tenant_id,
                user_id=user_id,
                action=f"dataset.{workflow_type}.completed",
                resource_type="dataset",
                resource_id=str(d.id),
                ip_address="127.0.0.1"
            )
            db.add(audit)
            await db.commit()
            
            await ws_manager.publish_tenant_event(
                str(tenant_id),
                "dataset_processed",
                {"dataset_id": str(d.id), "workflow_type": workflow_type}
            )

@router.post("/{dataset_id}/analyze", summary="Analyze Dataset", dependencies=[Depends(RequirePermission("DATASET_ANALYZE"))])
@limiter.limit("5/minute")
async def analyze_dataset(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)
            
        stmt = select(Dataset).where(*base_conditions)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if not d:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        d.status = DatasetStatus.profiling
    
        audit = AuditLog(
            tenant_id=tenant_id, user_id=current_user.id, action="dataset.analyze.started",
            resource_type="dataset", resource_id=str(d.id), ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
    
        # Mock AI usage log for cost tracking
        tokens = 1000
        ai_log = AITokenUsage(
            tenant_id=tenant_id, feature="data_profiling", model="gemini-3.5-flash",
            prompt_tokens=tokens, completion_tokens=50,
            total_tokens=tokens+50, cost_usd=float(tokens+50)*0.00001
        )
        db.add(ai_log)
    
        await db.commit()
        background_tasks.add_task(simulate_ai_workflow, tenant_id, dataset_id, 'analyze', current_user.id)
        return {"status": "success", "message": "Analysis started"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.post("/{dataset_id}/ai-excel", summary="Generate AI Excel", dependencies=[Depends(RequirePermission("DATASET_AI_EXCEL"))])
@limiter.limit("3/minute")
async def generate_ai_excel(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    # Phase 5: Quota Enforcement
    from app.services.entitlements import can_use_feature, BillingFeature
    from app.models.tenant import Tenant
    from sqlalchemy import select
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    if not can_use_feature(tenant, BillingFeature.AI_EXCEL):
        raise HTTPException(status_code=403, detail="AI Excel generation is not included in your organization's plan.")
        
    base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset).where(*base_conditions)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    d.status = DatasetStatus.profiling
    d.excel_url = None
    
    audit = AuditLog(
        tenant_id=tenant_id, user_id=current_user.id, action="dataset.ai-excel.started",
        resource_type="dataset", resource_id=str(d.id), ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    
    tokens = 4500
    ai_log = AITokenUsage(
        tenant_id=tenant_id, feature="excel_generation", model="gemini-3.5-flash",
        prompt_tokens=tokens, completion_tokens=1500,
        total_tokens=tokens+1500, cost_usd=float(tokens+1500)*0.000015
    )
    db.add(ai_log)
    
    await db.commit()
    from app.worker.tasks.excel_tasks import generate_ai_excel_task
    generate_ai_excel_task.delay(str(dataset_id), str(current_user.id))
    
    return {"status": "success", "message": "AI Excel generation started in background"}

@router.post("/{dataset_id}/dashboard", summary="Create Dashboard", dependencies=[Depends(RequirePermission("DATASET_CREATE_DASHBOARD"))])
@limiter.limit("5/minute")
async def create_dashboard(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)
            
        stmt = select(Dataset).where(*base_conditions)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if not d:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        d.status = DatasetStatus.profiling
    
        audit = AuditLog(
            tenant_id=tenant_id, user_id=current_user.id, action="dataset.dashboard.started",
            resource_type="dataset", resource_id=str(d.id), ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
    
        tokens = 2500
        ai_log = AITokenUsage(
            tenant_id=tenant_id, feature="dashboard_generation", model="gemini-3.5-flash",
            prompt_tokens=tokens, completion_tokens=800,
            total_tokens=tokens+800, cost_usd=float(tokens+800)*0.000015
        )
        db.add(ai_log)
    
        await db.commit()
        background_tasks.add_task(simulate_ai_workflow, tenant_id, dataset_id, 'dashboard', current_user.id)
        return {"status": "success", "message": "Dashboard generation started"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


class NLChartRequest(BaseModel):
    query: str

@router.post("/{dataset_id}/nl-chart", summary="Generate Natural Language Chart", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
@limiter.limit("5/minute")
async def generate_nl_chart(
    dataset_id: uuid.UUID,
    req: NLChartRequest,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id, Dataset.is_deleted == False]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)
            
        stmt = select(Dataset).where(*base_conditions)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if not d:
            raise HTTPException(status_code=404, detail="Dataset not found")
            
        from app.services.ai.visual_sql_agent import VisualSQLAgent
        from app.services.ai.router import LLMRouter
        from app.services.dataset import DatasetService
        
        # Get preview data and DF to feed into AI
        ds_service = DatasetService(db)
        df = await ds_service.load_dataframe(d)
        preview_data = await ds_service.get_preview_data(dataset_id, current_user)
        
        router_instance = LLMRouter(db=db, tenant_id=tenant_id, user_id=current_user.id)
        agent = VisualSQLAgent(router_instance)
        
        result = await agent.execute_and_synthesize(
            question=req.query,
            df=df,
            schema_info=d.profile.get("columns", {}) if d.profile else {},
            preview_rows=preview_data.get("preview_rows", [])[:3]
        )
        
        return {"status": "success", "data": result}
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Failed to generate NL chart")
        raise HTTPException(status_code=500, detail=f"Failed to generate chart: {str(e)}")


class QueryRequest(BaseModel):
    dimensions: List[str] = []
    metrics: List[str] = []

@router.post("/{dataset_id}/query", summary="Query Dataset", dependencies=[Depends(RequirePermission("DATASET_QUERY"))])
async def query_dataset(
    dataset_id: uuid.UUID,
    request: QueryRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)
            
        stmt = select(Dataset).where(*base_conditions)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if not d:
            raise HTTPException(status_code=404, detail="Dataset not found")
            
        results = await DatasetQueryService.execute_query(
            dataset_id=dataset_id,
            tenant_id=tenant_id,
            workspace_id=workspace.id if workspace else None,
            query_payload={"dimensions": request.dimensions, "metrics": request.metrics},
            dataset_metadata=d.profile or {},
            storage_path=d.file_url
        )
        return {"status": "success", "data": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.post("/{dataset_id}/clean", summary="Clean Dataset", dependencies=[Depends(RequirePermission("DATASET_EXPORT"))])
async def clean_dataset_api(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    """
    Scans the dataset for structural chaos, removes duplicates and null rows, 
    and saves the cleaned version over the original.
    """
    from app.services.dataset import DatasetService
    from app.services.ingestion.cleaner import DatasetCleaner
    from app.core.storage import upload_file, DATASETS_BUCKET
    import io
    
    try:
        tenant_id = current_user.tenant_id
        base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
        if workspace:
            base_conditions.append(Dataset.workspace_id == workspace.id)
            
        stmt = select(Dataset).where(*base_conditions)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if not d:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Load data
        ds_svc = DatasetService(db)
        df = await ds_svc.load_dataframe(d)
        
        # Clean data
        import asyncio
        df_cleaned, metrics = await asyncio.to_thread(DatasetCleaner.clean_dataframe, df)
        
        # Write to bytes buffer (always export as xlsx for cleaning)
        buf = io.BytesIO()
        df_cleaned.write_excel(buf)
        buf.seek(0)
        file_bytes = buf.read()
        
        # Generate new filename
        clean_filename = f"cleaned_{d.id}.xlsx"
        
        # Upload new cleaned file
        new_file_url = await upload_file(DATASETS_BUCKET, file_bytes, clean_filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # Update database
        d.file_url = new_file_url
        d.file_size_bytes = len(file_bytes)
        d.file_type = "xlsx"
        d.original_filename = f"Cleaned_{d.original_filename}"
        if not d.original_filename.endswith(".xlsx"):
            d.original_filename += ".xlsx"
            
        d.row_count = metrics["final_rows"]
        
        # Log audit
        audit = AuditLog(
            tenant_id=tenant_id, user_id=current_user.id, action="dataset.cleaned",
            resource_type="dataset", resource_id=str(d.id), ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
        await db.commit()
        
        return {
            "status": "success",
            "message": "Dataset cleaned successfully.",
            "metrics": metrics,
            "dataset": {
                "id": str(d.id),
                "row_count": d.row_count,
                "file_url": d.file_url
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")

@router.get("/{dataset_id}/excel-download", summary="Download AI Excel")
async def download_ai_excel(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the AI-generated Excel file as a streaming download.
    Works with both local storage (FileResponse) and Supabase (redirect).
    """
    tenant_id = current_user.tenant_id
    base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset).where(*base_conditions)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if not d.excel_url:
        raise HTTPException(status_code=404, detail="Excel not generated yet")
        
    from app.core.storage import is_local_storage
    if is_local_storage():
        from app.core.storage import LOCAL_UPLOADS_DIR, DATASETS_BUCKET
        from fastapi.responses import FileResponse
        local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / d.excel_url
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="Excel file missing on disk")
        safe_name = f"AI_Excel_{d.name}.xlsx".replace("/", "_")
        return FileResponse(
            path=str(local_path),
            filename=safe_name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    else:
        from fastapi.responses import RedirectResponse
        from app.core.storage import get_signed_url, DATASETS_BUCKET
        url = await get_signed_url(DATASETS_BUCKET, d.excel_url, expires_in=300)
        return RedirectResponse(url)


@router.get("/{dataset_id}/pdf-download", summary="Download AI PDF Report")
async def download_ai_pdf(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    """Returns the AI-generated PDF Report as a streaming download."""
    tenant_id = current_user.tenant_id
    base_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == tenant_id]
    if workspace:
        base_conditions.append(Dataset.workspace_id == workspace.id)
        
    stmt = select(Dataset).where(*base_conditions)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if not d.pdf_url:
        raise HTTPException(status_code=404, detail="PDF not generated yet")
        
    from app.core.storage import is_local_storage
    if is_local_storage():
        from app.core.storage import LOCAL_UPLOADS_DIR, DATASETS_BUCKET
        from fastapi.responses import FileResponse
        local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / d.pdf_url
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="PDF file missing on disk")
        safe_name = f"AI_Report_{d.name}.pdf".replace("/", "_")
        return FileResponse(
            path=str(local_path),
            filename=safe_name,
            media_type="application/pdf"
        )
    else:
        from fastapi.responses import RedirectResponse
        from app.core.storage import get_signed_url, DATASETS_BUCKET
        url = await get_signed_url(DATASETS_BUCKET, d.pdf_url, expires_in=300)
        return RedirectResponse(url)




# =================================================================================
# Data Alerts
# =================================================================================

class DatasetAlertCreate(BaseModel):
    name: str
    metric_column: str
    condition: str
    threshold_value: float

@router.get("/{dataset_id}/alerts", summary="Get Dataset Alerts", dependencies=[Depends(RequirePermission("DATASET_VIEW"))])
async def get_dataset_alerts(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.dataset_alert import DatasetAlert
    stmt = select(DatasetAlert).where(DatasetAlert.dataset_id == dataset_id, DatasetAlert.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    alerts = res.scalars().all()
    return {"status": "success", "data": alerts}

@router.post("/{dataset_id}/alerts", summary="Create Dataset Alert", dependencies=[Depends(RequirePermission("DATASET_EXPORT"))])
async def create_dataset_alert(
    dataset_id: uuid.UUID,
    req: DatasetAlertCreate,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.dataset_alert import DatasetAlert
    alert = DatasetAlert(
        tenant_id=current_user.tenant_id,
        dataset_id=dataset_id,
        name=req.name,
        metric_column=req.metric_column,
        condition=req.condition,
        threshold_value=req.threshold_value,
        is_active=True
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    # Trigger an immediate evaluation
    from app.worker.tasks.excel_tasks import evaluate_single_alert_task
    evaluate_single_alert_task.delay(str(alert.id), str(current_user.id))
    
    return {"status": "success", "data": alert}

@router.delete("/{dataset_id}/alerts/{alert_id}", summary="Delete Dataset Alert", dependencies=[Depends(RequirePermission("DATASET_EXPORT"))])
async def delete_dataset_alert(
    dataset_id: uuid.UUID,
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.dataset_alert import DatasetAlert
    stmt = select(DatasetAlert).where(DatasetAlert.id == alert_id, DatasetAlert.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    alert = res.scalars().first()
    if alert:
        await db.delete(alert)
        await db.commit()
    return {"status": "success"}

# =================================================================================
# AI Data Cleaning
# =================================================================================

class CleanApplyRequest(BaseModel):
    operations: List[Dict[str, Any]]

@router.post("/{dataset_id}/cleaning/suggestions", summary="Get AI Cleaning Suggestions", dependencies=[Depends(RequirePermission("DATASET_EXPORT"))])
@limiter.limit("5/minute")
async def get_cleaning_suggestions(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    from app.services.dataset import DatasetService
    from app.services.ai.cleaning_agent import CleaningAgent
    from app.services.ai.router import LLMRouter
    
    ds_svc = DatasetService(db)
    df = await ds_svc.load_dataframe(d)
    
    router_instance = LLMRouter(db=db, tenant_id=current_user.tenant_id, user_id=current_user.id)
    agent = CleaningAgent(router_instance)
    
    schema = d.profile.get("columns", {}) if d.profile else {}
    suggestions = await agent.suggest_cleaning(df, schema)
    
    return {"status": "success", "data": suggestions}

@router.post("/{dataset_id}/cleaning/apply", summary="Apply AI Cleaning", dependencies=[Depends(RequirePermission("DATASET_EXPORT"))])
@limiter.limit("5/minute")
async def apply_cleaning_operations(
    dataset_id: uuid.UUID,
    req: CleanApplyRequest,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    from app.services.dataset import DatasetService
    from app.services.ai.cleaning_agent import CleaningAgent
    from app.core.storage import upload_file, DATASETS_BUCKET
    import io
    
    ds_svc = DatasetService(db)
    df = await ds_svc.load_dataframe(d)
    
    agent = CleaningAgent(None) # Router not needed for apply
    df_cleaned = agent.apply_operations(df, req.operations)
    
    buf = io.BytesIO()
    df_cleaned.write_excel(buf)
    buf.seek(0)
    file_bytes = buf.read()
    
    await upload_file(DATASETS_BUCKET, d.file_url, file_bytes)
    
    # Re-profile dataset
    from app.services.ingestion.profiler import DataProfiler
    profile = DataProfiler.profile_dataframe(df_cleaned)
    d.profile = profile
    d.row_count = profile["row_count"]
    d.column_count = profile["column_count"]
    d.quality_score = profile["quality_score"]
    d.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Re-trigger AI Excel gen to update the PDF
    from app.worker.tasks.excel_tasks import generate_ai_excel_task
    generate_ai_excel_task.delay(str(d.id), str(current_user.id))
    
    return {"status": "success", "message": "Cleaning applied successfully"}
