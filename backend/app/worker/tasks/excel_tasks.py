# app/worker/tasks/excel_tasks.py
from app.worker.celery_app import celery_app
from loguru import logger


@celery_app.task(
    bind=True,
    name="app.worker.tasks.excel_tasks.generate_excel_workbook",
    max_retries=3,
    default_retry_delay=60,
)
def generate_excel_workbook(self, job_id: str, dataset_id: str, tenant_id: str, user_id: str):
    """
    Celery task: AI Excel workbook generation pipeline (20-step process).
    Phase 8 implementation — placeholder until Excel Generator Module is built.
    """
    logger.info(f"[Task: excel_generation] job_id={job_id} dataset_id={dataset_id}")
    # TODO: Implement 20-step pipeline in Phase 8
    pass
