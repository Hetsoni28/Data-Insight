"""ReportRepository — tenant-scoped report queries."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.report import Report, ReportStatus
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report]):
    def __init__(self, session: AsyncSession):
        super().__init__(Report, session)

    async def get_workspace_reports(
        self, tenant_id: uuid.UUID, workspace_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> List[Report]:
        stmt = (
            select(Report)
            .where(
                Report.tenant_id == tenant_id,
                Report.workspace_id == workspace_id,
                Report.is_deleted == False,
            )
            .order_by(Report.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_tenant_report(self, tenant_id: uuid.UUID, report_id: uuid.UUID) -> Optional[Report]:
        stmt = select(Report).where(
            Report.id == report_id,
            Report.tenant_id == tenant_id,
            Report.is_deleted == False,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_celery_task(self, task_id: str) -> Optional[Report]:
        stmt = select(Report).where(Report.celery_task_id == task_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update_status(self, report: Report, status: ReportStatus, progress: int = None, **kwargs) -> Report:
        report.status = status
        if progress is not None:
            report.progress = progress
        for k, v in kwargs.items():
            setattr(report, k, v)
        return await self.save(report)

    async def soft_delete(self, report: Report) -> Report:
        report.is_deleted = True
        report.deleted_at = datetime.now(timezone.utc)
        return await self.save(report)
