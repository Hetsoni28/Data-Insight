"""Supabase Storage helper — upload, download, signed URLs."""
import uuid
import mimetypes
from pathlib import Path
from supabase import create_client, Client
from app.core.config import settings


def _client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


DATASETS_BUCKET = "datasets"
REPORTS_BUCKET = "reports"


def upload_file(
    bucket: str,
    file_bytes: bytes,
    destination_path: str,
    content_type: str | None = None,
) -> str:
    """Upload file bytes to Supabase Storage. Returns the storage path."""
    client = _client()
    if not content_type:
        content_type, _ = mimetypes.guess_type(destination_path)
        content_type = content_type or "application/octet-stream"

    client.storage.from_(bucket).upload(
        path=destination_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return destination_path


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """Generate a signed download URL valid for `expires_in` seconds."""
    client = _client()
    result = client.storage.from_(bucket).create_signed_url(path, expires_in)
    return result["signedURL"]


def delete_file(bucket: str, path: str) -> None:
    """Delete a file from Supabase Storage."""
    client = _client()
    client.storage.from_(bucket).remove([path])


def dataset_storage_path(tenant_id: uuid.UUID, filename: str) -> str:
    """Generate a deterministic storage path for a dataset."""
    safe_name = Path(filename).name.replace(" ", "_")
    return f"{tenant_id}/datasets/{uuid.uuid4()}_{safe_name}"


def report_storage_path(tenant_id: uuid.UUID, report_id: uuid.UUID, filename: str) -> str:
    """Generate a deterministic storage path for a report output."""
    return f"{tenant_id}/reports/{report_id}/{filename}"
