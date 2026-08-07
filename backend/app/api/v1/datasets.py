"""Dataset upload, profiling, and interactive analytical query endpoints."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.schemas.dataset import (
    DatasetResponse,
    DatasetProfileResponse,
    DatasetUploadResponse,
    DatasetPreviewResponse,
    DatasetCorrelationsResponse,
    DatasetQueryRequest,
    DatasetQueryResponse,
)
from app.services.dataset import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=202,
    summary="Upload a dataset file (CSV / XLSX / JSON / Parquet / TSV)",
)
async def upload_dataset(
    workspace_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    name: str | None = Form(None),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload dataset and trigger async Polars/DuckDB profiling."""
    file_bytes = await file.read()
    svc = DatasetService(db)
    dataset = await svc.upload_dataset(
        workspace_id=workspace_id,
        filename=file.filename or "upload",
        file_bytes=file_bytes,
        actor=current_user,
        name=name,
        description=description,
    )
    return dataset


@router.get(
    "",
    response_model=list[DatasetResponse],
    summary="List datasets in a workspace",
)
async def list_datasets(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    return await svc.list_datasets(workspace_id, current_user)


@router.get(
    "/{dataset_id}",
    response_model=DatasetProfileResponse,
    summary="Get dataset with statistical profile and quality score",
)
async def get_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    return await svc.get_dataset(dataset_id, current_user)


@router.get(
    "/{dataset_id}/preview",
    response_model=DatasetPreviewResponse,
    summary="Preview top rows and column schemas of dataset",
)
async def get_dataset_preview(
    dataset_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=500),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    return await svc.get_preview_data(dataset_id, current_user, limit=limit)


@router.get(
    "/{dataset_id}/correlations",
    response_model=DatasetCorrelationsResponse,
    summary="Get numeric Pearson correlation matrix",
)
async def get_dataset_correlations(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    return await svc.get_correlations(dataset_id, current_user)


@router.post(
    "/{dataset_id}/query",
    response_model=DatasetQueryResponse,
    summary="Execute an interactive SQL analytical query via DuckDB",
)
async def execute_dataset_query(
    dataset_id: uuid.UUID,
    req: DatasetQueryRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute high-speed in-memory DuckDB query against dataset with safety guards."""
    svc = DatasetService(db)
    return await svc.execute_query(
        dataset_id=dataset_id,
        sql=req.sql,
        actor=current_user,
        limit=req.limit,
        offset=req.offset,
    )


@router.get(
    "/{dataset_id}/download-url",
    summary="Get signed download URL for dataset file",
)
async def get_download_url(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    url = await svc.get_preview_url(dataset_id, current_user)
    return {"download_url": url, "expires_in_seconds": 900}


@router.delete(
    "/{dataset_id}",
    status_code=204,
    summary="Delete dataset",
)
async def delete_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    await svc.delete_dataset(dataset_id, current_user)
