import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api import deps
from app.models.user import User
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.models.chart import Chart
from app.models.dataset import Dataset
from app.schemas.tenant_charts import ChartCreate, ChartUpdate, ChartResponse, ChartListResponse

router = APIRouter()

@router.post("/", response_model=ChartResponse)
async def create_chart(
    *,
    db: AsyncSession = Depends(deps.get_db),
    chart_in: ChartCreate,
    current_user: User = Depends(deps.get_current_active_tenant_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """
    Create a new chart in the current workspace.
    """
    if not current_workspace:
        raise HTTPException(status_code=400, detail="Workspace context header x-workspace-id is required")
    dataset_result = await db.execute(
        select(Dataset).where(
            Dataset.id == chart_in.dataset_id,
            Dataset.tenant_id == current_user.tenant_id,
            Dataset.workspace_id == current_workspace.id,
            Dataset.is_deleted == False
        )
    )
    dataset = dataset_result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied")

    chart = Chart(
        **chart_in.model_dump(),
        tenant_id=current_user.tenant_id,
        workspace_id=current_workspace.id,
        created_by_id=current_user.id,
    )
    db.add(chart)
    await db.commit()
    await db.refresh(chart)
    return chart

@router.get("/", response_model=ChartListResponse)
async def read_charts(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = None,
    dataset_id: uuid.UUID = None,
    current_user: User = Depends(deps.get_current_active_tenant_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """
    Retrieve charts.
    """
    if not current_workspace:
        raise HTTPException(status_code=400, detail="Workspace context header x-workspace-id is required")
    query = select(Chart).where(
        Chart.tenant_id == current_user.tenant_id,
        Chart.workspace_id == current_workspace.id,
        Chart.is_deleted == False
    )

    if search:
        query = query.where(Chart.name.ilike(f"%{search}%"))
        
    if dataset_id:
        query = query.where(Chart.dataset_id == dataset_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Get items
    query = query.order_by(desc(Chart.updated_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return {"items": items, "total": total}

@router.get("/{chart_id}", response_model=ChartResponse)
async def read_chart(
    chart_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_tenant_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """
    Get chart by ID.
    """
    if not current_workspace:
        raise HTTPException(status_code=400, detail="Workspace context header x-workspace-id is required")
    result = await db.execute(
        select(Chart).where(
            Chart.id == chart_id,
            Chart.tenant_id == current_user.tenant_id,
            Chart.workspace_id == current_workspace.id,
            Chart.is_deleted == False
        )
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
        
    # Increment view count
    chart.view_count += 1
    db.add(chart)
    await db.commit()
    await db.refresh(chart)
    
    return chart

@router.put("/{chart_id}", response_model=ChartResponse)
async def update_chart(
    chart_id: uuid.UUID,
    chart_in: ChartUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_tenant_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """
    Update a chart.
    """
    if not current_workspace:
        raise HTTPException(status_code=400, detail="Workspace context header x-workspace-id is required")
    result = await db.execute(
        select(Chart).where(
            Chart.id == chart_id,
            Chart.tenant_id == current_user.tenant_id,
            Chart.workspace_id == current_workspace.id,
            Chart.is_deleted == False
        )
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    update_data = chart_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chart, field, value)

    db.add(chart)
    await db.commit()
    await db.refresh(chart)
    return chart

@router.delete("/{chart_id}")
async def delete_chart(
    chart_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_tenant_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """
    Delete a chart (soft delete).
    """
    if not current_workspace:
        raise HTTPException(status_code=400, detail="Workspace context header x-workspace-id is required")
    result = await db.execute(
        select(Chart).where(
            Chart.id == chart_id,
            Chart.tenant_id == current_user.tenant_id,
            Chart.workspace_id == current_workspace.id,
            Chart.is_deleted == False
        )
    )
    chart = result.scalar_one_or_none()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    chart.is_deleted = True
    db.add(chart)
    await db.commit()
    
    return {"status": "success", "message": "Chart deleted successfully"}
