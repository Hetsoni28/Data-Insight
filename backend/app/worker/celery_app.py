# app/worker/celery_app.py
from celery import Celery
from app.core.config import settings

# --- Celery Application ---
celery_app = Celery(
    "data_insight",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.worker.tasks.dataset_tasks",
        "app.worker.tasks.excel_tasks",
        "app.worker.tasks.report_tasks",
        "app.worker.tasks.ai_report_tasks",
        "app.worker.tasks.email_tasks",
        "app.worker.tasks.schedule_tasks",
    ],
)

# --- Celery Configuration ---
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    result_expires=86400,
    task_max_retries=3,
    task_default_retry_delay=60,
    task_annotations={
        "app.worker.tasks.dataset_tasks.*": {"rate_limit": "20/m"},
        "app.worker.tasks.excel_tasks.*": {"rate_limit": "5/m"},
        "app.worker.tasks.report_tasks.*": {"rate_limit": "5/m"},
        "app.worker.tasks.email_tasks.*": {"rate_limit": "30/m"},
    },
    task_routes={
        "app.worker.tasks.dataset_tasks.*": {"queue": "datasets"},
        "app.worker.tasks.excel_tasks.*": {"queue": "datasets"},
        "app.worker.tasks.report_tasks.*": {"queue": "reports"},
        "app.worker.tasks.email_tasks.*": {"queue": "emails"},
        "app.worker.tasks.schedule_tasks.*": {"queue": "reports"},
    },
    beat_schedule={
        "process-scheduled-reports-every-minute": {
            "task": "app.worker.tasks.schedule_tasks.process_scheduled_reports",
            "schedule": 60.0,
        },
    }
)

# Removed dangerous signal handlers that cause MissingGreenlet errors
