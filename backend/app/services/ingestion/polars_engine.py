"""Enterprise Polars Ingestion Engine.

Provides high-speed multi-threaded parsing, automatic encoding detection,
schema inference, Excel multi-sheet discovery, and memory-safe reading.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Optional, Union, List, Dict, Any

import polars as pl
from loguru import logger

from app.core.exceptions import ValidationException


# Common null value strings to normalize across all input files
NULL_VALUES = [
    "",
    " ",
    "null",
    "NULL",
    "Null",
    "nan",
    "NaN",
    "NAN",
    "none",
    "None",
    "NONE",
    "n/a",
    "N/A",
    "NA",
    "#N/A",
    "#VALUE!",
    "#REF!",
    "#DIV/0!",
    "#NUM!",
    "#NAME?",
    "-",
    "?",
]


class PolarsEngine:
    """High-performance Polars DataFrame ingestion and schema normalization engine."""

    @staticmethod
    def detect_encoding(sample_bytes: bytes) -> str:
        """Detect encoding by probing standard encodings against sample bytes."""
        encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252", "iso-8859-1"]
        for enc in encodings:
            try:
                sample_bytes[:65536].decode(enc)
                return enc
            except (UnicodeDecodeError, LookupError):
                continue
        return "utf-8"

    @classmethod
    def get_excel_sheet_names(cls, file_bytes: bytes) -> List[str]:
        """Extract sheet names from an Excel file in-memory."""
        try:
            import openpyxl

            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
            sheet_names = wb.sheetnames
            wb.close()
            return sheet_names
        except Exception as exc:
            logger.warning(f"Could not extract Excel sheets with openpyxl: {exc}")
            return ["Sheet1"]

    @classmethod
    def read_csv_from_bytes(
        cls,
        file_bytes: bytes,
        separator: str = ",",
        has_header: bool = True,
        encoding: Optional[str] = None,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Read CSV / TSV bytes into a Polars DataFrame with encoding fallback."""
        enc = encoding or cls.detect_encoding(file_bytes)
        try:
            return pl.read_csv(
                io.BytesIO(file_bytes),
                separator=separator,
                has_header=has_header,
                encoding=enc,
                null_values=NULL_VALUES,
                n_rows=n_rows,
                infer_schema_length=10000,
                ignore_errors=True,
                truncate_ragged_lines=True,
            )
        except Exception as exc:
            logger.warning(
                f"Polars read_csv with {enc} failed, attempting latin1 fallback: {exc}"
            )
            return pl.read_csv(
                io.BytesIO(file_bytes),
                separator=separator,
                has_header=has_header,
                encoding="latin1",
                null_values=NULL_VALUES,
                n_rows=n_rows,
                infer_schema_length=5000,
                ignore_errors=True,
                truncate_ragged_lines=True,
            )

    @classmethod
    def read_excel_from_bytes(
        cls,
        file_bytes: bytes,
        sheet_name: Optional[str] = None,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Read Excel (.xlsx / .xls) bytes into a Polars DataFrame."""
        try:
            # Polars read_excel uses calamine or openpyxl
            return pl.read_excel(
                io.BytesIO(file_bytes),
                sheet_name=sheet_name or 0,
                read_options={"n_rows": n_rows} if n_rows else None,
            )
        except Exception as exc:
            logger.warning(f"Polars read_excel failed, falling back to pandas: {exc}")
            import pandas as pd

            pdf = pd.read_excel(
                io.BytesIO(file_bytes), sheet_name=sheet_name or 0, nrows=n_rows
            )
            return pl.from_pandas(pdf)

    @classmethod
    def read_json_from_bytes(
        cls,
        file_bytes: bytes,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Read JSON / JSONLines bytes into a Polars DataFrame."""
        try:
            # Try reading as standard JSON array or object
            return pl.read_json(io.BytesIO(file_bytes))
        except Exception:
            try:
                # Try reading as NDJSON (JSON Lines)
                return pl.read_ndjson(io.BytesIO(file_bytes), n_rows=n_rows)
            except Exception as exc:
                # Fallback to json.loads + DataFrame
                parsed = json.loads(file_bytes.decode("utf-8", errors="ignore"))
                if isinstance(parsed, dict):
                    parsed = [parsed]
                return pl.DataFrame(parsed)

    @classmethod
    def read_parquet_from_bytes(
        cls,
        file_bytes: bytes,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Read Parquet bytes into a Polars DataFrame."""
        return pl.read_parquet(io.BytesIO(file_bytes), n_rows=n_rows)

    @classmethod
    def load_from_bytes(
        cls,
        file_bytes: bytes,
        file_type: str,
        sheet_name: Optional[str] = None,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """
        Universal entry point to ingest binary dataset content into a normalized Polars DataFrame.
        """
        if not file_bytes:
            raise ValidationException("Uploaded file is empty (0 bytes).")

        ft = file_type.lower().strip().replace(".", "")
        if ft in ("csv", "txt"):
            df = cls.read_csv_from_bytes(file_bytes, separator=",", n_rows=n_rows)
        elif ft in ("tsv", "tab"):
            df = cls.read_csv_from_bytes(file_bytes, separator="\t", n_rows=n_rows)
        elif ft in ("xlsx", "xls", "excel"):
            df = cls.read_excel_from_bytes(
                file_bytes, sheet_name=sheet_name, n_rows=n_rows
            )
        elif ft in ("json", "ndjson", "jsonl"):
            df = cls.read_json_from_bytes(file_bytes, n_rows=n_rows)
        elif ft in ("parquet", "pq"):
            df = cls.read_parquet_from_bytes(file_bytes, n_rows=n_rows)
        else:
            raise ValidationException(
                f"Unsupported file format '{file_type}'. Supported: CSV, TSV, XLSX, JSON, Parquet."
            )

        # Clean column names (strip whitespace, ensure non-empty unique names)
        clean_cols = []
        seen = {}
        for idx, col in enumerate(df.columns):
            name = str(col).strip() if col is not None else ""
            if not name:
                name = f"column_{idx + 1}"
            if name in seen:
                seen[name] += 1
                name = f"{name}_{seen[name]}"
            else:
                seen[name] = 0
            clean_cols.append(name)

        if clean_cols != df.columns:
            df.columns = clean_cols

        return df

    @classmethod
    def load_from_path(
        cls,
        path: Union[str, Path],
        file_type: Optional[str] = None,
        sheet_name: Optional[str] = None,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Load a file directly from local filesystem path."""
        p = Path(path)
        if not p.exists():
            raise ValidationException(f"File not found at path: {p}")
        ft = file_type or p.suffix.lstrip(".")
        return cls.load_from_bytes(
            p.read_bytes(), file_type=ft, sheet_name=sheet_name, n_rows=n_rows
        )

    @classmethod
    def read_file(
        cls,
        path_or_url: Union[str, Path],
        file_type: Optional[str] = None,
        sheet_name: Optional[str] = None,
        n_rows: Optional[int] = None,
    ) -> pl.DataFrame:
        """Load dataframe from path or file URL."""
        return cls.load_from_path(
            path_or_url, file_type=file_type, sheet_name=sheet_name, n_rows=n_rows
        )

    @staticmethod
    def preview_rows(df: pl.DataFrame, n: int = 50) -> List[Dict[str, Any]]:
        """Return the top N rows formatted as JSON-serializable dictionaries."""
        head_df = df.head(n)
        # Convert date / datetime to ISO format strings
        records = []
        for row in head_df.to_dicts():
            clean_row = {}
            for k, v in row.items():
                if hasattr(v, "isoformat"):
                    clean_row[k] = v.isoformat()
                elif v != v:  # NaN check
                    clean_row[k] = None
                else:
                    clean_row[k] = v
            records.append(clean_row)
        return records
