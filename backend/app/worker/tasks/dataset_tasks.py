"""Celery tasks — Dataset profiling and AI analysis."""

import uuid
import io
import json
from loguru import logger
from celery import shared_task


@shared_task(bind=True, name="dataset.profile", max_retries=3, default_retry_delay=30)
def profile_dataset_task(self, dataset_id: str):
    """
    Phase C1: Load the uploaded dataset from Supabase Storage,
    run Pandas profiling, and save results to the DB.
    """
    import asyncio

    asyncio.run(_profile_dataset(self, dataset_id))


async def _profile_dataset(task, dataset_id: str):
    import pandas as pd
    import numpy as np
    from app.db.session import AsyncSessionLocal
    from app.repositories.dataset import DatasetRepository
    from app.models.dataset import DatasetStatus
    from app.core.storage import get_signed_url, DATASETS_BUCKET
    import httpx

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
            from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR

            if is_local_storage():
                local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
                file_bytes = local_path.read_bytes()
            else:
                signed_url = get_signed_url(
                    DATASETS_BUCKET, dataset.file_url, expires_in=300
                )
                async with httpx.AsyncClient() as client:
                    response = await client.get(signed_url)
                    file_bytes = response.content

            # Load into Pandas
            # file_type may be a string or an Enum depending on DB driver
            ext = (
                dataset.file_type.value
                if hasattr(dataset.file_type, "value")
                else str(dataset.file_type)
            )
            ext = ext.lower().strip()
            if ext == "csv":
                df = pd.read_csv(io.BytesIO(file_bytes))
            elif ext == "xlsx":
                df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
            elif ext == "json":
                df = pd.read_json(io.BytesIO(file_bytes))
            else:
                raise ValueError(f"Unsupported file type: {ext}")

            # Generate profile
            profile = _generate_profile(df)

            # Calculate data quality score
            null_pct = (
                df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
                if df.shape[1] > 0
                else 0
            )
            dup_pct = df.duplicated().sum() / len(df) if len(df) > 0 else 0
            quality_score = max(0, int(100 - (null_pct * 40) - (dup_pct * 30)))

            await ds_repo.update_profile(
                dataset,
                profile=profile,
                row_count=len(df),
                column_count=len(df.columns),
                quality_score=quality_score,
            )
            await session.commit()
            logger.info(
                f"Dataset {dataset_id} profiled: {len(df)} rows, {len(df.columns)} cols, quality={quality_score}"
            )

        except Exception as exc:
            logger.exception(f"Profiling failed for dataset {dataset_id}: {exc}")
            await ds_repo.update_status(
                dataset, DatasetStatus.error, error_message=str(exc)
            )
            await session.commit()
            raise task.retry(exc=exc)


def _generate_profile(df) -> dict:
    """Generate column-level profiling statistics."""
    import pandas as pd
    import numpy as np

    profile = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 3),
        "duplicate_rows": int(df.duplicated().sum()),
        "columns": {},
    }

    for col in df.columns:
        series = df[col]
        col_info = {
            "dtype": str(series.dtype),
            "null_count": int(series.isnull().sum()),
            "null_pct": round(series.isnull().mean() * 100, 2),
            "unique_count": int(series.nunique()),
        }

        if pd.api.types.is_numeric_dtype(series):
            col_info.update(
                {
                    "type": "numeric",
                    "min": _safe_val(series.min()),
                    "max": _safe_val(series.max()),
                    "mean": _safe_val(series.mean()),
                    "median": _safe_val(series.median()),
                    "std": _safe_val(series.std()),
                    "q25": _safe_val(series.quantile(0.25)),
                    "q75": _safe_val(series.quantile(0.75)),
                }
            )
            # Outlier detection using IQR
            q1, q3 = series.quantile(0.25), series.quantile(0.75)
            iqr = q3 - q1
            outliers = series[(series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)]
            col_info["outlier_count"] = len(outliers)

        elif pd.api.types.is_datetime64_any_dtype(series):
            col_info.update(
                {
                    "type": "datetime",
                    "min": str(series.min()),
                    "max": str(series.max()),
                }
            )
        else:
            col_info.update(
                {
                    "type": "categorical",
                    "top_values": series.value_counts().head(10).to_dict(),
                }
            )

        profile["columns"][col] = col_info

    return profile


def _safe_val(v):
    """Convert numpy types to Python native for JSON serialization."""
    import math
    import numpy as np

    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    return v


@shared_task(bind=True, name="dataset.analyze", max_retries=2, default_retry_delay=60)
def analyze_dataset_task(
    self, dataset_id: str, user_id: str, analysis_type: str = "general"
):
    """AI deep analysis via Claude 3.5 Sonnet — runs in Celery."""
    import asyncio

    return asyncio.run(_analyze_dataset(self, dataset_id, user_id, analysis_type))


async def _analyze_dataset(task, dataset_id: str, user_id: str, analysis_type: str):
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

        profile_summary = json.dumps(dataset.profile or {}, indent=2)[:3000]

        ai_svc = AIService(session)
        result = await ai_svc.copilot_chat(
            question=f"Perform a {analysis_type} analysis of this dataset. Profile: {profile_summary}",
            dataset_id=uuid.UUID(dataset_id),
            actor=user,
        )
        await session.commit()
        return result
