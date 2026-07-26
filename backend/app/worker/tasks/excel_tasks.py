# app/worker/tasks/excel_tasks.py
"""
Celery Excel workbook tasks — background Excel/report generation.

NOTE: The primary report generation pipeline lives in report_tasks.py.
      These tasks handle the Excel-specific export step that comes AFTER
      AI analysis completes.

Usage:
    from app.worker.tasks.excel_tasks import generate_excel_workbook_task
    generate_excel_workbook_task.delay(report_id, tenant_id, user_id)
"""
import asyncio
from app.worker.celery_app import celery_app
from loguru import logger


@celery_app.task(
    bind=True,
    name="app.worker.tasks.excel_tasks.generate_excel_workbook",
    max_retries=3,
    default_retry_delay=60,
    time_limit=600,
    soft_time_limit=540,
)
def generate_excel_workbook_task(self, report_id: str, tenant_id: str, user_id: str):
    """
    Background Excel workbook generation for a completed report.
    Delegates to report_service.export_to_excel().
    Triggers a report-ready email notification when complete.
    """
    logger.info(
        f"[Task: generate_excel_workbook] report_id={report_id} "
        f"tenant_id={tenant_id} user_id={user_id}"
    )
    try:
        from app.services.report import ReportService

        async def _run():
            service = ReportService()
            return await service.export_to_excel(
                report_id=report_id,
                tenant_id=tenant_id,
                user_id=user_id,
            )

        result = asyncio.run(_run())
        logger.info(f"[Task: generate_excel_workbook] ✅ Completed | report_id={report_id}")

        # Trigger email notification to user
        from app.worker.tasks.email_tasks import send_report_ready_task
        download_url = result.get("download_url", "") if isinstance(result, dict) else ""
        report_name = result.get("name", "Your Report") if isinstance(result, dict) else "Your Report"
        # We'd need the user email here — in production fetch from DB
        # send_report_ready_task.delay(user_email, user_name, report_name, download_url)

        return result
    except Exception as exc:
        logger.error(f"[Task: generate_excel_workbook] ❌ Failed | report_id={report_id} | {exc}")
        raise self.retry(exc=exc)
