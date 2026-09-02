import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.models.user import User
from app.models.report_schedule import ReportSchedule


class ReportScheduleService:
    """Service to handle CRUD operations and Celery task dispatches for ReportSchedules."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_schedules(self, actor: User) -> list[ReportSchedule]:
        stmt = select(ReportSchedule).where(ReportSchedule.tenant_id == actor.tenant_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_schedule(
        self, dataset_id: uuid.UUID, cron_expression: str, name: str, actor: User
    ) -> ReportSchedule:
        schedule = ReportSchedule(
            tenant_id=actor.tenant_id,
            created_by_id=actor.id,
            dataset_id=dataset_id,
            name=name,
            cron_expression=cron_expression,
            next_run_at=datetime.now(timezone.utc),
        )
        self.session.add(schedule)
        await self.session.commit()
        await self.session.refresh(schedule)
        return schedule

    async def delete_schedule(self, schedule_id: uuid.UUID, actor: User) -> None:
        stmt = select(ReportSchedule).where(
            ReportSchedule.id == schedule_id,
            ReportSchedule.tenant_id == actor.tenant_id,
        )
        result = await self.session.execute(stmt)
        schedule = result.scalar_one_or_none()
        if schedule:
            await self.session.delete(schedule)
            await self.session.commit()
