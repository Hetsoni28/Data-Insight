"""Data Ingestion & Analytical Profiling module."""

from app.services.ingestion.duckdb_engine import DuckDBEngine
from app.services.ingestion.polars_engine import PolarsEngine
from app.services.ingestion.profiler import DataProfiler

__all__ = ["DataProfiler", "DuckDBEngine", "PolarsEngine"]
