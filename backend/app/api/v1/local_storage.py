"""Local file storage serve endpoint — streams uploaded files when Supabase is not configured."""

import mimetypes
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

LOCAL_UPLOADS_DIR = Path("uploads")


@router.get(
    "/storage/{bucket}/{path:path}",
    summary="Serve a locally-stored file (dev fallback when Supabase is not configured)",
    include_in_schema=True,
)
async def serve_local_file(bucket: str, path: str):
    """Streams a file from the local uploads directory.
    This endpoint is the fallback used when Supabase Storage is not configured.
    The path mirrors what get_signed_url() returns for local mode:
        /api/v1/storage/{bucket}/{path}
    """
    file_path = LOCAL_UPLOADS_DIR / bucket / path

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {bucket}/{path}")

    # Guess the media type from the file extension
    media_type, _ = mimetypes.guess_type(str(file_path))
    media_type = media_type or "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=file_path.name,
    )
