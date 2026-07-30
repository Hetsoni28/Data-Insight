# app/worker/tasks/email_tasks.py
"""
Celery email tasks — background email delivery.

These tasks delegate to app.services.email which handles the actual
Resend API call. Running email sends in a Celery worker means a slow
Resend API never blocks an API response.

Usage:
    from app.worker.tasks.email_tasks import send_verification_email_task
    send_verification_email_task.delay(to_email, full_name, otp)
"""
import asyncio
from app.worker.celery_app import celery_app
from loguru import logger


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_verification_email",
    max_retries=3,
    default_retry_delay=30,
)
def send_verification_email_task(self, to_email: str, full_name: str | None, otp: str):
    """Send email verification OTP via Resend (background)."""
    try:
        from app.services.email import send_email_verification

        asyncio.run(send_email_verification(to_email, full_name, otp))
        logger.info(f"[Task: send_verification_email] ✅ Sent to {to_email}")
    except Exception as exc:
        logger.error(f"[Task: send_verification_email] ❌ Failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_password_reset",
    max_retries=3,
    default_retry_delay=30,
)
def send_password_reset_task(self, to_email: str, otp: str):
    """Send password reset OTP via Resend (background)."""
    try:
        from app.services.email import send_password_reset

        asyncio.run(send_password_reset(to_email, otp))
        logger.info(f"[Task: send_password_reset] ✅ Sent to {to_email}")
    except Exception as exc:
        logger.error(f"[Task: send_password_reset] ❌ Failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_welcome_email",
    max_retries=3,
    default_retry_delay=30,
)
def send_welcome_email_task(self, to_email: str, full_name: str | None):
    """Send welcome email after successful verification (background)."""
    try:
        from app.services.email import send_welcome_email

        asyncio.run(send_welcome_email(to_email, full_name))
        logger.info(f"[Task: send_welcome_email] ✅ Sent to {to_email}")
    except Exception as exc:
        logger.error(f"[Task: send_welcome_email] ❌ Failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_report_ready",
    max_retries=3,
    default_retry_delay=30,
)
def send_report_ready_task(
    self, to_email: str, full_name: str | None, report_name: str, report_url: str
):
    """Notify user when their AI report is ready (background)."""
    try:
        from app.services.email import send_report_ready

        asyncio.run(send_report_ready(to_email, full_name, report_name, report_url))
        logger.info(
            f"[Task: send_report_ready] ✅ Sent to {to_email} | report={report_name}"
        )
    except Exception as exc:
        logger.error(f"[Task: send_report_ready] ❌ Failed: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_team_invite",
    max_retries=3,
    default_retry_delay=30,
)
def send_team_invite_task(
    self, to_email: str, invited_by: str, org_name: str, invite_url: str
):
    """Send team invitation email (background)."""
    try:
        from app.services.email import send_team_invite

        asyncio.run(send_team_invite(to_email, invited_by, org_name, invite_url))
        logger.info(f"[Task: send_team_invite] ✅ Sent to {to_email} | org={org_name}")
    except Exception as exc:
        logger.error(f"[Task: send_team_invite] ❌ Failed: {exc}")
        raise self.retry(exc=exc)
