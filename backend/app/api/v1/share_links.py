"""Secure Dataset Sharing API.

Endpoints:
  POST   /share-links                           (auth) create a share link
  GET    /share-links/by-dataset/{dataset_id}   (auth) list links for a dataset
  DELETE /share-links/{token}                   (auth) revoke a link
  PATCH  /share-links/{token}                   (auth) update label/expiry
  GET    /share-links/{token}                   (public) get share page data
  GET    /share-links/{token}/excel-download    (public) proxy AI Excel download
  GET    /share-links/{token}/clean-download    (public) proxy Clean Export download
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_tenant_user, get_db
from app.models.dataset import Dataset, DatasetStatus
from app.models.dataset_share_link import DatasetShareLink
from app.models.user import User

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreateShareLinkRequest(BaseModel):
    dataset_id: uuid.UUID
    label: Optional[str] = None
    expires_at: Optional[datetime] = None
    allow_excel_download: bool = True
    allow_clean_download: bool = True


class UpdateShareLinkRequest(BaseModel):
    label: Optional[str] = None
    expires_at: Optional[datetime] = None
    allow_excel_download: Optional[bool] = None
    allow_clean_download: Optional[bool] = None


def _link_to_dict(link: DatasetShareLink) -> dict:
    return {
        "token": link.token,
        "label": link.label,
        "is_active": link.is_active,
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        "view_count": link.view_count,
        "allow_excel_download": link.allow_excel_download,
        "allow_clean_download": link.allow_clean_download,
        "created_at": link.created_at.isoformat(),
    }


def _check_link_valid(link: DatasetShareLink | None) -> DatasetShareLink:
    """Raise 404 / 410 if link is missing, revoked, or expired."""
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")
    if not link.is_active:
        raise HTTPException(status_code=410, detail="This share link has been revoked")
    if link.expires_at and link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This share link has expired")
    return link


# ── AUTH-PROTECTED ENDPOINTS ──────────────────────────────────────────────────

@router.post("", summary="Create Share Link")
async def create_share_link(
    body: CreateShareLinkRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new secure share link for a dataset. Only org-admin role."""
    tenant_id = current_user.tenant_id

    # Verify dataset belongs to this tenant
    res = await db.execute(
        select(Dataset).where(
            Dataset.id == body.dataset_id,
            Dataset.tenant_id == tenant_id,
            Dataset.is_deleted == False,
        )
    )
    dataset = res.scalars().first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    link = DatasetShareLink(
        dataset_id=body.dataset_id,
        tenant_id=tenant_id,
        created_by_id=current_user.id,
        label=body.label,
        expires_at=body.expires_at,
        allow_excel_download=body.allow_excel_download,
        allow_clean_download=body.allow_clean_download,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return {"status": "success", "data": _link_to_dict(link)}


@router.get("/by-dataset/{dataset_id}", summary="List Share Links for Dataset")
async def list_share_links(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """List all share links for a dataset."""
    tenant_id = current_user.tenant_id

    res = await db.execute(
        select(DatasetShareLink).where(
            DatasetShareLink.dataset_id == dataset_id,
            DatasetShareLink.tenant_id == tenant_id,
        ).order_by(DatasetShareLink.created_at.desc())
    )
    links = res.scalars().all()
    return {"status": "success", "data": [_link_to_dict(lnk) for lnk in links]}


@router.patch("/{token}", summary="Update Share Link")
async def update_share_link(
    token: str,
    body: UpdateShareLinkRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DatasetShareLink).where(
            DatasetShareLink.token == token,
            DatasetShareLink.tenant_id == current_user.tenant_id,
        )
    )
    link = res.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")

    if body.label is not None:
        link.label = body.label
    if body.expires_at is not None:
        link.expires_at = body.expires_at
    if body.allow_excel_download is not None:
        link.allow_excel_download = body.allow_excel_download
    if body.allow_clean_download is not None:
        link.allow_clean_download = body.allow_clean_download

    await db.commit()
    return {"status": "success", "data": _link_to_dict(link)}


@router.delete("/{token}", summary="Revoke Share Link")
async def revoke_share_link(
    token: str,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(DatasetShareLink).where(
            DatasetShareLink.token == token,
            DatasetShareLink.tenant_id == current_user.tenant_id,
        )
    )
    link = res.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")

    link.is_active = False
    await db.commit()
    return {"status": "success", "message": "Share link revoked"}


# ── PUBLIC ENDPOINTS (no auth) ────────────────────────────────────────────────

@router.get("/{token}", summary="Get Share Page Data (Public)")
async def get_share_data(token: str, db: AsyncSession = Depends(get_db)):
    """Returns dataset quality data for the public share page. No auth required."""
    res = await db.execute(
        select(DatasetShareLink).where(DatasetShareLink.token == token)
    )
    link = _check_link_valid(res.scalars().first())

    # Load the dataset
    res2 = await db.execute(
        select(Dataset).where(
            Dataset.id == link.dataset_id,
            Dataset.is_deleted == False,
        )
    )
    dataset = res2.scalars().first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset no longer exists")

    # Increment view count
    link.view_count += 1
    await db.commit()

    profile = dataset.profile or {}
    cols_profile = profile.get("columns", {})

    return {
        "status": "success",
        "data": {
            "dataset_name": dataset.name,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "quality_score": dataset.data_quality_score or profile.get("quality_score"),
            "quality_grade": profile.get("quality_grade"),
            "duplicate_rows": profile.get("duplicate_rows", 0),
            "sparsity_pct": profile.get("sparsity_pct", 0),
            "file_size_bytes": dataset.file_size_bytes,
            "has_excel": bool(
                dataset.excel_url and not dataset.excel_url.startswith("clean_export::")
            ),
            "has_clean_export": bool(
                dataset.excel_url and dataset.excel_url.startswith("clean_export::")
            ),
            "allow_excel_download": link.allow_excel_download,
            "allow_clean_download": link.allow_clean_download,
            "label": link.label,
            "expires_at": link.expires_at.isoformat() if link.expires_at else None,
            "view_count": link.view_count,
            "created_at": link.created_at.isoformat(),
        },
    }


@router.get("/{token}/excel-download", summary="Download AI Excel via Share Link (Public)")
async def share_excel_download(token: str, db: AsyncSession = Depends(get_db)):
    """Proxy the AI Excel download through a share link. No auth required."""
    from app.core.storage import DATASETS_BUCKET, is_local_storage

    res = await db.execute(select(DatasetShareLink).where(DatasetShareLink.token == token))
    link = _check_link_valid(res.scalars().first())

    if not link.allow_excel_download:
        raise HTTPException(status_code=403, detail="Excel download not permitted on this link")

    res2 = await db.execute(select(Dataset).where(Dataset.id == link.dataset_id))
    dataset = res2.scalars().first()
    if not dataset or not dataset.excel_url or dataset.excel_url.startswith("clean_export::"):
        raise HTTPException(status_code=404, detail="AI Excel not generated yet")

    if is_local_storage():
        from fastapi.responses import FileResponse
        from app.core.storage import LOCAL_UPLOADS_DIR
        local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.excel_url
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="Excel file not found")
        safe_name = f"AI_Report_{dataset.name}.xlsx".replace("/", "_")
        return FileResponse(path=str(local_path), filename=safe_name,
                            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    from fastapi.responses import RedirectResponse
    from app.core.storage import get_signed_url
    url = await get_signed_url(DATASETS_BUCKET, dataset.excel_url, expires_in=300)
    return RedirectResponse(url)


@router.get("/{token}/clean-download", summary="Download Clean Export via Share Link (Public)")
async def share_clean_download(token: str, db: AsyncSession = Depends(get_db)):
    """Proxy the Clean Export download through a share link. No auth required."""
    from app.core.storage import DATASETS_BUCKET, is_local_storage

    res = await db.execute(select(DatasetShareLink).where(DatasetShareLink.token == token))
    link = _check_link_valid(res.scalars().first())

    if not link.allow_clean_download:
        raise HTTPException(status_code=403, detail="Clean data download not permitted on this link")

    res2 = await db.execute(select(Dataset).where(Dataset.id == link.dataset_id))
    dataset = res2.scalars().first()
    if not dataset or not dataset.excel_url or not dataset.excel_url.startswith("clean_export::"):
        raise HTTPException(status_code=404, detail="Clean export not generated yet")

    stored_filename = dataset.excel_url.removeprefix("clean_export::")
    is_zip = stored_filename.endswith(".zip")
    media_type = "application/zip" if is_zip else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    if is_local_storage():
        from fastapi.responses import FileResponse
        from app.core.storage import LOCAL_UPLOADS_DIR
        local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / stored_filename
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="Clean export file not found")
        return FileResponse(path=str(local_path), filename=stored_filename, media_type=media_type)

    from fastapi.responses import RedirectResponse
    from app.core.storage import get_signed_url
    url = await get_signed_url(DATASETS_BUCKET, stored_filename, expires_in=300)
    return RedirectResponse(url)
