import asyncio
from datetime import datetime, timezone
import uuid
from croniter import croniter

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.report_schedule import ReportSchedule
from app.models.report import Report, ReportStatus, ReportType
from app.worker.celery_app import celery_app
from app.worker.tasks.ai_report_tasks import (
    generate_executive_summary_task,
    generate_ai_analysis_task,
    generate_bi_dashboard_task,
    generate_trend_forecast_task
)

async def _process_schedules_async():
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        # Find schedules that are active and due to run
        stmt = select(ReportSchedule).where(
            ReportSchedule.is_active == True,
            ReportSchedule.next_run_at <= now
        )
        res = await db.execute(stmt)
        schedules = res.scalars().all()
        
        for schedule in schedules:
            # Create the report record
            report = Report(
                tenant_id=schedule.tenant_id,
                workspace_id=uuid.uuid4(), # Fallback if we don't have workspace available
                dataset_id=schedule.dataset_id,
                created_by_id=schedule.created_by_id,
                title=f"{schedule.name} ({now.strftime('%Y-%m-%d %H:%M')})",
                report_type=schedule.report_type,
                status=ReportStatus.generating,
                generation_config={"category": schedule.report_category},
                ai_tokens_used=4000
            )
            db.add(report)
            await db.commit()
            await db.refresh(report)
            
            # Dispatch the corresponding task
            cat = schedule.report_category
            t_id = str(schedule.tenant_id)
            r_id = str(report.id)
            d_id = str(schedule.dataset_id)
            
            if cat == "executive":
                generate_executive_summary_task.delay(t_id, r_id, d_id)
            elif cat == "ai-insight":
                generate_ai_analysis_task.delay(t_id, r_id, d_id)
            elif cat == "dashboard":
                generate_bi_dashboard_task.delay(t_id, r_id, d_id)
            elif cat == "forecast":
                generate_trend_forecast_task.delay(t_id, r_id, d_id)
            
            # Update the schedule's next run time
            if croniter.is_valid(schedule.cron_expression):
                schedule.last_run_at = now
                schedule.next_run_at = croniter(schedule.cron_expression, now).get_next(datetime)
            else:
                schedule.is_active = False # Disable invalid schedules
                
            await db.commit()

@celery_app.task(name="app.worker.tasks.schedule_tasks.process_scheduled_reports")
def process_scheduled_reports():
    """Polled every minute by Celery beat to execute due reports."""
    from asgiref.sync import async_to_sync
    async_to_sync(_process_schedules_async)()
