"""Unit tests for Phase 3 — High-Speed Data Ingestion & Automated DuckDB/Polars Profiling."""

from __future__ import annotations

import io
import json
import uuid
import pytest
import polars as pl
import numpy as np

from app.services.ingestion.polars_engine import PolarsEngine
from app.services.ingestion.duckdb_engine import DuckDBEngine
from app.services.ingestion.profiler import DataProfiler
from app.core.exceptions import ValidationException, ForbiddenException


# ---------------------------------------------------------------------------
# 1. Polars Ingestion Engine Tests
# ---------------------------------------------------------------------------

def test_polars_engine_load_csv():
    csv_data = (
        "id,name,age,salary,department\n"
        "1,Alice,30,75000.50,Engineering\n"
        "2,Bob,45,92000.00,Marketing\n"
        "3,Charlie,28,68000.00,Engineering\n"
        "4,Diana,52,110000.00,Executive\n"
    ).encode("utf-8")

    df = PolarsEngine.load_from_bytes(csv_data, file_type="csv")
    assert isinstance(df, pl.DataFrame)
    assert len(df) == 4
    assert df.columns == ["id", "name", "age", "salary", "department"]
    assert df["salary"].sum() == pytest.approx(345000.50)


def test_polars_engine_load_tsv():
    tsv_data = (
        "product\tprice\tquantity\n"
        "Laptop\t1200.0\t10\n"
        "Phone\t800.0\t25\n"
        "Tablet\t450.0\t15\n"
    ).encode("utf-8")

    df = PolarsEngine.load_from_bytes(tsv_data, file_type="tsv")
    assert len(df) == 3
    assert "product" in df.columns
    assert "price" in df.columns


def test_polars_engine_load_json():
    json_data = json.dumps([
        {"user_id": 101, "score": 95.5, "status": "active"},
        {"user_id": 102, "score": 82.0, "status": "inactive"},
        {"user_id": 103, "score": 78.4, "status": "active"},
    ]).encode("utf-8")

    df = PolarsEngine.load_from_bytes(json_data, file_type="json")
    assert len(df) == 3
    assert df.columns == ["user_id", "score", "status"]


def test_polars_engine_null_normalization():
    csv_data = (
        "id,val1,val2\n"
        "1,null,N/A\n"
        "2,10.5,None\n"
        "3,NaN,valid\n"
    ).encode("utf-8")

    df = PolarsEngine.load_from_bytes(csv_data, file_type="csv")
    assert df["val1"].null_count() >= 2
    assert df["val2"].null_count() >= 2


def test_polars_engine_preview_rows():
    df = pl.DataFrame({
        "id": [1, 2, 3],
        "category": ["A", "B", "C"],
    })
    preview = PolarsEngine.preview_rows(df, n=2)
    assert len(preview) == 2
    assert preview[0]["id"] == 1
    assert preview[0]["category"] == "A"


# ---------------------------------------------------------------------------
# 2. DuckDB Analytical Engine Tests
# ---------------------------------------------------------------------------

def test_duckdb_engine_query_execution():
    df = pl.DataFrame({
        "dept": ["Eng", "Eng", "Sales", "Sales", "HR"],
        "revenue": [100.0, 200.0, 300.0, 400.0, 150.0],
    })

    query = "SELECT dept, SUM(revenue) as total_rev FROM dataset GROUP BY dept ORDER BY total_rev DESC"
    result = DuckDBEngine.execute_query(df, query)

    assert result["columns"] == ["dept", "total_rev"]
    assert result["total_rows"] == 3
    assert len(result["rows"]) == 3
    assert result["rows"][0][0] == "Sales"
    assert result["rows"][0][1] == 700.0
    assert result["execution_time_ms"] >= 0


def test_duckdb_engine_pagination():
    df = pl.DataFrame({"num": list(range(100))})
    result = DuckDBEngine.execute_query(df, "SELECT * FROM dataset ORDER BY num ASC", limit=10, offset=20)
    assert result["total_rows"] == 100
    assert result["returned_rows"] == 10
    assert result["rows"][0][0] == 20
    assert result["rows"][-1][0] == 29


