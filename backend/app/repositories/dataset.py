"""DatasetRepository — tenant-scoped dataset queries."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.dataset import Dataset, DatasetStatus
from app.repositories.base import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    def __init__(self, session: AsyncSession):
        super().__init__(Dataset, session)

    async def get_workspace_datasets(
        self,
        tenant_id: uuid.UUID,
        workspace_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dataset]:
        stmt = (
            select(Dataset)
            .where(
                Dataset.tenant_id == tenant_id,
                Dataset.workspace_id == workspace_id,
                Dataset.is_deleted == False,
            )
            .order_by(Dataset.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_tenant_dataset(
        self, tenant_id: uuid.UUID, dataset_id: uuid.UUID
    ) -> Optional[Dataset]:
        stmt = select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.tenant_id == tenant_id,
            Dataset.is_deleted == False,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_tenant_storage_used(self, tenant_id: uuid.UUID) -> int:
        """Returns total file_size_bytes for all non-deleted datasets of this tenant."""
        stmt = select(func.coalesce(func.sum(Dataset.file_size_bytes), 0)).where(
            Dataset.tenant_id == tenant_id, Dataset.is_deleted == False
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def update_status(
        self, dataset: Dataset, status: DatasetStatus, error_message: str | None = None
    ) -> Dataset:
        dataset.status = status
        if error_message:
            dataset.error_message = error_message
        return await self.save(dataset)

    async def update_profile(
        self,
        dataset: Dataset,
        profile: dict,
        row_count: int,
        column_count: int,
        quality_score: int,
    ) -> Dataset:
        dataset.profile = profile
        dataset.row_count = row_count
        dataset.column_count = column_count
        dataset.data_quality_score = quality_score
        dataset.status = DatasetStatus.ready
        return await self.save(dataset)

    async def soft_delete(self, dataset: Dataset) -> Dataset:
        dataset.is_deleted = True
        dataset.deleted_at = datetime.now(timezone.utc)
        return await self.save(dataset)
