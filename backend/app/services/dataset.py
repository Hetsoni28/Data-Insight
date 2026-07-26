"""DatasetService — file upload, profiling trigger, and management."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset, DatasetStatus, DatasetFileType
from app.models.user import User
from app.repositories.dataset import DatasetRepository
from app.repositories.workspace import WorkspaceRepository
from app.repositories.audit_log import AuditLogRepository
from app.core.storage import upload_file, dataset_storage_path, get_signed_url, delete_file, DATASETS_BUCKET
from app.core.exceptions import (
    ResourceNotFoundException, ForbiddenException,
    ValidationException, StorageQuotaExceededException,
)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".json"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB hard limit per file

EXTENSION_TO_TYPE = {
    ".csv": DatasetFileType.csv,
    ".xlsx": DatasetFileType.xlsx,
    ".json": DatasetFileType.json,
}


class DatasetService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dataset_repo = DatasetRepository(session)
        self.ws_repo = WorkspaceRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def upload_dataset(
        self,
        workspace_id: uuid.UUID,
        filename: str,
        file_bytes: bytes,
        actor: User,
        name: str | None = None,
        description: str | None = None,
    ) -> Dataset:
        from pathlib import Path

        if not actor.tenant_id:
            raise ForbiddenException("You must belong to an organization.")

        # Validate workspace ownership
        ws = await self.ws_repo.get_tenant_workspace(actor.tenant_id, workspace_id)
        if not ws:
            raise ResourceNotFoundException("Workspace", str(workspace_id))

        # Validate file type
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationException(f"File type '{ext}' not supported. Allowed: CSV, XLSX, JSON.")

        # Validate file size
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise ValidationException("File exceeds the 100 MB size limit.")

        # Check storage quota
        from app.models.tenant import Tenant
        from app.repositories.tenant import TenantRepository
        tenant_repo = TenantRepository(self.session)
        tenant = await tenant_repo.get_by_id(actor.tenant_id)
        used_bytes = await self.dataset_repo.get_tenant_storage_used(actor.tenant_id)
        quota_bytes = (tenant.max_storage_gb or 5) * 1024 * 1024 * 1024
        if used_bytes + len(file_bytes) > quota_bytes:
            raise StorageQuotaExceededException()

        # Upload to Supabase Storage
        storage_path = dataset_storage_path(actor.tenant_id, filename)
        upload_file(DATASETS_BUCKET, file_bytes, storage_path)

        # Create dataset record
        dataset = Dataset(
            tenant_id=actor.tenant_id,
            workspace_id=workspace_id,
            uploaded_by_id=actor.id,
            name=name or Path(filename).stem,
            description=description,
            file_type=EXTENSION_TO_TYPE[ext],
            file_url=storage_path,
            file_size_bytes=len(file_bytes),
            original_filename=filename,
            status=DatasetStatus.profiling,
        )
        dataset = await self.dataset_repo.save(dataset)

        # Trigger Celery profiling task
        from app.worker.tasks.dataset_tasks import profile_dataset_task
        task = profile_dataset_task.delay(str(dataset.id))
        dataset.celery_task_id = task.id
        await self.dataset_repo.save(dataset)

        await self.audit_repo.log(
            "dataset.upload",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="dataset",
            resource_id=str(dataset.id),
            extra_metadata={"filename": filename, "size_bytes": len(file_bytes)},
        )
        return dataset

    async def list_datasets(self, workspace_id: uuid.UUID, actor: User) -> list[Dataset]:
        if not actor.tenant_id:
            return []
        return await self.dataset_repo.get_workspace_datasets(actor.tenant_id, workspace_id)

    async def get_dataset(self, dataset_id: uuid.UUID, actor: User) -> Dataset:
        ds = await self.dataset_repo.get_tenant_dataset(actor.tenant_id, dataset_id)
        if not ds:
            raise ResourceNotFoundException("Dataset", str(dataset_id))
        return ds

    async def get_preview_url(self, dataset_id: uuid.UUID, actor: User) -> str:
        ds = await self.get_dataset(dataset_id, actor)
        return get_signed_url(DATASETS_BUCKET, ds.file_url, expires_in=900)  # 15 min

    async def delete_dataset(self, dataset_id: uuid.UUID, actor: User) -> None:
        ds = await self.get_dataset(dataset_id, actor)
        # Delete from Supabase Storage
        try:
            delete_file(DATASETS_BUCKET, ds.file_url)
        except Exception:
            pass  # Log but don't fail if storage delete fails
        await self.dataset_repo.soft_delete(ds)
        await self.audit_repo.log("dataset.delete", tenant_id=actor.tenant_id, user_id=actor.id,
                                  resource_type="dataset", resource_id=str(ds.id))
