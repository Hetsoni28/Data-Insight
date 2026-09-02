"""ReportService — AI Excel generation pipeline orchestration."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ForbiddenException,
    ResourceNotFoundException,
)
from app.models.report import Report, ReportStatus, ReportType
from app.models.user import User, UserRole
from app.repositories.audit_log import AuditLogRepository
from app.repositories.dataset import DatasetRepository
from app.repositories.report import ReportRepository
from app.repositories.workspace import WorkspaceRepository


class ReportService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_repo = ReportRepository(session)
        self.dataset_repo = DatasetRepository(session)
        self.ws_repo = WorkspaceRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def generate_report(
        self,
        dataset_id: uuid.UUID,
        actor: User,
        title: str | None = None,
        report_type: ReportType = ReportType.excel,
        generation_config: dict | None = None,
    ) -> Report:
        if not actor.tenant_id:
            raise ForbiddenException("You must belong to an organization.")

        # Validate dataset access
        dataset = await self.dataset_repo.get_tenant_dataset(
            actor.tenant_id, dataset_id,
        )
        if not dataset:
            raise ResourceNotFoundException("Dataset", str(dataset_id))

        from app.models.dataset import DatasetStatus

        if dataset.status != DatasetStatus.ready:
            raise ForbiddenException(
                "Dataset must finish profiling before generating a report.",
            )

        # Check AI token quota
        from app.repositories.tenant import TenantRepository

        tenant_repo = TenantRepository(self.session)
        await tenant_repo.get_by_id(actor.tenant_id)

        report = Report(
            tenant_id=actor.tenant_id,
            workspace_id=dataset.workspace_id,
            dataset_id=dataset_id,
            created_by_id=actor.id,
            title=title or f"AI Report — {dataset.name}",
            report_type=report_type,
            status=ReportStatus.queued,
            generation_config=generation_config or {},
            progress=0,
        )
        report = await self.report_repo.save(report)

        # Launch Celery pipeline
        from app.worker.tasks.report_tasks import generate_excel_report_task

        task = generate_excel_report_task.delay(str(report.id))
        report.celery_task_id = task.id
        await self.report_repo.save(report)

        await self.audit_repo.log(
            "report.generate",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="report",
            resource_id=str(report.id),
        )
        return report

    async def list_reports(self, workspace_id: uuid.UUID, actor: User) -> list[Report]:
        if not actor.tenant_id:
            return []
        return await self.report_repo.get_workspace_reports(
            actor.tenant_id, workspace_id,
        )

    async def get_report(self, report_id: uuid.UUID, actor: User) -> Report:
        report = await self.report_repo.get_tenant_report(actor.tenant_id, report_id)
        if not report:
            raise ResourceNotFoundException("Report", str(report_id))
        return report

    async def approve_report(
        self, report_id: uuid.UUID, actor: User, notes: str | None = None,
    ) -> Report:
        if actor.role not in (UserRole.owner, UserRole.org_admin):
            raise ForbiddenException("Only Owners and Admins can approve reports.")
        report = await self.get_report(report_id, actor)
        if report.status != ReportStatus.review:
            raise ForbiddenException("Only reports in 'review' status can be approved.")
        from datetime import datetime, timezone

        report.status = ReportStatus.approved
        report.approved_by_id = actor.id
        report.approved_at = datetime.now(timezone.utc)
        report.approval_notes = notes
        await self.report_repo.save(report)
        await self.audit_repo.log(
            "report.approve",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="report",
            resource_id=str(report.id),
        )
        return report

    async def delete_report(self, report_id: uuid.UUID, actor: User) -> None:
        report = await self.get_report(report_id, actor)
        await self.report_repo.soft_delete(report)
        await self.audit_repo.log(
            "report.delete",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="report",
            resource_id=str(report.id),
        )