def test_duckdb_engine_blocks_destructive_sql():
    df = pl.DataFrame({"val": [1, 2, 3]})

    destructive_queries = [
        "DROP TABLE dataset",
        "DELETE FROM dataset WHERE val = 1",
        "INSERT INTO dataset VALUES (4)",
        "ALTER TABLE dataset ADD COLUMN x INT",
        "ATTACH ':memory:' AS evil",
    ]

    for q in destructive_queries:
        with pytest.raises((ForbiddenException, ValidationException)):
            DuckDBEngine.execute_query(df, q)


def test_duckdb_engine_correlation_matrix():
    # Perfectly correlated series
    x = [1.0, 2.0, 3.0, 4.0, 5.0]
    y = [2.0, 4.0, 6.0, 8.0, 10.0]
    z = [5.0, 4.0, 3.0, 2.0, 1.0]

    df = pl.DataFrame({"x": x, "y": y, "z": z})
    corrs = DuckDBEngine.compute_correlation_matrix(df)

    assert "columns" in corrs
    assert set(corrs["columns"]) == {"x", "y", "z"}
    matrix = corrs["matrix"]
    assert matrix["x"]["y"] == pytest.approx(1.0, rel=1e-3)
    assert matrix["x"]["z"] == pytest.approx(-1.0, rel=1e-3)


def test_duckdb_engine_histogram():
    df = pl.DataFrame({"val": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]})
    hist = DuckDBEngine.compute_histogram(df, "val", num_bins=5)
    assert len(hist) == 5
    total_count = sum(b["count"] for b in hist)
    assert total_count == 10


# ---------------------------------------------------------------------------
# 3. Data Profiler & Quality Scoring Tests
# ---------------------------------------------------------------------------

def test_data_profiler_numeric_statistics():
    df = pl.DataFrame({
        "id": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "metric": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 1000.0],  # 1000 is an outlier
    })

    profile = DataProfiler.profile_dataframe(df)

    assert profile["row_count"] == 10
    assert profile["column_count"] == 2
    assert "metric" in profile["columns"]
    m_info = profile["columns"]["metric"]

    assert m_info["type"] == "numeric"
    assert m_info["min"] == 10.0
    assert m_info["max"] == 1000.0
    assert m_info["outlier_count"] >= 1
    assert len(m_info["histogram"]) > 0


def test_data_profiler_categorical_statistics():
    df = pl.DataFrame({
        "category": ["Alpha", "Beta", "Alpha", "Gamma", "Alpha", "Beta"],
    })

    profile = DataProfiler.profile_dataframe(df)
    c_info = profile["columns"]["category"]

    assert c_info["type"] == "categorical"
    assert c_info["mode"] == "Alpha"
    assert c_info["mode_frequency"] == 3
    assert len(c_info["top_values"]) == 3
    assert c_info["unique_count"] == 3


def test_data_profiler_quality_score_calculation():
    # Clean, unique, complete dataset
    df_clean = pl.DataFrame({
        "id": [1, 2, 3, 4, 5],
        "feature": [10.0, 20.0, 30.0, 40.0, 50.0],
        "label": ["A", "B", "C", "D", "E"],
    })
    profile_clean = DataProfiler.profile_dataframe(df_clean)
    assert profile_clean["quality_score"] >= 90
    assert profile_clean["quality_grade"] in ("A", "A+")

    # Dirty dataset with high duplicates and missing values
    df_dirty = pl.DataFrame({
        "col1": [None, None, None, 1.0, 1.0],
        "col2": [None, None, None, "dup", "dup"],
    })
    profile_dirty = DataProfiler.profile_dataframe(df_dirty)
    assert profile_dirty["quality_score"] < profile_clean["quality_score"]


def test_data_profiler_heuristics_and_anomalies():
    df = pl.DataFrame({
        "unique_id": [101, 102, 103, 104, 105],  # Primary key candidate
        "constant_col": ["SAME", "SAME", "SAME", "SAME", "SAME"],  # Constant column anomaly
        "mostly_null": [None, None, None, None, "value"],  # High missingness
        "target": ["Yes", "No", "Yes", "No", "Yes"],  # Target candidate
    })

    profile = DataProfiler.profile_dataframe(df)
    heuristics = profile["heuristics"]

    assert "unique_id" in heuristics["primary_key_candidates"]
    assert "target" in heuristics["target_variable_candidates"]

    anomaly_types = [a["type"] for a in heuristics["anomalies"]]
    assert "constant_column" in anomaly_types
    assert "high_missingness" in anomaly_types
