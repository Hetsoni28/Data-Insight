"""DatasetService — file upload, profiling trigger, and management."""

import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset import Dataset, DatasetStatus, DatasetFileType
from app.models.user import User
from app.repositories.dataset import DatasetRepository
from app.repositories.workspace import WorkspaceRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.notification_service import NotificationService
from app.core.storage import (
    upload_file,
    dataset_storage_path,
    get_signed_url,
    delete_file,
    DATASETS_BUCKET,
)
from app.core.exceptions import (
    ResourceNotFoundException,
    ForbiddenException,
    ValidationException,
    StorageQuotaExceededException,
)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json", ".parquet", ".tsv"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB hard limit per file

EXTENSION_TO_TYPE = {
    ".csv": DatasetFileType.csv,
    ".xlsx": DatasetFileType.xlsx,
    ".xls": DatasetFileType.xlsx,
    ".json": DatasetFileType.json,
    ".parquet": DatasetFileType.parquet,
    ".tsv": DatasetFileType.tsv,
}


class DatasetService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dataset_repo = DatasetRepository(session)
        self.ws_repo = WorkspaceRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def upload_dataset(
        self,
        workspace_id: uuid.UUID,
        filename: str,
        file_bytes: bytes,
        actor: User,
        name: str | None = None,
        description: str | None = None,
        background_tasks: Any = None,
    ) -> Dataset:
        from pathlib import Path

        if not actor.tenant_id:
            raise ForbiddenException("You must belong to an organization.")

        # Validate workspace ownership
        ws = await self.ws_repo.get_tenant_workspace(actor.tenant_id, workspace_id)
        if not ws:
            raise ResourceNotFoundException("Workspace", str(workspace_id))

        # Validate file type
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationException(
                f"File type '{ext}' not supported. Allowed: CSV, XLSX, JSON."
            )

        # Validate file size
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise ValidationException("File exceeds the 100 MB size limit.")

        # Check storage quota via QuotaService
        from app.services.quota_service import QuotaService

        quota_svc = QuotaService(self.session)
        await quota_svc.check_storage_quota(
            actor.tenant_id, additional_bytes=len(file_bytes)
        )

        # Upload to Supabase Storage
        storage_path = dataset_storage_path(actor.tenant_id, filename)
        await upload_file(DATASETS_BUCKET, file_bytes, storage_path)

        # Create dataset record
        dataset = Dataset(
            tenant_id=actor.tenant_id,
            workspace_id=workspace_id,
            uploaded_by_id=actor.id,
            name=name or Path(filename).stem,
            description=description,
            file_type=EXTENSION_TO_TYPE[ext],
            file_url=storage_path,
            file_size_bytes=len(file_bytes),
            original_filename=filename,
            status=DatasetStatus.profiling,
        )
        dataset = await self.dataset_repo.save(dataset)

        # Atomically record storage usage
        await quota_svc.consume_storage(actor.tenant_id, len(file_bytes))

        # Trigger profiling task via BackgroundTasks instead of Celery for native offline execution
        from app.worker.tasks.dataset_tasks import _profile_dataset

        if background_tasks:
            background_tasks.add_task(_profile_dataset, None, str(dataset.id))
        else:
            import asyncio

            asyncio.create_task(_profile_dataset(None, str(dataset.id)))
        # Notify
        await NotificationService.create_notification(
            session=self.session,
            title="New Dataset Uploaded",
            message=f"{actor.full_name or actor.email} uploaded '{dataset.original_filename}'.",
            category="System",
            priority="Low",
            notif_type="system.dataset_upload",
            icon="database",
            tenant_id=actor.tenant_id,
        )

        await self.audit_repo.log(
            "dataset.upload",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="dataset",
            resource_id=str(dataset.id),
            extra_metadata={"filename": filename, "size_bytes": len(file_bytes)},
        )
        return dataset

    async def list_datasets(
        self, workspace_id: uuid.UUID, actor: User
    ) -> list[Dataset]:
        return await self.dataset_repo.get_workspace_datasets(
            actor.tenant_id, workspace_id
        )

    async def get_dataset(self, dataset_id: uuid.UUID, actor: User) -> Dataset:
        ds = await self.dataset_repo.get_tenant_dataset(actor.tenant_id, dataset_id)
        if not ds:
            raise ResourceNotFoundException("Dataset", str(dataset_id))
        return ds

    async def get_preview_url(self, dataset_id: uuid.UUID, actor: User) -> str:
        ds = await self.get_dataset(dataset_id, actor)
        return await get_signed_url(
            DATASETS_BUCKET, ds.file_url, expires_in=900
        )  # 15 min

    async def delete_dataset(self, dataset_id: uuid.UUID, actor: User) -> None:
        ds = await self.get_dataset(dataset_id, actor)
        # Delete from Supabase Storage
        try:
            await delete_file(DATASETS_BUCKET, ds.file_url)
        except Exception:
            pass  # Log but don't fail if storage delete fails
        await self.dataset_repo.soft_delete(ds)

        # Release storage in QuotaService
        from app.services.quota_service import QuotaService

        quota_svc = QuotaService(self.session)
        await quota_svc.release_storage(actor.tenant_id, ds.file_size_bytes or 0)

        await self.audit_repo.log(
            "dataset.delete",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="dataset",
            resource_id=str(ds.id),
        )

    async def load_dataframe(self, dataset: Dataset):
        """Load dataset into a high-performance Polars DataFrame."""
        import httpx
        from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR
        from app.services.ingestion.polars_engine import PolarsEngine

        import asyncio

        if is_local_storage():
            local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
            file_bytes = await asyncio.to_thread(local_path.read_bytes)
        else:
            signed_url = await get_signed_url(
                DATASETS_BUCKET, dataset.file_url, expires_in=300
            )
            async with httpx.AsyncClient() as client:
                response = await client.get(signed_url)
                file_bytes = response.content

        ext = (
            dataset.file_type.value
            if hasattr(dataset.file_type, "value")
            else str(dataset.file_type)
        )
        ext = ext.lower().strip().lstrip(".")
        return await asyncio.to_thread(PolarsEngine.load_from_bytes, file_bytes, ext)

    async def get_preview_data(
        self, dataset_id: uuid.UUID, actor: User, limit: int = 50
    ) -> dict:
        """Return dataset preview rows and column metadata."""
        from app.services.ingestion.polars_engine import PolarsEngine

        import asyncio

        ds = await self.get_dataset(dataset_id, actor)
        df = await self.load_dataframe(ds)
        preview_rows = await asyncio.to_thread(PolarsEngine.preview_rows, df, limit)

        columns = [{"name": col, "dtype": str(df.schema[col])} for col in df.columns]

        return {
            "dataset_id": str(ds.id),
            "name": ds.name,
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": columns,
            "preview_rows": preview_rows,
        }

    async def get_dataset_profile(self, dataset_id: uuid.UUID, actor: User) -> dict:
        """Return cached profile or re-profile dataset on demand."""
        from app.services.ingestion.profiler import DataProfiler

        ds = await self.get_dataset(dataset_id, actor)
        if ds.profile and ds.status == DatasetStatus.ready:
            return ds.profile

        df = await self.load_dataframe(ds)
        profile = DataProfiler.profile_dataframe(df)
        await self.dataset_repo.update_profile(
            ds,
            profile=profile,
            row_count=profile["row_count"],
            column_count=profile["column_count"],
            quality_score=profile["quality_score"],
        )
        await self.session.commit()
        return profile

    async def get_correlations(self, dataset_id: uuid.UUID, actor: User) -> dict:
        """Return numeric correlation matrix for dataset."""
        from app.services.ingestion.duckdb_engine import DuckDBEngine

        ds = await self.get_dataset(dataset_id, actor)
        if ds.profile and "correlations" in ds.profile:
            return ds.profile["correlations"]

        import asyncio

        df = await self.load_dataframe(ds)
        return await asyncio.to_thread(DuckDBEngine.compute_correlation_matrix, df)

    async def execute_query(
        self,
        dataset_id: uuid.UUID,
        sql: str,
        actor: User,
        limit: int = 1000,
        offset: int = 0,
    ) -> dict:
        """Execute a safe DuckDB SQL query against the dataset."""
        from app.services.ingestion.duckdb_engine import DuckDBEngine

        ds = await self.get_dataset(dataset_id, actor)
        df = await self.load_dataframe(ds)
        import asyncio

        result = await asyncio.to_thread(
            DuckDBEngine.execute_query,
            df,
            sql,
            "dataset",
            limit,
            offset,
        )

        await self.audit_repo.log(
            "dataset.query",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="dataset",
            resource_id=str(ds.id),
            extra_metadata={
                "sql": sql,
                "execution_time_ms": result["execution_time_ms"],
            },
        )
        return result

    async def execute_structured_query(
        self,
        dataset_id: uuid.UUID,
        req: "StructuredQueryRequest",
        actor: User,
    ) -> dict:
        """Execute a structured JSON query safely via DuckDB by building the SQL server-side."""
        ds = await self.get_dataset(dataset_id, actor)

        # Security: validate columns against the dataset profile
        profile = ds.profile or {}
        profile_columns: dict = profile.get("columns", {})
        valid_columns = list(profile_columns.keys())

        def safe_col(col_name: str) -> str:
            if not valid_columns:
                return f'"{col_name}"'  # Fallback if no profile
            if col_name not in valid_columns:
                raise ValidationException(f"Invalid column: {col_name}")
            return f'"{col_name}"'

        def is_numeric_col(col_name: str) -> bool:
            """Check profile dtype to decide if a column is numeric."""
            if not profile_columns or col_name not in profile_columns:
                return True  # Assume numeric if we don't know
            col_info = profile_columns[col_name]
            dtype = str(col_info.get("dtype", "")).lower()
            numeric_keywords = (
                "int",
                "float",
                "double",
                "decimal",
                "numeric",
                "number",
                "real",
                "bigint",
                "smallint",
            )
            return any(k in dtype for k in numeric_keywords)

        def build_metric_expr(col_name: str, agg: str, alias: str) -> str:
            """Build an aggregation expression with automatic type casting for safety."""
            col_expr = safe_col(col_name)
            numeric = is_numeric_col(col_name)

            # SUM/AVG/MIN/MAX on a string column → cast to DOUBLE, or fall back to COUNT
            if agg in ("SUM", "AVG") and not numeric:
                # Try TRY_CAST — returns NULL for non-parseable values, avoids error
                col_expr = f"TRY_CAST({col_expr} AS DOUBLE)"
            elif agg in ("MIN", "MAX") and not numeric:
                # MIN/MAX on strings is fine, no cast needed
                pass

            return f'{agg}({col_expr}) as "{alias}"'

        select_parts = []
        group_by = []

        if req.dimension:
            dim_col = safe_col(req.dimension)
            select_parts.append(dim_col)
            group_by.append(dim_col)

        if req.metric and req.aggregation:
            agg = req.aggregation.upper()
            if agg not in ["SUM", "AVG", "MIN", "MAX", "COUNT"]:
                raise ValidationException(f"Invalid aggregation: {agg}")
            select_parts.append(build_metric_expr(req.metric, agg, req.metric))
        elif req.metric:
            select_parts.append(safe_col(req.metric))

        if not select_parts:
            select_parts = ["*"]
            # Enforce a strict limit for raw row queries to prevent memory exhaustion
            req.limit = min(req.limit, 100)

        sql = f"SELECT {', '.join(select_parts)} FROM dataset"

        # Filters
        if req.filters:
            filter_clauses = []
            for f in req.filters:
                col = safe_col(f.column)
                op_map = {
                    "eq": "=",
                    "neq": "!=",
                    "gt": ">",
                    "lt": "<",
                    "gte": ">=",
                    "lte": "<=",
                }
                if f.operator in op_map:
                    val = str(f.value).replace("'", "''")
                    filter_clauses.append(f"{col} {op_map[f.operator]} '{val}'")
            if filter_clauses:
                sql += " WHERE " + " AND ".join(filter_clauses)

        # Group by
        if group_by:
            sql += f" GROUP BY {', '.join(group_by)}"

        # Order by
        if req.sort:
            sort_clauses = []
            for s in req.sort:
                col = safe_col(s.column)
                direction = "DESC" if s.direction.lower() == "desc" else "ASC"
                sort_clauses.append(f"{col} {direction}")
            if sort_clauses:
                sql += " ORDER BY " + ", ".join(sort_clauses)

        return await self.execute_query(
            dataset_id=dataset_id,
            sql=sql,
            actor=actor,
            limit=req.limit,
            offset=0,
        )
