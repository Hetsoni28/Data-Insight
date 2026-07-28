# app/worker/celery_app.py
from celery import Celery
from app.core.config import settings

# ─── Celery Application ───────────────────────────────────────────────────────
celery_app = Celery(
    "data_insight",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.worker.tasks.dataset_tasks",
        "app.worker.tasks.report_tasks",
        "app.worker.tasks.email_tasks",
        "app.worker.tasks.ai_tasks",
        "app.worker.tasks.excel_tasks",
    ]
)

# ─── Celery Configuration ─────────────────────────────────────────────────────
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Task Behavior
    task_acks_late=True,           # Only ack after task completes (safe for retries)
    task_reject_on_worker_lost=True,
    task_track_started=True,       # Mark task as STARTED when picked up

    # Result Expiry (keep results for 24 hours)
    result_expires=86400,

    # Retry Policy
    task_max_retries=3,
    task_default_retry_delay=60,   # 60 seconds between retries

    # Rate Limiting
    task_annotations={
        "app.worker.tasks.dataset_tasks.*": {"rate_limit": "20/m"},
        "app.worker.tasks.report_tasks.*":  {"rate_limit": "5/m"},
        "app.worker.tasks.email_tasks.*":   {"rate_limit": "30/m"},
        "app.worker.tasks.ai_tasks.*":      {"rate_limit": "10/m"},
        "app.worker.tasks.excel_tasks.*":   {"rate_limit": "5/m"},
    },

    # Routing — separate queues per workload type
    task_routes={
        "app.worker.tasks.dataset_tasks.*": {"queue": "datasets"},
        "app.worker.tasks.report_tasks.*":  {"queue": "reports"},
        "app.worker.tasks.email_tasks.*":   {"queue": "emails"},
        "app.worker.tasks.ai_tasks.*":      {"queue": "ai"},
        "app.worker.tasks.excel_tasks.*":   {"queue": "reports"},
    },
)

from celery.signals import task_prerun, task_postrun

@task_prerun.connect
def cleanup_session_before_task(task_id, task, *args, **kwargs):
    from app.db.session import engine
    engine.sync_engine.dispose()

@task_postrun.connect
def cleanup_session_after_task(task_id, task, *args, **kwargs):
    from app.db.session import engine
    # Dispose the sync engine synchronously after every task finishes.
    # This prevents SQLAlchemy from keeping asyncpg connections in the pool
    # that are tied to the asyncio event loop that was just closed by asyncio.run()
    engine.sync_engine.dispose()
