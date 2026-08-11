import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, text
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole
from app.models.user import User, UserRole
from app.models.dataset import Dataset, DatasetStatus
from app.models.audit_log import AuditLog
from app.services.dataset import DatasetService

router = APIRouter(prefix="/manager/datasets", tags=["Manager Datasets"])

# Reusable role dependency for managers and above
manager_role_deps = [Depends(RequireRole([UserRole.manager, UserRole.org_admin, UserRole.owner]))]

# ─── GET ALL DATASETS (WITH PAGINATION AND FILTERING) ─────────
@router.get("", summary="List all datasets for manager", dependencies=manager_role_deps)
async def list_manager_datasets(
    search: Optional[str] = Query(None, description="Search by name or description"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_dir: str = Query("desc", description="Sort direction (asc or desc)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        query = select(Dataset).where(
            Dataset.tenant_id == current_user.tenant_id,
            Dataset.is_deleted == False
        )
        
        if search:
            query = query.where(or_(
                Dataset.name.ilike(f"%{search}%"),
                Dataset.description.ilike(f"%{search}%")
            ))
            
        if status:
            query = query.where(Dataset.status == status)
            
        # Total count for pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_count = await db.scalar(count_query)
        
        # Sorting
        order_col = getattr(Dataset, sort_by, Dataset.created_at)
        if sort_dir.lower() == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)
            
        # Pagination
        query = query.offset(skip).limit(limit)
        
        datasets = (await db.execute(query)).scalars().all()
        
        return {
            "status": "success",
            "data": {
                "datasets": [{
                    "id": str(d.id),
                    "name": d.name,
                    "description": d.description,
                    "status": d.status,
                    "rows": d.row_count,
                    "columns": d.column_count,
                    "size_bytes": d.file_size_bytes,
                    "quality_score": d.data_quality_score,
                    "created_at": d.created_at,
                    "updated_at": d.updated_at,
                    "owner_id": str(d.uploaded_by_id) if d.uploaded_by_id else None
                } for d in datasets],
                "total": total_count,
                "page": skip // limit + 1,
                "pages": (total_count + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch datasets")


# ─── DATASET SUMMARY METRICS ─────────
@router.get("/summary", summary="Dataset summary metrics", dependencies=manager_role_deps)
async def get_manager_datasets_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        tenant_id = current_user.tenant_id
        
        total = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)) or 0
        active = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.ready)) or 0
        processing = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.profiling)) or 0
        failed = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.status == DatasetStatus.error)) or 0
        
        # Average Quality Score
        avg_quality_row = await db.execute(select(func.avg(Dataset.data_quality_score)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.data_quality_score.isnot(None)))
        avg_quality = avg_quality_row.scalar()
        
        return {
            "status": "success",
            "data": {
                "total": total,
                "active": active,
                "processing": processing,
                "failed": failed,
                "avg_quality": round(float(avg_quality), 1) if avg_quality else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch dataset summary")


# ─── DATASET DETAILS ─────────
@router.get("/{dataset_id}", summary="Get dataset details", dependencies=manager_role_deps)
async def get_manager_dataset_details(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        svc = DatasetService(db)
        # Reuse existing logic which validates tenant access
        dataset_response = await svc.get_dataset(dataset_id, current_user)
        return dataset_response
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch dataset details")


# ─── DATASET PREVIEW ─────────
@router.get("/{dataset_id}/preview", summary="Preview dataset rows", dependencies=manager_role_deps)
async def get_manager_dataset_preview(
    dataset_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        svc = DatasetService(db)
        return await svc.get_preview_data(dataset_id, current_user, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch dataset preview")


# ─── DATASET ACTIVITY ─────────
@router.get("/{dataset_id}/activity", summary="Get dataset activity", dependencies=manager_role_deps)
async def get_manager_dataset_activity(
    dataset_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        query = select(AuditLog).where(
            AuditLog.tenant_id == current_user.tenant_id,
            AuditLog.resource_id == str(dataset_id)
        ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        
        logs = (await db.execute(query)).scalars().all()
        
        return {
            "status": "success",
            "data": [{
                "id": str(l.id),
                "action": l.action,
                "status": l.status,
                "created_at": l.created_at,
                "actor_id": str(l.actor_id) if l.actor_id else None
            } for l in logs]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch dataset activity")


# ─── DELETE DATASET ─────────
@router.delete("/{dataset_id}", summary="Delete dataset", status_code=status.HTTP_204_NO_CONTENT, dependencies=manager_role_deps)
async def delete_manager_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        svc = DatasetService(db)
        await svc.delete_dataset(dataset_id, current_user)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete dataset")
