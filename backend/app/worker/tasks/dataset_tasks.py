"""Celery tasks — Dataset high-speed profiling and AI analysis."""

from __future__ import annotations

import io
import json
import uuid
from loguru import logger
from celery import shared_task


@shared_task(bind=True, name="dataset.profile", max_retries=3, default_retry_delay=30)
def profile_dataset_task(self, dataset_id: str):
    """
    Phase 3: Ingest dataset using Polars engine, run comprehensive
    DuckDB & statistical profiling, and persist results.
    """
    import asyncio

    asyncio.run(_profile_dataset(self, dataset_id))


async def _profile_dataset(task, dataset_id: str):
    import httpx
    from app.db.session import AsyncSessionLocal, engine
    from app.repositories.dataset import DatasetRepository
    from app.models.dataset import DatasetStatus
    from app.core.storage import get_signed_url, DATASETS_BUCKET, is_local_storage, LOCAL_UPLOADS_DIR
    from app.services.ingestion.polars_engine import PolarsEngine
    from app.services.ingestion.profiler import DataProfiler

    try:
        async with AsyncSessionLocal() as session:
            ds_repo = DatasetRepository(session)
            dataset = await ds_repo.get_by_id(uuid.UUID(dataset_id))
            if not dataset:
                logger.error(f"Dataset {dataset_id} not found for profiling")
                return

            try:
                await ds_repo.update_status(dataset, DatasetStatus.profiling)
                await session.commit()

                # Download from Supabase Storage or read from local disk
                if is_local_storage():
                    local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
                    file_bytes = local_path.read_bytes()
                else:
                    signed_url = await get_signed_url(
                        DATASETS_BUCKET, dataset.file_url, expires_in=300
                    )
                    async with httpx.AsyncClient() as client:
                        response = await client.get(signed_url)
                        file_bytes = response.content

                # Get file format extension
                ext = (
                    dataset.file_type.value
                    if hasattr(dataset.file_type, "value")
                    else str(dataset.file_type)
                )
                ext = ext.lower().strip().lstrip(".")

                # 1. High-speed Ingestion via Polars
                df = PolarsEngine.load_from_bytes(file_bytes=file_bytes, file_type=ext)

                # 2. Automated Deep Profiling & Quality Scoring
                profile = DataProfiler.profile_dataframe(df)

                # 3. Persist profile, row count, col count, quality score & mark READY
                await ds_repo.update_profile(
                    dataset,
                    profile=profile,
                    row_count=profile["row_count"],
                    column_count=profile["column_count"],
                    quality_score=profile["quality_score"],
                )
                await session.commit()

                logger.info(
                    f"Dataset {dataset_id} successfully profiled via Polars/DuckDB: "
                    f"{profile['row_count']} rows, {profile['column_count']} cols, "
                    f"quality={profile['quality_score']}/100 (Grade {profile['quality_grade']})"
                )

            except Exception as exc:
                logger.exception(f"Profiling failed for dataset {dataset_id}: {exc}")
                await ds_repo.update_status(
                    dataset, DatasetStatus.error, error_message=str(exc)
                )
                await session.commit()
                raise task.retry(exc=exc)

    except Exception as exc:
        logger.exception(f"Unhandled error in profile_dataset_task for {dataset_id}: {exc}")


@shared_task(bind=True, name="dataset.analyze", max_retries=2, default_retry_delay=60)
def analyze_dataset_task(
    self, dataset_id: str, user_id: str, provider: str = "groq"
):
    """AI deep analysis via Multi-Provider AI (Groq / Gemini) — runs in Celery."""
    import asyncio

    return asyncio.run(_analyze_dataset(self, dataset_id, user_id, provider))


async def _analyze_dataset(task, dataset_id: str, user_id: str, provider: str):
    from app.db.session import AsyncSessionLocal
    from app.repositories.dataset import DatasetRepository
    from app.repositories.user import UserRepository
    from app.services.ai_service import AIService

    async with AsyncSessionLocal() as session:
        ds_repo = DatasetRepository(session)
        user_repo = UserRepository(session)
        dataset = await ds_repo.get_by_id(uuid.UUID(dataset_id))
        user = await user_repo.get_by_id(uuid.UUID(user_id))

        if not dataset or not user:
            return {"error": "Dataset or user not found"}

        ai_svc = AIService(session)
        if dataset.profile:
            result = await ai_svc.generate_narrative(
                dataset_id=uuid.UUID(dataset_id),
                actor=user,
                preferred_provider=provider,
            )
        else:
            result = await ai_svc.copilot_chat(
                question="Provide a high-level business intelligence summary of this dataset.",
                dataset_id=uuid.UUID(dataset_id),
                actor=user,
                preferred_provider=provider,
            )
        await session.commit()
        return result
