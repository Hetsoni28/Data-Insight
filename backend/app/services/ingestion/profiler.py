"""Enterprise Automated Data Profiling & Quality Scoring Engine.

Combines Polars and DuckDB to compute deep column statistics, outlier detection,
distribution histograms, correlation matrices, composite data quality scores,
and automated schema heuristics without fabricating data.
"""

from __future__ import annotations

import math
from typing import Dict, Any, List, Optional, Union
import polars as pl
import numpy as np

from app.services.ingestion.duckdb_engine import DuckDBEngine


def _safe_float(val: Any) -> Optional[float]:
    """Convert numpy / polars floats to standard Python float with NaN safety."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, 4)
    except (ValueError, TypeError):
        return None


def _safe_int(val: Any) -> Optional[int]:
    """Convert numeric values to standard Python int."""
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


class DataProfiler:
    """Automated statistical profiler, data quality evaluator, and schema analyzer."""

    @classmethod
    def profile_dataframe(cls, df: pl.DataFrame) -> Dict[str, Any]:
        """
        Generate comprehensive, multi-dimensional profiling metadata for a Polars DataFrame.
        """
        n_rows = len(df)
        n_cols = len(df.columns)

        if n_rows == 0 or n_cols == 0:
            return {
                "row_count": n_rows,
                "column_count": n_cols,
                "memory_usage_mb": 0.0,
                "duplicate_rows": 0,
                "duplicate_pct": 0.0,
                "sparsity_pct": 0.0,
                "quality_score": 0,
                "quality_grade": "F",
                "columns": {},
                "correlations": {},
                "heuristics": {},
            }

        # 1. Dataset-level metrics
        duplicate_rows = int(df.is_duplicated().sum())
        duplicate_pct = round((duplicate_rows / n_rows) * 100, 2)
        memory_mb = round(df.estimated_size() / (1024 * 1024), 3)

        total_cells = n_rows * n_cols
        total_nulls = sum(df[col].null_count() for col in df.columns)
        sparsity_pct = (
            round((total_nulls / total_cells) * 100, 2) if total_cells > 0 else 0.0
        )

        # 2. Column-level deep profiling
        columns_profile: Dict[str, Any] = {}
        primary_key_candidates = []
        target_candidates = []
        time_dimensions = []
        anomalies = []

        for col in df.columns:
            series = df[col]
            dtype = series.dtype
            null_count = series.null_count()
            null_pct = round((null_count / n_rows) * 100, 2)
            unique_count = series.n_unique()
            unique_pct = round((unique_count / n_rows) * 100, 2)

            col_info: Dict[str, Any] = {
                "name": col,
                "dtype": str(dtype),
                "null_count": null_count,
                "null_pct": null_pct,
                "unique_count": unique_count,
                "unique_pct": unique_pct,
            }

            # Check for constant column anomaly
            if unique_count <= 1 and n_rows > 1:
                anomalies.append(
                    {
                        "column": col,
                        "type": "constant_column",
                        "severity": "medium",
                        "message": f"Column '{col}' has only {unique_count} distinct value and provides zero variance.",
                    }
                )

            # Check for high missingness
            if null_pct >= 50.0:
                anomalies.append(
                    {
                        "column": col,
                        "type": "high_missingness",
                        "severity": "high",
                        "message": f"Column '{col}' has {null_pct}% missing values.",
                    }
                )

            # Check primary key candidate
            if null_count == 0 and unique_count == n_rows and n_rows > 1:
                primary_key_candidates.append(col)

            # Categorize by data type
            if dtype.is_numeric():
                col_info["type"] = "numeric"
                col_stats = cls._profile_numeric_column(series, df, col, n_rows)
                col_info.update(col_stats)

                # Check for outliers anomaly
                outlier_cnt = col_info.get("outlier_count", 0)
                if outlier_cnt > 0 and (outlier_cnt / n_rows) > 0.05:
                    anomalies.append(
                        {
                            "column": col,
                            "type": "high_outliers",
                            "severity": "medium",
                            "message": f"Column '{col}' contains {outlier_cnt} statistical outliers ({round(outlier_cnt/n_rows*100, 1)}% of rows).",
                        }
                    )

                # Check potential numeric target variable
                if unique_count > 10 and col not in primary_key_candidates:
                    target_candidates.append(col)

            elif (
                dtype.is_temporal()
                or str(dtype).startswith("Date")
                or str(dtype).startswith("Datetime")
            ):
                col_info["type"] = "datetime"
                col_stats = cls._profile_datetime_column(series)
                col_info.update(col_stats)
                time_dimensions.append(col)

            elif dtype == pl.Boolean:
                col_info["type"] = "boolean"
                col_stats = cls._profile_boolean_column(series, n_rows)
                col_info.update(col_stats)

            else:
                # String / Categorical / Object
                col_info["type"] = "categorical"
                col_stats = cls._profile_categorical_column(series, n_rows)
                col_info.update(col_stats)

                # Check potential classification target
                if 2 <= unique_count <= 20 and n_rows >= 3:
                    target_candidates.append(col)

            columns_profile[col] = col_info

        # 3. Numeric Correlation Matrix
        correlations = DuckDBEngine.compute_correlation_matrix(df)

        # 4. Composite Data Quality Scoring (0 - 100)
        quality_score, score_breakdown, quality_grade = cls._calculate_quality_score(
            n_rows=n_rows,
            n_cols=n_cols,
            sparsity_pct=sparsity_pct,
            duplicate_pct=duplicate_pct,
            columns_profile=columns_profile,
            anomalies=anomalies,
        )

        return {
            "row_count": n_rows,
            "column_count": n_cols,
            "memory_usage_mb": memory_mb,
            "duplicate_rows": duplicate_rows,
            "duplicate_pct": duplicate_pct,
            "sparsity_pct": sparsity_pct,
            "quality_score": quality_score,
            "quality_grade": quality_grade,
            "quality_breakdown": score_breakdown,
            "columns": columns_profile,
            "correlations": correlations,
            "heuristics": {
                "primary_key_candidates": primary_key_candidates,
                "target_variable_candidates": target_candidates[:5],
                "time_dimension_columns": time_dimensions,
                "anomalies": anomalies,
            },
        }

    @classmethod
    def _profile_numeric_column(
        cls, series: pl.Series, df: pl.DataFrame, col: str, n_rows: int
    ) -> Dict[str, Any]:
        """Compute deep statistical profile for a numeric column."""
        clean = series.drop_nulls()
        if len(clean) == 0:
            return {
                "min": None,
                "max": None,
                "mean": None,
                "median": None,
                "std": None,
                "variance": None,
                "skewness": None,
                "kurtosis": None,
                "q25": None,
                "q75": None,
                "iqr": None,
                "p05": None,
                "p95": None,
                "p99": None,
                "zero_count": 0,
                "negative_count": 0,
                "outlier_count": 0,
                "histogram": [],
            }

        arr = clean.to_numpy()
        min_v = _safe_float(clean.min())
        max_v = _safe_float(clean.max())
        mean_v = _safe_float(clean.mean())
        median_v = _safe_float(clean.median())
        std_v = _safe_float(clean.std())
        var_v = _safe_float(clean.var())

        # Quantiles & Percentiles
        q25 = _safe_float(clean.quantile(0.25))
        q75 = _safe_float(clean.quantile(0.75))
        iqr = round(q75 - q25, 4) if (q75 is not None and q25 is not None) else None
        p05 = _safe_float(clean.quantile(0.05))
        p95 = _safe_float(clean.quantile(0.95))
        p99 = _safe_float(clean.quantile(0.99))

        # Skewness and Kurtosis
        skew_v = None
        kurt_v = None
        if len(arr) >= 3 and std_v and std_v > 0:
            try:
                from scipy import stats

                skew_v = _safe_float(stats.skew(arr))
                kurt_v = _safe_float(stats.kurtosis(arr))
            except Exception:
                # Fallback formula
                m3 = np.mean((arr - mean_v) ** 3) if mean_v is not None else 0
                skew_v = _safe_float(m3 / (std_v**3)) if std_v else None

        # Value polarity
        zero_count = int((clean == 0).sum())
        neg_count = int((clean < 0).sum())

        # Outlier Detection (Tukey's IQR method)
        outlier_count = 0
        if q25 is not None and q75 is not None and iqr is not None and iqr > 0:
            lower_bound = q25 - (1.5 * iqr)
            upper_bound = q75 + (1.5 * iqr)
            outlier_count = int(((clean < lower_bound) | (clean > upper_bound)).sum())

        # 10-bin histogram calculation
        histogram = DuckDBEngine.compute_histogram(df, col, num_bins=10)

        return {
            "min": min_v,
            "max": max_v,
            "mean": mean_v,
            "median": median_v,
            "std": std_v,
            "variance": var_v,
            "skewness": skew_v,
            "kurtosis": kurt_v,
            "q25": q25,
            "q75": q75,
            "iqr": iqr,
            "p05": p05,
            "p95": p95,
            "p99": p99,
            "zero_count": zero_count,
            "zero_pct": round((zero_count / n_rows) * 100, 2),
            "negative_count": neg_count,
            "negative_pct": round((neg_count / n_rows) * 100, 2),
            "outlier_count": outlier_count,
            "histogram": histogram,
        }

    @classmethod
    def _profile_categorical_column(
        cls, series: pl.Series, n_rows: int
    ) -> Dict[str, Any]:
        """Compute statistical breakdown for categorical or text column."""
        clean = series.drop_nulls()
        if len(clean) == 0:
            return {
                "mode": None,
                "mode_frequency": 0,
                "mode_pct": 0.0,
                "top_values": [],
                "min_length": 0,
                "max_length": 0,
                "avg_length": 0.0,
                "blank_count": 0,
            }

        # Value counts
        val_counts = clean.value_counts(sort=True)
        top_10 = []
        mode_val = None
        mode_freq = 0
        mode_pct = 0.0

        for row in val_counts.head(10).iter_rows():
            val, count = row[0], row[1]
            pct = round((count / n_rows) * 100, 2)
            top_10.append(
                {
                    "value": str(val) if val is not None else "null",
                    "count": count,
                    "pct": pct,
                }
            )

        if len(top_10) > 0:
            mode_val = top_10[0]["value"]
            mode_freq = top_10[0]["count"]
            mode_pct = top_10[0]["pct"]

        # String length statistics
        str_series = clean.cast(pl.Utf8)
        lengths = str_series.str.len_chars().drop_nulls()
        min_len = _safe_int(lengths.min()) if len(lengths) > 0 else 0
        max_len = _safe_int(lengths.max()) if len(lengths) > 0 else 0
        avg_len = _safe_float(lengths.mean()) if len(lengths) > 0 else 0.0
        blank_count = int(str_series.str.strip_chars().eq("").sum())

        return {
            "mode": mode_val,
            "mode_frequency": mode_freq,
            "mode_pct": mode_pct,
            "top_values": top_10,
            "min_length": min_len,
            "max_length": max_len,
            "avg_length": avg_len,
            "blank_count": blank_count,
        }

    @classmethod
    def _profile_datetime_column(cls, series: pl.Series) -> Dict[str, Any]:
        """Compute metrics for datetime column."""
        clean = series.drop_nulls()
        if len(clean) == 0:
            return {"min_date": None, "max_date": None, "span_days": 0}

        min_d = clean.min()
        max_d = clean.max()
        span_days = 0

        min_str = min_d.isoformat() if hasattr(min_d, "isoformat") else str(min_d)
        max_str = max_d.isoformat() if hasattr(max_d, "isoformat") else str(max_d)

        try:
            diff = max_d - min_d
            span_days = getattr(diff, "days", 0)
        except Exception:
            pass

        return {
            "min_date": min_str,
            "max_date": max_str,
            "span_days": span_days,
        }

    @classmethod
    def _profile_boolean_column(cls, series: pl.Series, n_rows: int) -> Dict[str, Any]:
        """Compute metrics for boolean column."""
        true_cnt = int(series.eq(True).sum())
        false_cnt = int(series.eq(False).sum())
        null_cnt = series.null_count()

        return {
            "true_count": true_cnt,
            "false_count": false_cnt,
            "null_count": null_cnt,
            "true_pct": round((true_cnt / n_rows) * 100, 2) if n_rows > 0 else 0.0,
            "false_pct": round((false_cnt / n_rows) * 100, 2) if n_rows > 0 else 0.0,
        }

    @classmethod
    def _calculate_quality_score(
        cls,
        n_rows: int,
        n_cols: int,
        sparsity_pct: float,
        duplicate_pct: float,
        columns_profile: Dict[str, Any],
        anomalies: List[Dict[str, Any]],
    ) -> tuple[int, Dict[str, float], str]:
        """
        Calculate composite data quality score (0 - 100) based on enterprise dimensions.
        """
        # 1. Completeness (100 - null percentage)
        completeness = max(0.0, 100.0 - sparsity_pct)

        # 2. Uniqueness (100 - duplicate row percentage)
        uniqueness = max(0.0, 100.0 - duplicate_pct)

        # 3. Validity (penalty for outliers and severe anomalies)
        total_outliers = sum(
            col_info.get("outlier_count", 0)
            for col_info in columns_profile.values()
            if col_info.get("type") == "numeric"
        )
        total_num_cells = max(
            1,
            n_rows
            * max(
                1,
                len(
                    [c for c in columns_profile.values() if c.get("type") == "numeric"]
                ),
            ),
        )
        outlier_pct = (total_outliers / total_num_cells) * 100
        validity = max(0.0, 100.0 - (outlier_pct * 2.0))

        # 4. Consistency (penalty for anomalies)
        anomaly_penalty = sum(
            10.0 if a.get("severity") == "high" else 5.0 for a in anomalies
        )
        consistency = max(0.0, 100.0 - anomaly_penalty)

        # Weighted composite score
        overall = (
            (completeness * 0.35)
            + (uniqueness * 0.25)
            + (validity * 0.20)
            + (consistency * 0.20)
        )
        final_score = max(0, min(100, int(round(overall))))

        # Determine letter grade
        if final_score >= 95:
            grade = "A+"
        elif final_score >= 90:
            grade = "A"
        elif final_score >= 80:
            grade = "B"
        elif final_score >= 70:
            grade = "C"
        elif final_score >= 60:
            grade = "D"
        else:
            grade = "F"

        breakdown = {
            "completeness": round(completeness, 2),
            "uniqueness": round(uniqueness, 2),
            "validity": round(validity, 2),
            "consistency": round(consistency, 2),
        }

        return final_score, breakdown, grade
