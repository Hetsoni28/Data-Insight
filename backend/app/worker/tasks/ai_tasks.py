# app/worker/tasks/ai_tasks.py
"""
Celery AI tasks — background AI analysis pipeline.

These tasks delegate to app.services.ai_service for the actual
OpenAI / Anthropic API calls. Running AI analysis in a Celery
worker ensures long-running inference never times out an HTTP request.

Usage:
    from app.worker.tasks.ai_tasks import run_dataset_analysis_task
    run_dataset_analysis_task.delay(dataset_id, tenant_id, user_id)
"""
import asyncio
from app.worker.celery_app import celery_app
from loguru import logger


@celery_app.task(
    bind=True,
    name="app.worker.tasks.ai_tasks.run_dataset_analysis",
    max_retries=2,
    default_retry_delay=120,
    time_limit=600,  # Hard kill after 10 minutes
    soft_time_limit=540,  # Soft warning after 9 minutes
)
def run_dataset_analysis_task(self, dataset_id: str, tenant_id: str, user_id: str):
    """
    Background AI analysis of an uploaded dataset.
    Delegates to ai_service.analyze_dataset().
    """
    logger.info(
        f"[Task: run_dataset_analysis] dataset_id={dataset_id} "
        f"tenant_id={tenant_id} user_id={user_id}"
    )
    try:
        from app.services.ai_service import AIService

        # ai_service methods are async — run in event loop
        # (Celery workers are synchronous by default)
        async def _run():
            service = AIService()
            return await service.analyze_dataset(
                dataset_id=dataset_id,
                tenant_id=tenant_id,
                user_id=user_id,
            )

        result = asyncio.run(_run())
        logger.info(
            f"[Task: run_dataset_analysis] ✅ Completed | dataset_id={dataset_id}"
        )
        return result
    except Exception as exc:
        logger.error(
            f"[Task: run_dataset_analysis] ❌ Failed | dataset_id={dataset_id} | {exc}"
        )
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    name="app.worker.tasks.ai_tasks.generate_report_narrative",
    max_retries=2,
    default_retry_delay=60,
    time_limit=300,
    soft_time_limit=270,
)
def generate_report_narrative_task(self, report_id: str, tenant_id: str, user_id: str):
    """
    Background AI narrative generation for a report.
    Triggers the report-ready email notification when complete.
    """
    logger.info(
        f"[Task: generate_report_narrative] report_id={report_id} "
        f"tenant_id={tenant_id} user_id={user_id}"
    )
    try:
        from app.services.ai_service import AIService

        async def _run():
            service = AIService()
            return await service.generate_narrative(
                report_id=report_id,
                tenant_id=tenant_id,
                user_id=user_id,
            )

        result = asyncio.run(_run())
        logger.info(
            f"[Task: generate_report_narrative] ✅ Completed | report_id={report_id}"
        )
        return result
    except Exception as exc:
        logger.error(
            f"[Task: generate_report_narrative] ❌ Failed | report_id={report_id} | {exc}"
        )
        raise self.retry(exc=exc)
