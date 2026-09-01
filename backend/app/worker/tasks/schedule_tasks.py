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
            # Fetch dataset to get real workspace_id
            from app.models.dataset import Dataset
            ds_stmt = select(Dataset).where(Dataset.id == schedule.dataset_id)
            ds = (await db.execute(ds_stmt)).scalars().first()
            workspace_id = ds.workspace_id if ds else None

            # Create the report record
            report = Report(
                tenant_id=schedule.tenant_id,
                workspace_id=workspace_id,
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
                
            # Dispatch email!
            dispatch_schedule_email_task.delay(str(schedule.id))
                
            await db.commit()

@celery_app.task(name="app.worker.tasks.schedule_tasks.process_scheduled_reports")
def process_scheduled_reports():
    """Polled every minute by Celery beat to execute due reports."""
    from asgiref.sync import async_to_sync
    async_to_sync(_process_schedules_async)()

@celery_app.task(name="app.worker.tasks.schedule_tasks.dispatch_schedule_email_task")
def dispatch_schedule_email_task(schedule_id: str):
    from asgiref.sync import async_to_sync
    async_to_sync(_dispatch_schedule_email_async)(schedule_id)

async def _dispatch_schedule_email_async(schedule_id: str):
    import os
    import resend
    from app.db.session import AsyncSessionLocal
    from app.models.report_schedule import ReportSchedule
    from app.models.dataset import Dataset
    from app.core.storage import get_signed_url, DATASETS_BUCKET, is_local_storage, LOCAL_UPLOADS_DIR
    import httpx
    
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        resend.api_key = resend_key

    async with AsyncSessionLocal() as db:
        stmt = select(ReportSchedule).where(ReportSchedule.id == schedule_id)
        res = await db.execute(stmt)
        schedule = res.scalars().first()
        if not schedule or not schedule.email_recipients:
            return

        ds_stmt = select(Dataset).where(Dataset.id == schedule.dataset_id)
        ds = (await db.execute(ds_stmt)).scalars().first()
        if not ds:
            return
            
        emails = [e.strip() for e in schedule.email_recipients.split(",") if e.strip()]
        if not emails:
            return

        attachments = []
        fmt = schedule.export_format or "pdf"
        
        async def fetch_file(url, name):
            if is_local_storage():
                path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / url
                if path.exists():
                    return {"filename": name, "content": list(path.read_bytes())}
            else:
                signed = await get_signed_url(DATASETS_BUCKET, url, expires_in=300)
                async with httpx.AsyncClient() as client:
                    r = await client.get(signed)
                    if r.status_code == 200:
                        return {"filename": name, "content": list(r.content)}
            return None

        if fmt in ["pdf", "both"] and ds.pdf_url:
            att = await fetch_file(ds.pdf_url, f"AI_Report_{ds.name}.pdf")
            if att: attachments.append(att)
            
        if fmt in ["excel", "both"] and ds.excel_url:
            att = await fetch_file(ds.excel_url, f"AI_Excel_{ds.name}.xlsx")
            if att: attachments.append(att)

        html_content = f"<h2>Data Insight: Scheduled Report</h2><p>Here is your scheduled report for dataset: <b>{ds.name}</b></p>"
        
        if resend_key:
            for email in emails:
                try:
                    resend.Emails.send({
                        "from": "Data Insight <reports@resend.dev>",
                        "to": email,
                        "subject": f"Scheduled Report: {ds.name}",
                        "html": html_content,
                        "attachments": attachments
                    })
                    print(f"Emailed {email} successfully via Resend.")
                except Exception as e:
                    print(f"Failed to send email to {email}: {e}")
        else:
            print("========================================")
            print(f"MOCK EMAIL SENT TO: {emails}")
            print(f"SUBJECT: Scheduled Report: {ds.name}")
            print(f"ATTACHMENTS: {[a['filename'] for a in attachments]}")
            print("========================================")
