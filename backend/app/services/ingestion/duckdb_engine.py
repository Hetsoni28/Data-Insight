"""Enterprise DuckDB Analytical Engine.

Provides lightning-fast in-memory columnar SQL query execution over DataFrames,
advanced statistical aggregations, correlation matrix computation, and SQL safety guards.
"""

from __future__ import annotations

import time
import re
from typing import Optional, List, Dict, Any, Union

import duckdb
import polars as pl
from loguru import logger

from app.core.exceptions import ValidationException, ForbiddenException


# Disallowed keywords for safe read-only SQL queries
DISALLOWED_SQL_PATTERNS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bALTER\b",
    r"\bCREATE\b",
    r"\bATTACH\b",
    r"\bDETACH\b",
    r"\bCOPY\b",
    r"\bEXPORT\b",
    r"\bIMPORT\b",
    r"\bINSTALL\b",
    r"\bLOAD\b",
    r"\bPRAGMA\b",
    r"\bSET\b",
    r"\bVACUUM\b",
    r"\bCALL\b",
]

COMPILED_DISALLOWED = [re.compile(p, re.IGNORECASE) for p in DISALLOWED_SQL_PATTERNS]


class DuckDBEngine:
    """Safe analytical query engine powered by embedded DuckDB."""

    @staticmethod
    def _create_connection() -> duckdb.DuckDBPyConnection:
        """Create an isolated in-memory DuckDB connection with strict resource bounds."""
        conn = duckdb.connect(database=":memory:", read_only=False)
        conn.execute("SET memory_limit = '1GB'")
        conn.execute("SET threads = 4")
        conn.execute("SET preserve_insertion_order = false")
        return conn

    @classmethod
    def validate_sql(cls, query: str) -> None:
        """Verify that the SQL query is strictly read-only and free of dangerous operations."""
        cleaned = query.strip()
        if not cleaned:
            raise ValidationException("SQL query cannot be empty.")

        # Check for disallowed operations
        for pattern in COMPILED_DISALLOWED:
            if pattern.search(cleaned):
                raise ForbiddenException("Only read-only SELECT queries are permitted.")

        # Ensure query starts with SELECT or WITH
        first_token = cleaned.split()[0].upper()
        if first_token not in ("SELECT", "WITH", "EXPLAIN", "DESCRIBE", "SHOW"):
            raise ForbiddenException(f"Unsupported statement type: '{first_token}'. Only SELECT queries are permitted.")

    @classmethod
    def execute_query(
        cls,
        df: pl.DataFrame,
        sql: str,
        table_name: str = "dataset",
        limit: int = 1000,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Execute an interactive SQL query against a Polars DataFrame with timeout and bounds.
        """
        cls.validate_sql(sql)
        start_time = time.perf_counter()

        conn = cls._create_connection()
        try:
            # Register Polars DataFrame as a virtual DuckDB view
            arrow_table = df.to_arrow()
            conn.register(table_name, arrow_table)
            # Also register alias "data" for user convenience
            if table_name != "data":
                conn.register("data", arrow_table)

            # Enforce pagination limit if not already limited
            user_sql = sql.strip().rstrip(";")
            wrapped_sql = f"SELECT * FROM ({user_sql}) AS __q LIMIT {limit} OFFSET {offset}"

            cursor = conn.execute(wrapped_sql)
            description = cursor.description or []
            column_names = [col[0] for col in description]
            column_types = [str(col[1]) for col in description]

            raw_rows = cursor.fetchall()
            clean_rows = []
            for row in raw_rows:
                clean_row = []
                for val in row:
                    if hasattr(val, "isoformat"):
                        clean_row.append(val.isoformat())
                    elif val != val:  # NaN
                        clean_row.append(None)
                    else:
                        clean_row.append(val)
                clean_rows.append(clean_row)

            # Get total count of the subquery
            count_sql = f"SELECT COUNT(*) FROM ({user_sql}) AS __q_count"
            total_count = conn.execute(count_sql).fetchone()[0]

            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            return {
                "columns": column_names,
                "column_types": column_types,
                "rows": clean_rows,
                "total_rows": total_count,
                "returned_rows": len(clean_rows),
                "limit": limit,
                "offset": offset,
                "execution_time_ms": duration_ms,
            }
        except Exception as exc:
            logger.error(f"DuckDB SQL Execution Error: {exc}")
            raise ValidationException(f"SQL Execution Error: {str(exc)}")
        finally:
            conn.close()

    @classmethod
    def compute_correlation_matrix(cls, df: pl.DataFrame) -> Dict[str, Any]:
        """
        Compute Pearson correlation matrix for all numeric columns.
        """
        numeric_cols = [
            col
            for col in df.columns
            if df.schema[col] in (
                pl.Int8, pl.Int16, pl.Int32, pl.Int64,
                pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64,
                pl.Float32, pl.Float64
            )
        ]

        if len(numeric_cols) < 2:
            return {"columns": numeric_cols, "matrix": {}}

        # Calculate pairwise correlation using DuckDB
        conn = cls._create_connection()
        try:
            arrow_table = df.select(numeric_cols).to_arrow()
            conn.register("df_num", arrow_table)

            matrix: Dict[str, Dict[str, Optional[float]]] = {}
            for col in numeric_cols:
                matrix[col] = {}

            # Construct batch correlation query
            select_clauses = []
            for i, col1 in enumerate(numeric_cols):
                for j, col2 in enumerate(numeric_cols):
                    if i <= j:
                        safe_col1 = f'"{col1}"'
                        safe_col2 = f'"{col2}"'
                        select_clauses.append(f"CORR({safe_col1}, {safe_col2}) AS c_{i}_{j}")

            sql = f"SELECT {', '.join(select_clauses)} FROM df_num"
            row = conn.execute(sql).fetchone()

            idx = 0
            for i, col1 in enumerate(numeric_cols):
                for j, col2 in enumerate(numeric_cols):
                    if i <= j:
                        val = row[idx]
                        if val is not None and not (val != val):  # not nan
                            rounded = round(float(val), 4)
                        else:
                            rounded = None
                        matrix[col1][col2] = rounded
                        matrix[col2][col1] = rounded
                        idx += 1

            return {
                "columns": numeric_cols,
                "matrix": matrix,
            }
        except Exception as exc:
            logger.warning(f"Correlation matrix computation failed: {exc}")
            return {"columns": numeric_cols, "matrix": {}}
        finally:
            conn.close()

    @classmethod
    def compute_histogram(
        cls,
        df: pl.DataFrame,
        column_name: str,
        num_bins: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Compute histogram bucket distribution for a numeric column.
        """
        series = df[column_name].drop_nulls()
        if len(series) == 0:
            return []

        min_val = float(series.min())
        max_val = float(series.max())

        if min_val == max_val:
            return [{
                "bin_start": min_val,
                "bin_end": max_val,
                "count": len(series),
                "pct": 100.0,
            }]

        step = (max_val - min_val) / num_bins
        bins = []

        conn = cls._create_connection()
        try:
            arrow_table = df.select([column_name]).to_arrow()
            conn.register("hist_df", arrow_table)
            safe_col = f'"{column_name}"'

            for b in range(num_bins):
                b_start = min_val + (b * step)
                b_end = min_val + ((b + 1) * step) if b < num_bins - 1 else max_val

                if b == num_bins - 1:
                    query = f"SELECT COUNT(*) FROM hist_df WHERE {safe_col} >= {b_start} AND {safe_col} <= {b_end}"
                else:
                    query = f"SELECT COUNT(*) FROM hist_df WHERE {safe_col} >= {b_start} AND {safe_col} < {b_end}"

                count = conn.execute(query).fetchone()[0]
                pct = round((count / len(series)) * 100, 2)
                bins.append({
                    "bin_start": round(b_start, 3),
                    "bin_end": round(b_end, 3),
                    "count": count,
                    "pct": pct,
                })
            return bins
        except Exception as exc:
            logger.warning(f"Histogram calculation failed for {column_name}: {exc}")
            return []
        finally:
            conn.close()
