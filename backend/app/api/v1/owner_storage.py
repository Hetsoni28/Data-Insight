from typing import Any
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.storage import StorageBucket, StorageFile, StorageBackup, StorageLifecyclePolicy, StorageActivityLog

router = APIRouter(prefix="/owner/storage", tags=["owner-storage"])

def require_owner(current_user: User = Depends(get_current_user)):
    # Fallback to is_owner
    if getattr(current_user, 'role', '') != 'owner' and not getattr(current_user, 'is_owner', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get live KPIs for the Storage Command Center."""
    # Total storage used (bytes)
    total_size = await db.scalar(select(func.sum(StorageFile.file_size_bytes)).where(StorageFile.deleted_at.is_(None)))
    total_size = int(total_size or 0)
    
    # Total files
    total_files = await db.scalar(select(func.count(StorageFile.id)).where(StorageFile.deleted_at.is_(None)))
    
    # Active buckets
    total_buckets = await db.scalar(select(func.count(StorageBucket.id)))
    
    # Storage by category
    categories_res = await db.execute(
        select(StorageFile.category, func.count(StorageFile.id))
        .where(StorageFile.deleted_at.is_(None))
        .group_by(StorageFile.category)
    )
    category_counts = {cat: count for cat, count in categories_res.all()}
    
    # Backups
    total_backups = await db.scalar(select(func.count(StorageBackup.id)).where(StorageBackup.status == "completed"))
    
    # Calculate costs (fake rate $0.023 per GB)
    gb_used = float(total_size) / (1024**3)
    storage_cost = gb_used * 0.023
    
    return {
        "kpis": {
            "total_storage_bytes": total_size,
            "total_storage_gb": round(gb_used, 2),
            "total_files": total_files or 0,
            "active_buckets": total_buckets or 0,
            "total_backups": total_backups or 0,
            "storage_cost_usd": round(storage_cost, 2),
            "categories": {
                "dataset": category_counts.get("data", 0) + category_counts.get("spreadsheet", 0),
                "report": category_counts.get("document", 0),
                "ai_generated": category_counts.get("ai_generated", 0) + category_counts.get("other", 0),
                "image": category_counts.get("image", 0)
            }
        }
    }


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get timeseries analytics for storage growth."""
    # Just generating a 30-day fake trend based on current total for demo,
    # or we can query actual file created_at if we had time-series points.
    # To be fully dynamic, we group by day for the last 30 days.
    
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Growth by day
    growth_query = (
        select(
            func.date_trunc('day', StorageFile.created_at).label('day'),
            func.sum(StorageFile.file_size_bytes).label('size')
        )
        .where(StorageFile.created_at >= thirty_days_ago)
        .where(StorageFile.deleted_at.is_(None))
        .group_by('day')
        .order_by('day')
    )
    growth_res = await db.execute(growth_query)
    
    trends = []
    cumulative = 0
    for row in growth_res.all():
        cumulative += int(row.size or 0)
        trends.append({
            "date": row.day.strftime("%Y-%m-%d"),
            "daily_bytes": int(row.size or 0),
            "cumulative_bytes": cumulative
        })
        
    return {"trends": trends}


@router.get("/organizations")
async def get_organization_storage(
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get storage usage grouped by tenant."""
    # Query tenants and join with storage_files
    query = (
        select(
            Tenant.id,
            Tenant.name,
            Tenant.max_storage_gb,
            func.sum(StorageFile.file_size_bytes).label('used_bytes'),
            func.count(StorageFile.id).label('file_count')
        )
        .outerjoin(StorageFile, and_(Tenant.id == StorageFile.tenant_id, StorageFile.deleted_at.is_(None)))
        .group_by(Tenant.id)
        .order_by(desc('used_bytes'))
        .limit(limit)
    )
    result = await db.execute(query)
    
    orgs = []
    for row in result.all():
        used_bytes = int(row.used_bytes or 0)
        used_gb = used_bytes / (1024**3)
        max_gb = float(row.max_storage_gb or 5)
        percent_used = (used_gb / max_gb) * 100 if max_gb > 0 else 0
        
        orgs.append({
            "id": str(row.id),
            "name": row.name,
            "used_bytes": used_bytes,
            "max_storage_gb": max_gb,
            "file_count": row.file_count,
            "percent_used": min(round(percent_used, 1), 100)
        })
        
    return {"organizations": orgs}


@router.get("/buckets")
async def get_buckets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get all storage buckets and their stats."""
    query = (
        select(
            StorageBucket,
            func.count(StorageFile.id).label('file_count'),
            func.sum(StorageFile.file_size_bytes).label('total_bytes')
        )
        .outerjoin(StorageFile, and_(StorageBucket.id == StorageFile.bucket_id, StorageFile.deleted_at.is_(None)))
        .group_by(StorageBucket.id)
        .order_by(StorageBucket.name)
    )
    result = await db.execute(query)
    
    buckets = []
    for bucket, count, size in result.all():
        buckets.append({
            "id": str(bucket.id),
            "name": bucket.name,
            "type": bucket.bucket_type,
            "is_public": bucket.is_public,
            "region": bucket.region,
            "file_count": count or 0,
            "total_bytes": int(size or 0),
            "created_at": bucket.created_at.isoformat() if bucket.created_at else None
        })
        
    return {"buckets": buckets}


@router.get("/files")
async def get_files(
    q: str = None,
    bucket_id: str = None,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get file explorer data."""
    query = select(StorageFile, StorageBucket.name.label('bucket_name'), Tenant.name.label('tenant_name')).outerjoin(StorageBucket).outerjoin(Tenant).where(StorageFile.deleted_at.is_(None))
    
    if q:
        query = query.where(StorageFile.file_name.ilike(f"%{q}%"))
    if bucket_id:
        query = query.where(StorageFile.bucket_id == bucket_id)
        
    query = query.order_by(desc(StorageFile.created_at)).limit(limit)
    result = await db.execute(query)
    
    files = []
    for row in result.all():
        f = row.StorageFile
        files.append({
            "id": str(f.id),
            "file_name": f.file_name,
            "file_type": f.file_type,
            "category": f.category,
            "size_bytes": int(f.file_size_bytes or 0),
            "is_public": f.is_public,
            "bucket_name": row.bucket_name,
            "tenant_name": row.tenant_name,
            "created_at": f.created_at.isoformat() if f.created_at else None
        })
        
    return {"files": files}


@router.get("/backups")
async def get_backups(
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get backup center status."""
    result = await db.execute(
        select(StorageBackup)
        .order_by(desc(StorageBackup.started_at))
        .limit(limit)
    )
    backups = result.scalars().all()
    
    return {
        "backups": [
            {
                "id": str(b.id),
                "name": b.name,
                "type": b.type,
                "status": b.status,
                "size_bytes": int(b.size_bytes or 0),
                "is_automated": b.is_automated,
                "created_at": b.started_at.isoformat() if b.started_at else None,
                "completed_at": b.completed_at.isoformat() if b.completed_at else None
            }
            for b in backups
        ]
    }


@router.get("/activity")
async def get_activity(
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get storage activity log."""
    query = (
        select(StorageActivityLog, Tenant.name.label('tenant_name'))
        .outerjoin(Tenant)
        .order_by(desc(StorageActivityLog.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    
    activities = []
    for row in result.all():
        a = row.StorageActivityLog
        activities.append({
            "id": str(a.id),
            "action": a.action,
            "resource_type": a.resource_type,
            "tenant_name": row.tenant_name,
            "metadata": a.metadata_json,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
        
    return {"activities": activities}


@router.get("/security")
async def get_security(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get security overview for storage."""
    
    # Public vs Private files
    public_count = await db.scalar(select(func.count(StorageFile.id)).where(StorageFile.is_public == True, StorageFile.deleted_at.is_(None)))
    private_count = await db.scalar(select(func.count(StorageFile.id)).where(StorageFile.is_public == False, StorageFile.deleted_at.is_(None)))
    
    # Encrypted files (assuming all new ones are true by default)
    encrypted_count = await db.scalar(select(func.count(StorageFile.id)).where(StorageFile.is_encrypted == True, StorageFile.deleted_at.is_(None)))
    
    total = (public_count or 0) + (private_count or 0)
    
    return {
        "security": {
            "public_files": public_count or 0,
            "private_files": private_count or 0,
            "encrypted_files": encrypted_count or 0,
            "unencrypted_files": total - (encrypted_count or 0),
            "malware_scanned_files": await db.scalar(select(func.count(StorageFile.id)).where(StorageFile.is_malware_scanned == True)) or 0,
            "health_score": 98 if (public_count or 0) < total * 0.1 else 85
        }
    }
