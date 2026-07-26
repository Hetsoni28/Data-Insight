"""Dataset upload and management endpoints."""
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.schemas.dataset import DatasetResponse, DatasetProfileResponse, DatasetUploadResponse
from app.services.dataset import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=202,
    summary="Upload a dataset file (CSV / XLSX / JSON)",
)
async def upload_dataset(
    workspace_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    name: str | None = Form(None),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
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


@router.get("/{dataset_id}", response_model=DatasetProfileResponse, summary="Get dataset with profile")
async def get_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    return await svc.get_dataset(dataset_id, current_user)


@router.get("/{dataset_id}/download-url", summary="Get signed download URL for dataset file")
async def get_download_url(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    url = await svc.get_preview_url(dataset_id, current_user)
    return {"download_url": url, "expires_in_seconds": 900}


@router.delete("/{dataset_id}", status_code=204, summary="Delete dataset")
async def delete_dataset(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = DatasetService(db)
    await svc.delete_dataset(dataset_id, current_user)
