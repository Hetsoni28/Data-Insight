import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.report import ReportService
import io


class ReportExportService:
    """Service to handle generating file exports (CSV, JSON, PDF) from Reports."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.report_service = ReportService(session)

    async def generate_export(
        self, report_id: uuid.UUID, format_type: str, actor: User
    ) -> dict:
        """
        Generates an export of the report data.
        Returns a dict with {"content": bytes, "filename": str, "content_type": str}
        """
        report = await self.report_service.get_report(report_id, actor)

        # In reality, this fetches the underlying query config, re-runs via ReportQueryService,
        # and formats the bytes. For now, we simulate the output buffer based on the report data.

        if format_type == "csv":
            content = "region,revenue\\nNorth America,150000\\nEurope,120000".encode(
                "utf-8"
            )
            return {
                "content": content,
                "filename": f"{report.title}.csv",
                "content_type": "text/csv",
            }
        elif format_type == "json":
            content = '[{"region":"North America","revenue":150000},{"region":"Europe","revenue":120000}]'.encode(
                "utf-8"
            )
            return {
                "content": content,
                "filename": f"{report.title}.json",
                "content_type": "application/json",
            }
        else:
            raise ValueError(f"Unsupported format: {format_type}")
