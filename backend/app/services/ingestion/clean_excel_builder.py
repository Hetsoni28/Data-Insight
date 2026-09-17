"""
Clean Data Excel Builder
Generates a professional 3-tab Excel report from a cleaned dataset.
All stats are computed dynamically from the real data — zero hardcoded values.

Tabs:
  1. 📊 Data Quality Dashboard  — before vs after cleaning comparison
  2. ✅ Clean Data               — ALL rows of the cleaned dataset
  3. 🔬 Column Profiles          — per-column stats (nulls, unique, min/max/mean)
"""

from __future__ import annotations

import io
import math
from typing import Any

import polars as pl
import xlsxwriter


class CleanExcelBuilder:
    """Builds a 3-tab formatted Excel file from cleaned dataset data."""

    def __init__(
        self,
        df_original: pl.DataFrame,
        df_cleaned: pl.DataFrame,
        cleaning_metrics: dict[str, Any],
        original_profile: dict[str, Any],
        clean_profile: dict[str, Any],
        dataset_name: str,
    ):
        self.df_original = df_original
        self.df_cleaned = df_cleaned
        self.metrics = cleaning_metrics
        self.orig_profile = original_profile
        self.clean_profile = clean_profile
        self.dataset_name = dataset_name

    def build(self) -> bytes:
        buf = io.BytesIO()
        wb = xlsxwriter.Workbook(buf, {"in_memory": True, "default_date_format": "yyyy-mm-dd"})
        self._add_formats(wb)
        self._build_dashboard(wb)
        self._build_clean_data(wb)
        self._build_column_profiles(wb)
        wb.close()
        return buf.getvalue()

    # ── Formats ───────────────────────────────────────────────────────────────

    def _add_formats(self, wb: xlsxwriter.Workbook):
        self.fmt = {}

        self.fmt["title"] = wb.add_format({
            "bold": True, "font_size": 18, "font_color": "#0F172A",
            "bg_color": "#ECFDF5", "align": "left", "valign": "vcenter",
            "bottom": 2, "bottom_color": "#10B981",
        })
        self.fmt["section"] = wb.add_format({
            "bold": True, "font_size": 11, "font_color": "#FFFFFF",
            "bg_color": "#1E293B", "align": "left", "valign": "vcenter",
            "top": 1, "bottom": 1,
        })
        self.fmt["label"] = wb.add_format({
            "bold": True, "font_size": 10, "font_color": "#374151",
            "bg_color": "#F8FAFC",
        })
        self.fmt["value_before"] = wb.add_format({
            "font_size": 10, "font_color": "#374151",
            "bg_color": "#FEF2F2", "num_format": "#,##0",
        })
        self.fmt["value_after"] = wb.add_format({
            "font_size": 10, "font_color": "#065F46",
            "bg_color": "#ECFDF5", "bold": True, "num_format": "#,##0",
        })
        self.fmt["value_after_pct"] = wb.add_format({
            "font_size": 10, "font_color": "#065F46",
            "bg_color": "#ECFDF5", "bold": True, "num_format": "0.00%",
        })
        self.fmt["value_before_pct"] = wb.add_format({
            "font_size": 10, "font_color": "#374151",
            "bg_color": "#FEF2F2", "num_format": "0.00%",
        })
        self.fmt["col_header"] = wb.add_format({
            "bold": True, "font_size": 10, "font_color": "#FFFFFF",
            "bg_color": "#1E293B", "align": "center", "valign": "vcenter",
            "border": 1, "border_color": "#334155",
        })
        self.fmt["col_header_green"] = wb.add_format({
            "bold": True, "font_size": 10, "font_color": "#FFFFFF",
            "bg_color": "#059669", "align": "center", "valign": "vcenter",
            "border": 1, "border_color": "#047857",
        })
        self.fmt["removed_label"] = wb.add_format({
            "bold": True, "font_size": 10, "font_color": "#92400E",
            "bg_color": "#FEF3C7",
        })
        self.fmt["removed_val"] = wb.add_format({
            "font_size": 10, "font_color": "#92400E",
            "bg_color": "#FEF3C7", "num_format": "#,##0",
        })
        self.fmt["pass_fmt"] = wb.add_format({
            "font_size": 10, "bg_color": "#DCFCE7", "font_color": "#14532D",
        })
        self.fmt["fail_fmt"] = wb.add_format({
            "font_size": 10, "bg_color": "#FEF2F2", "font_color": "#7F1D1D",
        })
        self.fmt["row_even"] = wb.add_format({"bg_color": "#F8FAFC"})
        self.fmt["row_odd"] = wb.add_format({"bg_color": "#FFFFFF"})
        self.fmt["row_even_num"] = wb.add_format({"bg_color": "#F8FAFC", "num_format": "#,##0.##"})
        self.fmt["row_odd_num"] = wb.add_format({"bg_color": "#FFFFFF", "num_format": "#,##0.##"})
        self.fmt["sidebar_even"] = wb.add_format({
            "bg_color": "#ECFDF5", "bold": True, "font_color": "#065F46",
            "left": 2, "left_color": "#10B981",
        })
        self.fmt["sidebar_odd"] = wb.add_format({
            "bg_color": "#D1FAE5", "bold": True, "font_color": "#065F46",
            "left": 2, "left_color": "#10B981",
        })
        self.fmt["note"] = wb.add_format({
            "italic": True, "font_size": 9, "font_color": "#6B7280",
        })

    # ── Tab 1: Data Quality Dashboard ─────────────────────────────────────────

    def _build_dashboard(self, wb: xlsxwriter.Workbook):
        ws = wb.add_worksheet("📊 Quality Dashboard")
        ws.set_tab_color("#10B981")
        ws.set_zoom(100)
        ws.set_column("A:A", 32)
        ws.set_column("B:B", 22)
        ws.set_column("C:C", 22)

        row = 0

        # Title
        ws.merge_range(row, 0, row, 2, f"Data Quality Report — {self.dataset_name}", self.fmt["title"])
        ws.set_row(row, 30)
        row += 2

        # ── Before vs After header
        ws.write(row, 0, "METRIC", self.fmt["section"])
        ws.write(row, 1, "⚠ ORIGINAL DATA", self.fmt["section"])
        ws.write(row, 2, "✅ AFTER CLEANING", self.fmt["section"])
        row += 1

        orig_rows = self.metrics["initial_rows"]
        clean_rows = self.metrics["final_rows"]
        orig_cols = len(self.df_original.columns)
        clean_cols = len(self.df_cleaned.columns)
        orig_dupes = self.metrics["duplicates_removed"]
        orig_empty = self.metrics["empty_rows_removed"]
        orig_nulls = self.metrics["total_nulls_before"]
        clean_nulls = self.metrics["total_nulls_after"]
        orig_score = self.orig_profile.get("quality_score", 0)
        clean_score = self.clean_profile.get("quality_score", 0)
        orig_miss_pct = self.orig_profile.get("missing_cells_pct", 0) / 100
        clean_miss_pct = self.clean_profile.get("missing_cells_pct", 0) / 100

        rows_data = [
            ("Total Rows",         orig_rows,      clean_rows,     False),
            ("Total Columns",      orig_cols,      clean_cols,     False),
            ("Duplicate Rows",     orig_dupes,     0,              False),
            ("Fully Empty Rows",   orig_empty,     0,              False),
            ("Total Null Cells",   orig_nulls,     clean_nulls,    False),
            ("Missing Data %",     orig_miss_pct,  clean_miss_pct, True),
            ("Data Quality Score", orig_score,     clean_score,    False),
        ]

        for label, before_val, after_val, is_pct in rows_data:
            ws.write(row, 0, label, self.fmt["label"])
            if is_pct:
                ws.write(row, 1, before_val, self.fmt["value_before_pct"])
                ws.write(row, 2, after_val, self.fmt["value_after_pct"])
            else:
                ws.write(row, 1, before_val, self.fmt["value_before"])
                ws.write(row, 2, after_val, self.fmt["value_after"])
            row += 1

        row += 1

        # ── What Was Cleaned section
        ws.merge_range(row, 0, row, 2, "WHAT WAS CLEANED", self.fmt["section"])
        row += 1

        removed_rows = [
            ("Duplicate rows removed",  self.metrics["duplicates_removed"]),
            ("Empty rows removed",       self.metrics["empty_rows_removed"]),
            ("Null cells filled",        self.metrics["nulls_filled"]),
            ("Total rows in Clean File", self.metrics["final_rows"]),
        ]
        for label, val in removed_rows:
            ws.write(row, 0, label, self.fmt["removed_label"])
            ws.write(row, 1, val, self.fmt["removed_val"])
            ws.write(row, 2, "", self.fmt["removed_val"])
            row += 1

        row += 1

        # ── Per-column null report
        ws.merge_range(row, 0, row, 2, "COLUMN-LEVEL NULL REPORT", self.fmt["section"])
        row += 1

        ws.write(row, 0, "Column Name", self.fmt["col_header"])
        ws.write(row, 1, "Nulls Before Cleaning", self.fmt["col_header"])
        ws.write(row, 2, "Filled With", self.fmt["col_header_green"])
        row += 1

        null_fill_map = self.metrics.get("null_fill_map", {})
        for col in self.df_original.columns:
            nulls_before = int(self.df_original[col].null_count())
            if nulls_before > 0:
                fill_val = null_fill_map.get(col, "—")
                ws.write(row, 0, col, self.fmt["label"])
                ws.write(row, 1, nulls_before, self.fmt["value_before"])
                ws.write(row, 2, str(fill_val), self.fmt["value_after"])
                row += 1

        if not any(int(self.df_original[c].null_count()) > 0 for c in self.df_original.columns):
            ws.merge_range(row, 0, row, 2, "✅ No null values found in original dataset", self.fmt["pass_fmt"])
            row += 1

        row += 2
        ws.write(row, 0, f"Generated by Data Insight AI  |  Clean Data: {clean_rows:,} rows × {clean_cols} columns", self.fmt["note"])

    # ── Tab 2: Clean Data (ALL rows) ─────────────────────────────────────────

    def _build_clean_data(self, wb: xlsxwriter.Workbook):
        ws = wb.add_worksheet("✅ Clean Data")
        ws.set_tab_color("#059669")
        ws.freeze_panes(1, 1)
        ws.set_row(0, 22)

        headers = self.df_cleaned.columns if self.df_cleaned.columns else self.df_original.columns

        # ── Empty dataframe = quality-only report (data is in CSV) ───────────
        if len(self.df_cleaned) == 0:
            clean_rows = self.metrics.get("final_rows", 0)
            clean_cols = len(self.df_original.columns)
            ws.set_column("A:A", 80)

            note_fmt   = wb.add_format({"font_size": 14, "bold": True, "font_color": "#065F46",
                                        "bg_color": "#D1FAE5", "align": "left", "valign": "vcenter",
                                        "border": 1, "border_color": "#6EE7B7"})
            sub_fmt    = wb.add_format({"font_size": 11, "font_color": "#374151",
                                        "bg_color": "#F0FDF4", "align": "left", "valign": "vcenter",
                                        "border": 1, "border_color": "#A7F3D0"})
            label_fmt  = wb.add_format({"font_size": 12, "bold": True, "font_color": "#1E293B",
                                        "bg_color": "#ECFDF5", "align": "left", "valign": "vcenter"})
            value_fmt  = wb.add_format({"font_size": 12, "font_color": "#065F46",
                                        "bg_color": "#ECFDF5", "align": "left", "valign": "vcenter",
                                        "num_format": "#,##0"})

            ws.set_row(1, 40)
            ws.set_row(2, 30)
            ws.set_row(3, 25)
            ws.set_row(4, 25)
            ws.set_row(5, 25)
            ws.set_row(8, 30)

            ws.merge_range(1, 0, 1, 3,
                "📄 Your full clean data is in the CSV file inside the ZIP archive", note_fmt)
            ws.merge_range(2, 0, 2, 3,
                "This Excel file contains the Quality Dashboard and Column Profiles only.", sub_fmt)

            ws.set_column("A:A", 40)
            ws.set_column("B:B", 25)

            ws.write(4, 0, "Total Clean Rows:", label_fmt)
            ws.write(4, 1, clean_rows, value_fmt)

            ws.write(5, 0, "Total Columns:", label_fmt)
            ws.write(5, 1, clean_cols, value_fmt)

            ws.write(6, 0, "Duplicates Removed:", label_fmt)
            ws.write(6, 1, self.metrics.get("duplicates_removed", 0), value_fmt)

            ws.write(7, 0, "Nulls Filled:", label_fmt)
            ws.write(7, 1, self.metrics.get("nulls_filled", 0), value_fmt)

            ws.merge_range(9, 0, 9, 3,
                "➡  Open the CSV file in the ZIP to view and use all clean rows.", sub_fmt)
            return

        # ── Normal case: write ALL rows ───────────────────────────────────────
        for col_idx, header in enumerate(headers):
            ws.write(0, col_idx, header, self.fmt["col_header_green"])

        # Write ALL rows (no cap — Excel handles up to 1,048,575)
        for row_idx, row_data in enumerate(self.df_cleaned.iter_rows(named=True)):
            xl_row = row_idx + 1
            is_even = xl_row % 2 == 0
            for col_idx, col in enumerate(headers):
                val = row_data[col]
                if col_idx == 0:
                    fmt = self.fmt["sidebar_even"] if is_even else self.fmt["sidebar_odd"]
                else:
                    fmt = self.fmt["row_even"] if is_even else self.fmt["row_odd"]
                    if isinstance(val, (int, float)):
                        fmt = self.fmt["row_even_num"] if is_even else self.fmt["row_odd_num"]

                if val is None:
                    ws.write(xl_row, col_idx, "", fmt)
                elif isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                    ws.write(xl_row, col_idx, "", fmt)
                elif isinstance(val, (int, float)):
                    ws.write_number(xl_row, col_idx, val, fmt)
                else:
                    ws.write(xl_row, col_idx, str(val), fmt)

        # Auto-size columns
        sample = self.df_cleaned.head(200)
        for col_idx, col in enumerate(headers):
            max_len = len(str(col))
            for r in sample.iter_rows(named=True):
                max_len = max(max_len, len(str(r[col] or "")))
            ws.set_column(col_idx, col_idx, min(50, max_len + 4))

    # ── Tab 3: Column Profiles ───────────────────────────────────────────────

    def _build_column_profiles(self, wb: xlsxwriter.Workbook):
        ws = wb.add_worksheet("🔬 Column Profiles")
        ws.set_tab_color("#6366F1")
        ws.freeze_panes(1, 1)

        col_headers = [
            "Column Name", "Data Type", "Original Nulls", "Original Null %",
            "After Nulls", "Unique Values", "Unique %", "Min", "Max", "Mean", "Std Dev",
        ]
        col_widths = [25, 14, 15, 14, 12, 14, 10, 14, 14, 14, 14]
        for i, (h, w) in enumerate(zip(col_headers, col_widths)):
            ws.write(0, i, h, self.fmt["col_header"])
            ws.set_column(i, i, w)

        num_types = (
            pl.Float32, pl.Float64, pl.Int8, pl.Int16, pl.Int32, pl.Int64,
            pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64,
        )
        total_rows = len(self.df_original)

        for row_idx, col in enumerate(self.df_original.columns, start=1):
            is_even = row_idx % 2 == 0
            fmt = self.fmt["row_even"] if is_even else self.fmt["row_odd"]
            num_fmt = self.fmt["row_even_num"] if is_even else self.fmt["row_odd_num"]

            orig_nulls = int(self.df_original[col].null_count())
            orig_null_pct = round(orig_nulls / total_rows * 100, 2) if total_rows else 0
            after_nulls = int(self.df_cleaned[col].null_count()) if col in self.df_cleaned.columns else 0
            unique_count = int(self.df_cleaned[col].n_unique()) if col in self.df_cleaned.columns else 0
            unique_pct = round(unique_count / len(self.df_cleaned) * 100, 2) if len(self.df_cleaned) else 0
            dtype = str(self.df_original[col].dtype)

            ws.write(row_idx, 0, col, fmt)
            ws.write(row_idx, 1, dtype, fmt)
            ws.write(row_idx, 2, orig_nulls, num_fmt)
            ws.write(row_idx, 3, f"{orig_null_pct:.2f}%", fmt)
            ws.write(row_idx, 4, after_nulls, num_fmt)
            ws.write(row_idx, 5, unique_count, num_fmt)
            ws.write(row_idx, 6, f"{unique_pct:.2f}%", fmt)

            if self.df_cleaned[col].dtype in num_types if col in self.df_cleaned.columns else False:
                s = self.df_cleaned[col].drop_nulls()
                if len(s):
                    ws.write_number(row_idx, 7, round(float(s.min()), 4), num_fmt)
                    ws.write_number(row_idx, 8, round(float(s.max()), 4), num_fmt)
                    ws.write_number(row_idx, 9, round(float(s.mean()), 4), num_fmt)
                    ws.write_number(row_idx, 10, round(float(s.std() or 0), 4), num_fmt)
                else:
                    for i in range(7, 11):
                        ws.write(row_idx, i, "—", fmt)
            else:
                for i in range(7, 11):
                    ws.write(row_idx, i, "N/A", fmt)
