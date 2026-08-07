from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import uuid
import asyncio
import random

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole
from app.models.user import User
from app.models.dataset import Dataset, DatasetStatus
from app.models.ai_token_usage import AITokenUsage
from app.models.audit_log import AuditLog
from pydantic import BaseModel

router = APIRouter()

class UploadDatasetRequest(BaseModel):
    name: str
    description: Optional[str] = None
    file_type: str
    file_url: str
    file_size_bytes: int
    original_filename: str
    workspace_id: uuid.UUID

@router.get("/stats", summary="Get Dataset Center Statistics")
async def get_dataset_stats(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
        # Total datasets
        total_stmt = select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)
        total_res = await db.execute(total_stmt)
        total_datasets = total_res.scalar() or 0
    
        # Processing datasets
        proc_stmt = select(func.count(Dataset.id)).where(
            Dataset.tenant_id == tenant_id, 
            Dataset.is_deleted == False,
            or_(Dataset.status == DatasetStatus.profiling, Dataset.status == DatasetStatus.uploading)
        )
        proc_res = await db.execute(proc_stmt)
        processing_datasets = proc_res.scalar() or 0
    
        # Completed datasets
        comp_stmt = select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.ready)
        comp_res = await db.execute(comp_stmt)
        completed_datasets = comp_res.scalar() or 0
    
        # Failed datasets
        err_stmt = select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.error)
        err_res = await db.execute(err_stmt)
        failed_datasets = err_res.scalar() or 0
    
        # Storage used
        storage_stmt = select(func.sum(Dataset.file_size_bytes)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)
        storage_res = await db.execute(storage_stmt)
        storage_used = storage_res.scalar() or 0
    
        # Total rows processed
        rows_stmt = select(func.sum(Dataset.row_count)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)
        rows_res = await db.execute(rows_stmt)
        rows_processed = rows_res.scalar() or 0

        # Total cols analyzed
        cols_stmt = select(func.sum(Dataset.column_count)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)
        cols_res = await db.execute(cols_stmt)
        cols_analyzed = cols_res.scalar() or 0
    
        # AI Tasks (Reports, Excel, Dashboards) - querying AITokenUsage
        ai_tasks_stmt = select(AITokenUsage.feature, func.count(AITokenUsage.id)).where(AITokenUsage.tenant_id == tenant_id).group_by(AITokenUsage.feature)
        ai_tasks_res = await db.execute(ai_tasks_stmt)
    
        ai_reports = 0
        ai_excel = 0
        dashboards = 0
    
        for feature, count in ai_tasks_res:
            if feature == 'report_generation': ai_reports = count
            elif feature == 'excel_generation': ai_excel = count
            elif feature == 'dashboard_generation': dashboards = count
        
        # Avg Quality Score
        q_stmt = select(func.avg(Dataset.data_quality_score)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.data_quality_score != None)
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

@router.get("/", summary="List Organization Datasets")
async def list_datasets(
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    stmt = select(Dataset, User).outerjoin(User, Dataset.uploaded_by_id == User.id).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False).order_by(desc(Dataset.created_at))
    
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
                "name": u.full_name if u else "Unknown",
                "email": u.email if u else None
            }
        })
        
    return {"status": "success", "data": datasets}

@router.get("/activities", summary="Recent AI Activities & Audit Log")
async def get_dataset_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
        # Get last 20 audit logs for datasets
        audit_stmt = select(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id).where(
            AuditLog.tenant_id == tenant_id,
            AuditLog.resource_type == 'dataset'
        ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    
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
        
        # Get recent AI tasks (from AITokenUsage)
        ai_stmt = select(AITokenUsage).where(
            AITokenUsage.tenant_id == tenant_id
        ).order_by(desc(AITokenUsage.created_at)).offset(skip).limit(limit)
    
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

@router.get("/{dataset_id}", summary="Get Dataset Details")
async def get_dataset_details(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    stmt = select(Dataset, User).outerjoin(User, Dataset.uploaded_by_id == User.id).where(
        Dataset.id == dataset_id,
        Dataset.tenant_id == tenant_id,
        Dataset.is_deleted == False
    )
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
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "owner": {
                "name": u.full_name if u else "Unknown",
                "email": u.email if u else None
            }
        }
    }

@router.post("/upload", summary="Register Uploaded Dataset")
async def upload_dataset(
    req: UploadDatasetRequest,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
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
    
        return {"status": "success", "data": {"id": str(d.id)}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.delete("/{dataset_id}", summary="Delete Dataset", dependencies=[Depends(RequireRole(["org_admin"]))])
async def delete_dataset(
    dataset_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
    res = await db.execute(stmt)
    d = res.scalars().first()
    
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
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
    return {"status": "success"}

async def simulate_ai_workflow(tenant_id: uuid.UUID, dataset_id: uuid.UUID, workflow_type: str, user_id: uuid.UUID):
    """Background task to mock processing delay and reset status."""
    from app.db.session import AsyncSessionLocal
    await asyncio.sleep(5) # Simulate 5 seconds of AI processing
    
    async with AsyncSessionLocal() as db:
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
        res = await db.execute(stmt)
        d = res.scalars().first()
        if d:
            d.status = DatasetStatus.ready
            if workflow_type == 'analyze':
                d.data_quality_score = random.randint(85, 100)
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

@router.post("/{dataset_id}/analyze", summary="Analyze Dataset", dependencies=[Depends(RequireRole(["org_admin"]))])
async def analyze_dataset(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
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
        tokens = random.randint(500, 2000)
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

@router.post("/{dataset_id}/ai-excel", summary="Generate AI Excel", dependencies=[Depends(RequireRole(["org_admin"]))])
async def generate_ai_excel(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
    res = await db.execute(stmt)
    d = res.scalars().first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    d.status = DatasetStatus.profiling
    
    audit = AuditLog(
        tenant_id=tenant_id, user_id=current_user.id, action="dataset.ai-excel.started",
        resource_type="dataset", resource_id=str(d.id), ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    
    tokens = random.randint(3000, 8000)
    ai_log = AITokenUsage(
        tenant_id=tenant_id, feature="excel_generation", model="gemini-3.5-flash",
        prompt_tokens=tokens, completion_tokens=1500,
        total_tokens=tokens+1500, cost_usd=float(tokens+1500)*0.000015
    )
    db.add(ai_log)
    
    await db.commit()
    background_tasks.add_task(simulate_ai_workflow, tenant_id, dataset_id, 'ai-excel', current_user.id)
    return {"status": "success", "message": "AI Excel generation started"}

@router.post("/{dataset_id}/dashboard", summary="Create Dashboard", dependencies=[Depends(RequireRole(["org_admin"]))])
async def create_dashboard(
    dataset_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        stmt = select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id)
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
    
        tokens = random.randint(1500, 5000)
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
