"""Supabase Storage helper — upload, download, signed URLs."""

import uuid
import mimetypes
import os
import shutil
from pathlib import Path
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger


def is_local_storage() -> bool:
    return (
        "your-project-id" in settings.SUPABASE_URL
        or "your-supabase-service" in settings.SUPABASE_SERVICE_ROLE_KEY
        or not settings.SUPABASE_URL
    )


_supabase_client: Client | None = None


def _client() -> Client:
    global _supabase_client
    if is_local_storage():
        raise Exception("Using local storage, do not initialize Supabase client.")
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_client


DATASETS_BUCKET = "datasets"
REPORTS_BUCKET = "reports"

LOCAL_UPLOADS_DIR = Path("uploads")


import asyncio


async def upload_file(
    bucket: str,
    file_bytes: bytes,
    destination_path: str,
    content_type: str | None = None,
) -> str:
    """Upload file bytes to Supabase Storage (or local disk fallback). Returns the storage path."""

    def _sync():
        nonlocal content_type
        if not content_type:
            content_type, _ = mimetypes.guess_type(destination_path)
            content_type = content_type or "application/octet-stream"

        if is_local_storage():
            # Fallback to local storage
            local_path = LOCAL_UPLOADS_DIR / bucket / destination_path
            local_path.parent.mkdir(parents=True, exist_ok=True)
            local_path.write_bytes(file_bytes)
            logger.info(f"[Local Storage] Saved file to {local_path}")
            return destination_path

        # Supabase upload
        client = _client()
        client.storage.from_(bucket).upload(
            path=destination_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return destination_path

    return await asyncio.to_thread(_sync)


async def download_file_bytes(bucket: str, path: str) -> bytes:
    """Download a file's bytes from Supabase Storage (or local disk fallback)."""

    def _sync():
        if is_local_storage():
            local_path = LOCAL_UPLOADS_DIR / bucket / path
            if not local_path.exists():
                raise FileNotFoundError(f"File not found: {local_path}")
            return local_path.read_bytes()

        client = _client()
        response = client.storage.from_(bucket).download(path)
        return response

    return await asyncio.to_thread(_sync)


async def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Generate a signed download URL valid for `expires_in` seconds (or local URL fallback)."""

    def _sync():
        if is_local_storage():
            # Fallback to local API endpoint that serves the uploads directory
            logger.info(f"[Local Storage] Generating local URL for {bucket}/{path}")
            return f"/api/v1/storage/{bucket}/{path}"

        client = _client()
        result = client.storage.from_(bucket).create_signed_url(path, expires_in)
        return result["signedURL"]

    return await asyncio.to_thread(_sync)


async def delete_file(bucket: str, path: str) -> None:
    """Delete a file from Supabase Storage (or local disk fallback)."""

    def _sync():
        if is_local_storage():
            local_path = LOCAL_UPLOADS_DIR / bucket / path
            if local_path.exists():
                local_path.unlink()
                logger.info(f"[Local Storage] Deleted file {local_path}")
            return

        client = _client()
        client.storage.from_(bucket).remove([path])

    return await asyncio.to_thread(_sync)


def dataset_storage_path(tenant_id: uuid.UUID, filename: str) -> str:
    """Generate a deterministic storage path for a dataset."""
    safe_name = Path(filename).name.replace(" ", "_")
    return f"{tenant_id}/datasets/{uuid.uuid4()}_{safe_name}"


def report_storage_path(
    tenant_id: uuid.UUID, report_id: uuid.UUID, filename: str
) -> str:
    """Generate a deterministic storage path for a report output."""
    return f"{tenant_id}/reports/{report_id}/{filename}"
