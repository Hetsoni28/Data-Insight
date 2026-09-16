import os
import uuid
from typing import Any

import polars as pl
from loguru import logger

from app.services.ingestion.duckdb_engine import DuckDBEngine


class DatasetQueryService:
    @staticmethod
    async def execute_query(
        dataset_id: uuid.UUID,
        tenant_id: uuid.UUID,
        workspace_id: uuid.UUID | None,
        query_payload: dict[str, Any],
        dataset_metadata: dict[str, Any] | None = None,
        storage_path: str | None = None,
    ) -> list[dict[str, Any]]:
        """Executes a structured query against a dataset, enforcing strict schema validation and executing via DuckDB.
        """
        dimensions = query_payload.get("dimensions", [])
        metrics = query_payload.get("metrics", [])
        filters = query_payload.get("filters", [])
        limit = query_payload.get("limit", 100)

        # 1. Basic Structural Validation
        if not dimensions and not metrics:
            raise ValueError("Query must contain at least one dimension or metric")

        if limit > 10000:
            raise ValueError(
                "Query limit cannot exceed 10,000 rows for performance reasons",
            )

        # 2. Schema Validation (Strong Logic)
        if dataset_metadata and "schema" in dataset_metadata:
            valid_columns = {
                col["name"]: col["type"] for col in dataset_metadata.get("schema", [])
            }

            # Validate Dimensions
            for dim in dimensions:
                if dim not in valid_columns:
                    raise ValueError(
                        f"Invalid dimension requested: '{dim}'. Column does not exist in dataset schema.",
                    )

            # Validate Metrics & Aggregations
            allowed_aggregations = [
                "sum",
                "avg",
                "min",
                "max",
                "count",
                "count_distinct",
            ]
            for metric in metrics:
                field = metric.get("field")
                agg = metric.get("aggregation")

                if field not in valid_columns:
                    raise ValueError(
                        f"Invalid metric requested: '{field}'. Column does not exist in dataset schema.",
                    )
                if agg not in allowed_aggregations:
                    raise ValueError(
                        f"Invalid aggregation: '{agg}'. Allowed aggregations are: {', '.join(allowed_aggregations)}",
                    )

            # Validate Filters
            for f in filters:
                field = f.get("field")
                if field not in valid_columns:
                    raise ValueError(
                        f"Invalid filter field: '{field}'. Column does not exist in dataset schema.",
                    )

        # 3. Load Data
        if not storage_path or not os.path.exists(storage_path):
            raise ValueError("Dataset physical file not found.")

        try:
            if storage_path.endswith(".parquet"):
                df = pl.read_parquet(storage_path)
            else:
                df = pl.read_csv(storage_path, ignore_errors=True)
        except Exception as e:
            logger.error(f"Failed to load dataset file: {e}")
            raise ValueError("Failed to process dataset physical file.")

        # 4. Construct Safe SQL Query
        select_cols = [f'"{d}"' for d in dimensions]
        for m in metrics:
            agg = m.get("aggregation", "sum").upper()
            field = m.get("field")
            if agg == "COUNT_DISTINCT":
                select_cols.append(
                    f'COUNT(DISTINCT "{field}") as "count_distinct_{field}"',
                )
            else:
                select_cols.append(f'{agg}("{field}") as "{agg}_{field}"')

        select_clause = ", ".join(select_cols)
        group_clause = ", ".join([f'"{d}"' for d in dimensions]) if dimensions else ""

        # 4b. Build WHERE clause from filters
        where_clauses = []
        params: dict[str, Any] = {}
        for idx, f in enumerate(filters):
            field = f.get("field")
            operator = f.get("operator", "eq")
            value = f.get("value")
            param_key = f"p{idx}"

            col_expr = f'"{field}"'
            if operator == "eq":
                where_clauses.append(f"{col_expr} = ${param_key}")
                params[param_key] = value
            elif operator == "neq":
                where_clauses.append(f"{col_expr} != ${param_key}")
                params[param_key] = value
            elif operator == "gt":
                where_clauses.append(f"{col_expr} > ${param_key}")
                params[param_key] = value
            elif operator == "gte":
                where_clauses.append(f"{col_expr} >= ${param_key}")
                params[param_key] = value
            elif operator == "lt":
                where_clauses.append(f"{col_expr} < ${param_key}")
                params[param_key] = value
            elif operator == "lte":
                where_clauses.append(f"{col_expr} <= ${param_key}")
                params[param_key] = value
            elif operator == "in":
                placeholders = ", ".join(
                    [f"${param_key}_{j}" for j, _ in enumerate(value)]
                )
                where_clauses.append(f"{col_expr} IN ({placeholders})")
                for j, v in enumerate(value):
                    params[f"{param_key}_{j}"] = v
            elif operator == "not_in":
                placeholders = ", ".join(
                    [f"${param_key}_{j}" for j, _ in enumerate(value)]
                )
                where_clauses.append(f"{col_expr} NOT IN ({placeholders})")
                for j, v in enumerate(value):
                    params[f"{param_key}_{j}"] = v
            elif operator == "contains":
                where_clauses.append(f"LOWER(CAST({col_expr} AS VARCHAR)) LIKE LOWER(${param_key})")
                params[param_key] = f"%{value}%"
            elif operator == "starts_with":
                where_clauses.append(f"LOWER(CAST({col_expr} AS VARCHAR)) LIKE LOWER(${param_key})")
                params[param_key] = f"{value}%"
            elif operator == "is_null":
                where_clauses.append(f"{col_expr} IS NULL")
            elif operator == "is_not_null":
                where_clauses.append(f"{col_expr} IS NOT NULL")
            else:
                raise ValueError(f"Unsupported filter operator: '{operator}'")

        sql = f"SELECT {select_clause} FROM data"
        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)
        if group_clause:
            sql += f" GROUP BY {group_clause}"

        # 5. Execute via Enterprise DuckDBEngine
        try:
            result = DuckDBEngine.execute_query(df=df, sql=sql, limit=limit, params=params if params else None)
            return result
        except Exception as e:
            logger.error(f"DuckDB Execution Error: {e}")
            raise ValueError(f"Query execution failed: {e!s}")
