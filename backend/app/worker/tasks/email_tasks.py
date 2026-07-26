# app/worker/tasks/email_tasks.py
from app.worker.celery_app import celery_app
from loguru import logger


@celery_app.task(
    bind=True,
    name="app.worker.tasks.email_tasks.send_email",
    max_retries=3,
    default_retry_delay=30,
)
def send_email(self, to: str, subject: str, html_content: str):
    """Phase 11 — placeholder. Full Resend integration implemented in Phase 11."""
    logger.info(f"[Task: send_email] to={to} subject={subject}")
    pass
