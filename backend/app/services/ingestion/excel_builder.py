"""AdvancedExcelBuilder - 15-Tab AI-Powered Excel Report Generator."""

from __future__ import annotations
import io, math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import polars as pl

try:
    import numpy as np

    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

C_GREEN = "#10B981"
C_GREEN_D = "#065F46"
C_GREEN_L = "#D1FAE5"
C_GREEN_XL = "#ECFDF5"
C_INDIGO = "#4F46E5"
C_AMBER = "#F59E0B"
C_AMBER_L = "#FEF3C7"
C_TEAL = "#14B8A6"
C_RED = "#EF4444"
C_RED_L = "#FEE2E2"
C_NAVY = "#1E293B"
C_SLATE = "#475569"
C_ROW_EVEN = "#F0FDF4"
C_ROW_ODD = "#FFFFFF"
MAX_DATA_ROWS = 10_000
MAX_COL_W = 55
MAX_PIE_CATS = 10


def _safe_float(v):
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except Exception:
        return None


def _col_w(df, col, extra=4):
    hlen = len(str(col))
    try:
        mx = (df[col].cast(pl.Utf8, strict=False).str.len_chars().max()) or 0
    except Exception:
        mx = 10
    return min(int(max(hlen, mx)) + extra, MAX_COL_W)


class AdvancedExcelBuilder:
    def __init__(self, df, profile, dataset_name, ai_content):
        self.df = df
        self.profile = profile or {}
        self.name = (dataset_name or "Dataset")[:50]
        self.ai = ai_content or {}
        self.generated_at = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
        self.num_cols = [
            c
            for c in df.columns
            if df[c].dtype
            in (
                pl.Float32,
                pl.Float64,
                pl.Int8,
                pl.Int16,
                pl.Int32,
                pl.Int64,
                pl.UInt8,
                pl.UInt16,
                pl.UInt32,
                pl.UInt64,
            )
        ]
        self.cat_cols = [
            c
            for c in df.columns
            if df[c].dtype == pl.Utf8 and 2 <= df[c].n_unique() <= 50
        ]
        self.date_cols = [
            c for c in df.columns if df[c].dtype in (pl.Date, pl.Datetime)
        ]
        self._wb = None

    def build(self):
        import xlsxwriter

        buf = io.BytesIO()
        self._wb = xlsxwriter.Workbook(
            buf,
            {"in_memory": True, "strings_to_numbers": False, "nan_inf_to_errors": True},
        )
        self._setup_formats()
        tabs = []
        tabs.append(self._t01_cover())  # 01 Cover FIRST for correct tab order
        ws_toc = self._wb.add_worksheet("02 Contents")
        ws_toc.set_tab_color(C_INDIGO)
        tabs.append(("02 Contents", "Navigate to any section"))
        tabs.append(self._t03_exec())
        tabs.append(self._t04_insights())
        tabs.append(
            self._t05_kpi()
            if self.num_cols
            else self._na("05 KPI Dashboard", "No numeric columns.")
        )
        tabs.append(
            self._t06_exec_dash()
            if self.cat_cols
            else self._na("06 Exec Dashboard", "No categorical columns.")
        )
        tabs.append(self._t07_data())
        tabs.append(self._t08_quality())
        tabs.append(
            self._t09_pivot()
            if (self.cat_cols and self.num_cols)
            else self._na("09 Pivot", "Needs cat+numeric cols.")
        )
        if self.date_cols and len(self.df) >= 10:
            tabs.append(self._t10_trend())
        elif len(self.num_cols) >= 2:
            tabs.append(self._t10_corr())
        else:
            tabs.append(self._na("10 Trend", "No date column found."))
        if self.date_cols and len(self.df) >= 30 and HAS_NUMPY:
            tabs.append(self._t11_forecast())
        else:
            tabs.append(self._t11_top())
        if self.num_cols:
            tabs.append(self._t12_anomalies())
        elif self.cat_cols:
            tabs.append(self._t12_catfreq())
        else:
            tabs.append(self._na("12 Anomalies", "No numeric/cat cols."))
        tabs.append(self._t13_recs())
        tabs.append(self._t14_method())
        tabs.append(self._t15_dict())
        self._fill_toc(ws_toc, tabs)
        self._wb.close()
        buf.seek(0)
        return buf.read()

    def _setup_formats(self):
        wb = self._wb

        def f(**kw):
            base = {"font_name": "Calibri", "font_size": 11, "valign": "vcenter"}
            base.update(kw)
            return wb.add_format(base)

        self.FT = f(
            font_size=22,
            bold=True,
            font_color="#FFFFFF",
            bg_color=C_NAVY,
            align="center",
        )
        self.FS = f(font_size=11, bold=True, font_color="#FFFFFF", bg_color=C_NAVY)
        self.FH = f(
            font_size=11,
            bold=True,
            font_color="#FFFFFF",
            bg_color=C_NAVY,
            align="center",
            border=1,
            border_color=C_GREEN,
        )
        self.FL = f(bold=True, font_color=C_NAVY)
        self.FV = f(font_color=C_SLATE)
        self.FE = f(bg_color=C_ROW_EVEN)
        self.FO = f(bg_color=C_ROW_ODD)
        self.FNE = f(bg_color=C_ROW_EVEN, num_format="#,##0.00")
        self.FNO = f(bg_color=C_ROW_ODD, num_format="#,##0.00")
        self.FSE = f(
            bg_color=C_GREEN_XL,
            bold=True,
            font_color=C_GREEN_D,
            left=2,
            left_color=C_GREEN,
            right=1,
            right_color=C_GREEN_L,
        )
        self.FSO = f(
            bg_color=C_GREEN_L,
            bold=True,
            font_color=C_GREEN_D,
            left=2,
            left_color=C_GREEN,
            right=1,
            right_color=C_GREEN_L,
        )
        self.FP = f(bg_color=C_GREEN_L, font_color=C_GREEN_D, bold=True)
        self.FF = f(bg_color=C_AMBER_L, font_color="#92400E", bold=True)
        self.FC = f(bg_color=C_RED_L, font_color="#991B1B", bold=True)
        self.FA = f(bg_color=C_RED_L, font_color="#991B1B")
        self.FNA = f(bg_color=C_RED_L, font_color="#991B1B", num_format="#,##0.00")
        self.FLINK = f(font_color=C_INDIGO, underline=True)
        self.FWRAP = f(text_wrap=True, valign="top")
        self.FSUB = f(font_size=12, italic=True, font_color=C_SLATE, align="center")

    def _na(self, name, reason):
        ws = self._wb.add_worksheet(name[:31])
        ws.set_tab_color(C_SLATE)
        ws.set_column(0, 0, 60)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", name, self.FS)
        ws.set_row(2, 20)
        ws.write(2, 0, f"Not applicable: {reason}", self.FV)
        return (name[:31], f"N/A - {reason[:55]}")

    def _sec(self, ws, row, text, ncols=6):
        ws.set_row(row, 22)
        ws.merge_range(row, 0, row, ncols - 1, text, self.FS)
        return row + 1

    def _fill_toc(self, ws, tabs):
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 6)
        ws.set_column(1, 1, 32)
        ws.set_column(2, 2, 60)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", "Table of Contents", self.FT)
        ws.set_row(2, 20)
        ws.write(2, 0, "#", self.FH)
        ws.write(2, 1, "Section", self.FH)
        ws.write(2, 2, "Description", self.FH)
        for i, (sn, desc) in enumerate(tabs):
            r = i + 3
            ws.set_row(r, 20)
            fe = self.FE if i % 2 == 0 else self.FO
            ws.write(r, 0, i + 1, fe)
            ws.write_url(r, 1, f"internal:'{sn}'!A1", self.FLINK, string=sn)
            ws.write(r, 2, desc, fe)

    def _wr(self, ws, r, c, val, fmt, is_num=False):
        if val is None:
            ws.write(r, c, "", fmt)
        elif is_num:
            f = _safe_float(val)
            if f is not None:
                ws.write_number(r, c, f, fmt)
            else:
                ws.write(r, c, str(val), fmt)
        else:
            ws.write(r, c, str(val), fmt)

    def _write_rows(self, ws, start_row, df_sub, hdrs, num_set):
        for ri, rd in enumerate(df_sub.iter_rows(named=True)):
            xl = start_row + ri
            ie = ri % 2 == 0
            for ci, col in enumerate(hdrs):
                isn = ci in num_set
                if ci == 0:
                    fmt = self.FSE if ie else self.FSO
                else:
                    fmt = (
                        (self.FNE if ie else self.FNO)
                        if isn
                        else (self.FE if ie else self.FO)
                    )
                self._wr(ws, xl, ci, rd[col], fmt, isn)

    @staticmethod
    def _get_logo_png_bytes():
        """Render the DataInsight SVG logo to PNG bytes. Returns None on failure.

        The SVG wordmark ends at ~690px but viewBox is 640px wide, causing
        the trailing 't' in 'Insight' to be clipped.  Fix: inject
        overflow="visible" into the SVG root element so cairosvg renders
        content that extends past the viewBox boundary.  We do NOT touch
        viewBox, width, height or any gradient definitions so the D-icon
        renders exactly as designed.
        """
        import os, pathlib, re as _re

        candidates = [
            "/app/app/static/logo.svg",
            str(pathlib.Path(__file__).parents[3] / "static" / "logo.svg"),
        ]
        svg_path = next((p for p in candidates if os.path.exists(p)), None)
        if not svg_path:
            return None
        try:
            import cairosvg

            with open(svg_path, "r", encoding="utf-8") as _f:
                svg_src = _f.read()
            # ONLY change: add overflow="visible" so the wordmark is not
            # clipped at the 640px viewBox boundary.
            # Keep viewBox, gradients, transforms all untouched.
            # Expand viewBox width from 640 to 780 so the wordmark "Data Insight"
            # (which ends at SVG x~700) fits without clipping.
            # IMPORTANT: do NOT touch width/height attrs — those are "100%" and
            # changing them to px values breaks gradient rendering.
            svg_src = svg_src.replace(
                'viewBox="0 0 640 160"',
                'viewBox="0 0 780 160"',
                1,
            )
            # With viewBox=780x160 and output_width=728:
            #   scale = 728/780 = 0.933
            #   x=700 in SVG → x=653 in PNG  (safely inside 728px canvas)
            return cairosvg.svg2png(
                bytestring=svg_src.encode("utf-8"),
                output_width=728,
                output_height=149,
                background_color="#FFFFFF",
            )
        except Exception:
            pass
        for p in candidates:
            png = p.replace("logo.svg", "logo_cover.png")
            if os.path.exists(png):
                with open(png, "rb") as f:
                    return f.read()
        return None

    def _t01_cover(self):
        ws = self._wb.add_worksheet("01 Cover")
        ws.set_tab_color(C_GREEN)
        ws.hide_gridlines(2)
        # Wide column layout: col A wide for content, col B for spacing
        ws.set_column(0, 0, 55)
        ws.set_column(1, 1, 20)
        ov = self.profile.get("overview", {})
        rc = ov.get("row_count") or len(self.df)
        cc = ov.get("column_count") or len(self.df.columns)
        qs = float(ov.get("quality_score") or self.profile.get("quality_score") or 0)

        # ── Row 0: top padding
        ws.set_row(0, 12)

        # ── Row 1-2: Logo banner (navy background spans the logo area)
        ws.set_row(1, 65)
        ws.set_row(2, 8)
        # Navy banner cell behind logo
        banner_fmt = self._wb.add_format(
            {
                "bg_color": "#FFFFFF",
                "valign": "vcenter",
                "bottom": 2,
                "bottom_color": C_GREEN,
            }
        )
        ws.merge_range("A2:B2", "", banner_fmt)

        # Insert SVG logo as PNG image
        logo_bytes = self._get_logo_png_bytes()
        if logo_bytes:
            import io as _io

            ws.insert_image(
                "A2",
                "logo.png",
                {
                    "image_data": _io.BytesIO(logo_bytes),
                    "x_offset": 8,
                    "y_offset": 6,
                    "x_scale": 0.75,
                    "y_scale": 0.75,
                    "object_position": 1,
                },
            )
        else:
            # Fallback: text logo if image unavailable
            logo_txt_fmt = self._wb.add_format(
                {
                    "font_name": "Calibri",
                    "font_size": 20,
                    "bold": True,
                    "font_color": "#10B981",
                    "bg_color": C_NAVY,
                    "valign": "vcenter",
                }
            )
            ws.merge_range("A2:B2", "  DataInsight", logo_txt_fmt)

        # ── Row 3: separator (thin green line effect)
        ws.set_row(3, 4)
        sep_fmt = self._wb.add_format({"bg_color": C_GREEN})
        ws.merge_range("A4:B4", "", sep_fmt)

        # ── Row 4: padding
        ws.set_row(4, 14)

        # ── Row 5: Dataset title (big, dark)
        ws.set_row(5, 48)
        title_fmt = self._wb.add_format(
            {
                "font_name": "Calibri",
                "font_size": 26,
                "bold": True,
                "font_color": C_NAVY,
                "valign": "vcenter",
                "bottom": 1,
                "bottom_color": C_GREEN_L,
            }
        )
        ws.merge_range("A6:B6", f"  {self.name}", title_fmt)

        # ── Row 6: subtitle
        ws.set_row(6, 24)
        sub_fmt = self._wb.add_format(
            {
                "font_name": "Calibri",
                "font_size": 12,
                "italic": True,
                "font_color": C_SLATE,
                "valign": "vcenter",
            }
        )
        ws.merge_range("A7:B7", "  AI-Powered Business Intelligence Report", sub_fmt)

        # ── Row 7: spacer
        ws.set_row(7, 14)

        # ── Rows 8-11: Key metrics in a clean 2-col grid
        kv_fmt_l = self._wb.add_format(
            {
                "font_name": "Calibri",
                "font_size": 11,
                "bold": True,
                "font_color": C_NAVY,
                "bg_color": C_GREEN_XL,
                "left": 3,
                "left_color": C_GREEN,
                "top": 1,
                "top_color": C_GREEN_L,
                "bottom": 1,
                "bottom_color": C_GREEN_L,
                "valign": "vcenter",
                "indent": 1,
            }
        )
        kv_fmt_r = self._wb.add_format(
            {
                "font_name": "Calibri",
                "font_size": 11,
                "font_color": C_SLATE,
                "bg_color": "#FFFFFF",
                "right": 1,
                "right_color": C_GREEN_L,
                "top": 1,
                "top_color": C_GREEN_L,
                "bottom": 1,
                "bottom_color": C_GREEN_L,
                "valign": "vcenter",
                "indent": 1,
            }
        )

        metrics = [
            ("Generated", self.generated_at),
            ("Total Rows", f"{rc:,}"),
            ("Columns", str(cc)),
            ("Quality Score", f"{qs:.1f} / 100"),
        ]
        for i, (lbl, val) in enumerate(metrics):
            r = 8 + i
            ws.set_row(r, 22)
            ws.write(r, 0, lbl, kv_fmt_l)
            ws.write(r, 1, val, kv_fmt_r)

        # ── Row 12: spacer
        ws.set_row(12, 18)

        # ── Rows 13-15: AI Executive Summary section
        es = self.ai.get("executive_summary", "")
        if es:
            sec_fmt = self._wb.add_format(
                {
                    "font_name": "Calibri",
                    "font_size": 10,
                    "bold": True,
                    "font_color": "#FFFFFF",
                    "bg_color": C_GREEN_D,
                    "valign": "vcenter",
                    "indent": 1,
                }
            )
            ws.set_row(13, 18)
            ws.merge_range("A14:B14", "  AI Executive Summary", sec_fmt)
            wrap_fmt = self._wb.add_format(
                {
                    "font_name": "Calibri",
                    "font_size": 11,
                    "font_color": C_NAVY,
                    "text_wrap": True,
                    "valign": "top",
                    "bg_color": C_GREEN_XL,
                    "left": 3,
                    "left_color": C_GREEN,
                    "right": 1,
                    "right_color": C_GREEN_L,
                    "bottom": 1,
                    "bottom_color": C_GREEN_L,
                    "indent": 1,
                }
            )
            ws.set_row(14, 75)
            ws.merge_range("A15:B15", str(es), wrap_fmt)

        # ── Footer
        ws.set_row(17, 16)
        foot_fmt = self._wb.add_format(
            {
                "font_name": "Calibri",
                "font_size": 9,
                "italic": True,
                "font_color": "#94A3B8",
                "align": "center",
            }
        )
        ws.merge_range(
            "A18:B18",
            "DataInsight AI  |  Confidential  |  Generated by AdvancedExcelBuilder",
            foot_fmt,
        )

        return ("01 Cover", "Report cover with logo, metrics, and AI executive summary")

    def _t03_exec(self):
        ws = self._wb.add_worksheet("03 Executive Summary")
        ws.set_tab_color(C_INDIGO)
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 30)
        ws.set_column(1, 1, 22)
        ws.set_column(2, 2, 30)
        ws.set_column(3, 3, 22)
        ov = self.profile.get("overview", {})
        rc = ov.get("row_count") or len(self.df)
        cc = ov.get("column_count") or len(self.df.columns)
        qs = float(ov.get("quality_score") or self.profile.get("quality_score") or 0)
        qg = str(ov.get("quality_grade") or self.profile.get("quality_grade") or "N/A")
        dup = int(ov.get("duplicate_rows") or self.profile.get("duplicate_rows") or 0)
        mp = float(
            ov.get("missing_cells_pct") or self.profile.get("missing_cells_pct") or 0
        )
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Executive Summary - {self.name}", self.FT)
        row = 2
        row = self._sec(ws, row, "Dataset Overview", 4)
        items = [
            ("Total Rows", f"{rc:,}"),
            ("Total Columns", str(cc)),
            ("Completeness", f"{round(100-mp,2):.2f}%"),
            ("Quality Score", f"{qs:.1f}/100"),
            ("Grade", qg),
            ("Duplicates", f"{dup:,}"),
            ("Numeric Cols", str(len(self.num_cols))),
            ("Category Cols", str(len(self.cat_cols))),
            ("Date Cols", str(len(self.date_cols))),
            ("Generated", self.generated_at),
        ]
        half = math.ceil(len(items) / 2)
        for i, (lbl, val) in enumerate(items):
            r = row + (i % half)
            c = (i // half) * 2
            ws.set_row(r, 22)
            ws.write(r, c, lbl, self.FL)
            ws.write(r, c + 1, val, self.FV)
        row = row + half + 2
        row = self._sec(ws, row, "Column Type Breakdown", 4)
        cp = self.profile.get("columns", {})
        types = {}
        for ci in cp.values():
            t = ci.get("type") or ci.get("dtype") or "other"
            types[t] = types.get(t, 0) + 1
        for t, cnt in sorted(types.items()):
            ws.set_row(row, 20)
            ws.write(row, 0, t.title(), self.FL)
            ws.write(row, 1, cnt, self.FV)
            row += 1
        return ("03 Executive Summary", "Key metrics and quality overview")

    def _t04_insights(self):
        ws = self._wb.add_worksheet("04 AI Insights")
        ws.set_tab_color(C_TEAL)
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 4)
        ws.set_column(1, 1, 88)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"AI Insights - {self.name}", self.FT)
        row = 2
        insights = self.ai.get("insights", [])
        if insights:
            row = self._sec(ws, row, "Key Business Insights", 2)
            for i, ins in enumerate(insights):
                ws.set_row(row, 60)
                ws.write(row, 0, f"{i+1}.", self.FL)
                ws.write(row, 1, str(ins), self.FWRAP)
                row += 1
            row += 1
        es = self.ai.get("executive_summary", "")
        if es:
            row = self._sec(ws, row, "Executive Summary", 2)
            ws.set_row(row, 80)
            ws.merge_range(row, 0, row, 1, str(es), self.FWRAP)
            row += 2
        at = self.ai.get("anomaly_summary", "")
        if at:
            row = self._sec(ws, row, "Anomaly Overview", 2)
            ws.set_row(row, 60)
            ws.merge_range(row, 0, row, 1, str(at), self.FWRAP)
            row += 2
        if not insights and not es:
            # AI failed — generate automatic insights from real profile data
            row = self._sec(ws, row, "Automated Data Profile Insights", 2)
            ov = self.profile.get("overview", {})
            rc = ov.get("row_count") or len(self.df)
            cc = ov.get("column_count") or len(self.df.columns)
            qs = float(
                ov.get("quality_score") or self.profile.get("quality_score") or 0
            )
            mp = float(
                ov.get("missing_cells_pct")
                or self.profile.get("missing_cells_pct")
                or 0
            )
            dup = int(ov.get("duplicate_rows") or 0)
            auto_insights = [
                f"Dataset contains {rc:,} records across {cc} columns with a quality score of {qs:.1f}/100.",
                f"Data completeness is {100-mp:.1f}% — {mp:.1f}% of cells contain missing values.",
                f"Duplicate rows detected: {dup:,}.",
            ]
            if self.num_cols:
                auto_insights.append(
                    f"Numeric columns available for statistical analysis: {', '.join(self.num_cols[:6])}."
                )
            if self.cat_cols:
                top_cats = []
                for c in self.cat_cols[:3]:
                    uv = int(self.df[c].n_unique())
                    top_cats.append(f"{c} ({uv} unique values)")
                auto_insights.append(f"Categorical columns: {', '.join(top_cats)}.")
            if not self.date_cols:
                auto_insights.append(
                    "No date/time column found — Trend and Forecast tabs are not available for this dataset."
                )
            else:
                auto_insights.append(
                    f"Time-series analysis available using column: {self.date_cols[0]}."
                )
            for i, ins in enumerate(auto_insights):
                ws.set_row(row, 50)
                ws.write(row, 0, f"{i+1}.", self.FL)
                ws.write(row, 1, ins, self.FWRAP)
                row += 1
        return ("04 AI Insights", "AI-generated findings and overview")

    def _t05_kpi(self):
        sn = "05 KPI Dashboard"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_GREEN)
        ws.hide_gridlines(2)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"KPI Dashboard - {self.name}", self.FT)
        hdrs = ["Column", "Count", "Mean", "Min", "Max", "Std Dev", "Nulls"]
        wds = [28, 10, 16, 16, 16, 16, 12]
        for ci, (h, w) in enumerate(zip(hdrs, wds)):
            ws.set_column(ci, ci, w)
            ws.write(2, ci, h, self.FH)
        stats = []
        for col in self.num_cols:
            s = self.df[col].drop_nulls()
            if not len(s):
                continue
            stats.append(
                [
                    col,
                    len(s),
                    _safe_float(s.mean()),
                    _safe_float(s.min()),
                    _safe_float(s.max()),
                    _safe_float(s.std()),
                    int(self.df[col].null_count()),
                ]
            )
        nr = 3
        for ri, rd in enumerate(stats):
            xl = 3 + ri
            ie = ri % 2 == 0
            ws.write(xl, 0, rd[0], self.FE if ie else self.FO)
            for ci in range(1, 7):
                v = _safe_float(rd[ci])
                fmt = self.FNE if ie else self.FNO
                if v is not None:
                    ws.write_number(xl, ci, v, fmt)
                else:
                    ws.write(xl, ci, "", fmt)
            nr += 1
        cd = [(r[0], r[2]) for r in stats if r[2] is not None][:10]
        if cd:
            ds = nr + 2
            ws.write(ds, 0, "Column", self.FH)
            ws.write(ds, 1, "Mean", self.FH)
            for i, (n, v) in enumerate(cd):
                ws.write(ds + 1 + i, 0, n, self.FE)
                ws.write_number(ds + 1 + i, 1, v, self.FNE)
            ch = self._wb.add_chart({"type": "column"})
            ch.add_series(
                {
                    "name": "Mean",
                    "categories": [sn, ds + 1, 0, ds + len(cd), 0],
                    "values": [sn, ds + 1, 1, ds + len(cd), 1],
                    "fill": {"color": C_GREEN},
                }
            )
            ch.set_title({"name": "Mean Values"})
            ch.set_legend({"none": True})
            ch.set_size({"width": 540, "height": 300})
            ws.insert_chart(nr + 2, 3, ch)
        return (sn, "Numeric column statistics with bar chart")

    def _t06_exec_dash(self):
        sn = "06 Exec Dashboard"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_AMBER)
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 28)
        ws.set_column(1, 1, 14)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Exec Dashboard - {self.name}", self.FT)
        cr = 2
        cc = 0
        for col in self.cat_cols[:5]:
            vc = self.df[col].drop_nulls().value_counts().sort("count", descending=True)
            if len(vc) > MAX_PIE_CATS:
                vc = vc.head(MAX_PIE_CATS)
            if len(vc) < 2:
                continue
            ws.set_row(cr, 20)
            ws.merge_range(cr, 0, cr, 1, f"Distribution: {col}", self.FS)
            cr += 1
            ds = cr
            ws.write(cr, 0, col, self.FH)
            ws.write(cr, 1, "Count", self.FH)
            cr += 1
            rw = 0
            for ri, rd in enumerate(vc.iter_rows(named=True)):
                ie = ri % 2 == 0
                ws.write(cr, 0, str(rd.get(col, "")), self.FE if ie else self.FO)
                ws.write_number(
                    cr, 1, int(rd.get("count", 0)), self.FNE if ie else self.FNO
                )
                cr += 1
                rw += 1
            ch = self._wb.add_chart({"type": "pie"})
            ch.add_series(
                {
                    "name": col,
                    "categories": [sn, ds + 1, 0, ds + rw, 0],
                    "values": [sn, ds + 1, 1, ds + rw, 1],
                    "data_labels": {"percentage": True},
                }
            )
            ch.set_title({"name": f"{col} Distribution"})
            ch.set_size({"width": 360, "height": 240})
            ws.insert_chart(ds, 3 + cc * 6, ch)
            cr += 2
            cc += 1
            if cc >= 3:
                break
        return (sn, "Categorical distributions with pie charts")

    def _t07_data(self):
        ws = self._wb.add_worksheet("07 Cleaned Data")
        ws.set_tab_color(C_GREEN)
        ws.freeze_panes(1, 1)
        ws.set_row(0, 25)
        df = self.df.head(MAX_DATA_ROWS)
        hdrs = df.columns
        nci = {ci for ci, c in enumerate(hdrs) if c in self.num_cols}
        for ci, col in enumerate(hdrs):
            ws.set_column(ci, ci, _col_w(df, col))
            ws.write(0, ci, col, self.FH)
        self._write_rows(ws, 1, df, hdrs, nci)
        return (
            "07 Cleaned Data",
            f"{min(len(self.df),MAX_DATA_ROWS):,} rows, frozen header+sidebar",
        )

    def _t08_quality(self):
        sn = "08 Data Quality"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_TEAL)
        ws.freeze_panes(3, 1)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Data Quality - {self.name}", self.FT)
        hdrs = [
            "Column",
            "Type",
            "Total",
            "Null Count",
            "Null %",
            "Unique Count",
            "Unique %",
            "Status",
        ]
        wds = [28, 14, 10, 12, 10, 14, 10, 12]
        ws.set_row(2, 20)
        for ci, (h, w) in enumerate(zip(hdrs, wds)):
            ws.set_column(ci, ci, w)
            ws.write(2, ci, h, self.FH)
        tr = len(self.df)
        row = 3
        for col in self.df.columns:
            dtype = str(self.df[col].dtype).split("(")[0].strip()
            nc = int(self.df[col].null_count())
            np_ = nc / tr * 100 if tr else 0
            uc = int(self.df[col].n_unique())
            up = uc / tr * 100 if tr else 0
            if np_ > 50:
                st, rf = "Critical", self.FC
            elif np_ > 20:
                st, rf = "Warning", self.FF
            else:
                st, rf = "Good", self.FP
            ie = row % 2 == 0
            bg = self.FE if ie else self.FO
            ws.write(row, 0, col, rf)
            ws.write(row, 1, dtype, bg)
            ws.write_number(row, 2, tr, bg)
            ws.write_number(row, 3, nc, bg)
            ws.write(row, 4, f"{np_:.2f}%", bg)
            ws.write_number(row, 5, uc, bg)
            ws.write(row, 6, f"{up:.2f}%", bg)
            ws.write(row, 7, st, rf)
            row += 1
        return (sn, "Per-column null counts and quality status")

    def _t09_pivot(self):
        sn = "09 Pivot Analysis"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_INDIGO)
        ws.freeze_panes(4, 1)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Pivot Analysis - {self.name}", self.FT)
        gc = min(self.cat_cols, key=lambda c: self.df[c].n_unique())
        acs = self.num_cols[:5]
        agg = []
        for nc in acs:
            agg.append(pl.col(nc).mean().alias(f"{nc}_mean"))
            agg.append(pl.col(nc).sum().alias(f"{nc}_sum"))
            agg.append(pl.col(nc).count().alias(f"{nc}_count"))
        pdf = self.df.filter(pl.col(gc).is_not_null()).group_by(gc).agg(agg).sort(gc)
        ws.set_row(2, 18)
        ws.write(2, 0, f"Grouped by: {gc}  |  Cols: {', '.join(acs)}", self.FL)
        hdrs = pdf.columns
        npi = {ci for ci, c in enumerate(hdrs) if c != gc}
        for ci, col in enumerate(hdrs):
            ws.set_column(ci, ci, _col_w(pdf, col))
            ws.write(3, ci, col, self.FH)
        for ri, rd in enumerate(pdf.iter_rows(named=True)):
            xl = 4 + ri
            ie = ri % 2 == 0
            for ci, col in enumerate(hdrs):
                isn = ci in npi
                val = rd[col]
                fmt = (
                    (self.FNE if ie else self.FNO)
                    if isn
                    else (self.FE if ie else self.FO)
                )
                self._wr(ws, xl, ci, val, fmt, isn)
        return (sn, f"Pivot by '{gc}' with mean/sum/count")

    def _t10_trend(self):
        sn = "10 Trend Analysis"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_TEAL)
        ws.freeze_panes(3, 0)
        dc = self.date_cols[0]
        vc = self.num_cols[0] if self.num_cols else None
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Trend Analysis - {self.name}", self.FT)
        if not vc:
            ws.write(2, 0, "No numeric col to plot.", self.FV)
            return (sn, "Trend N/A")
        tdf = (
            self.df.filter(pl.col(dc).is_not_null() & pl.col(vc).is_not_null())
            .sort(dc)
            .group_by(dc)
            .agg(pl.col(vc).mean().alias("avg"))
            .sort(dc)
        )
        ws.set_column(0, 0, 18)
        ws.set_column(1, 1, 18)
        ws.write(2, 0, dc, self.FH)
        ws.write(2, 1, f"Avg {vc}", self.FH)
        ds = 2
        for ri, rd in enumerate(tdf.iter_rows()):
            xl = ds + 1 + ri
            ie = ri % 2 == 0
            ws.write(
                xl,
                0,
                (str(rd[0]).split(" ")[0] if rd[0] is not None else ""),
                self.FE if ie else self.FO,
            )
            f = _safe_float(rd[1])
            if f is not None:
                ws.write_number(xl, 1, f, self.FNE if ie else self.FNO)
            else:
                ws.write(xl, 1, "", self.FE if ie else self.FO)
        n = len(tdf)
        if n >= 2:
            ch = self._wb.add_chart({"type": "line"})
            ch.add_series(
                {
                    "name": f"Avg {vc}",
                    "categories": [sn, ds + 1, 0, ds + n, 0],
                    "values": [sn, ds + 1, 1, ds + n, 1],
                    "line": {"color": C_TEAL, "width": 2.5},
                }
            )
            ch.set_title({"name": f"Trend: {vc} over {dc}"})
            ch.set_size({"width": 560, "height": 300})
            ws.insert_chart(ds, 3, ch)
        return (sn, f"Time-series of '{vc}' by '{dc}'")

    def _t10_corr(self):
        sn = "10 Correlation"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_TEAL)
        ws.freeze_panes(4, 1)
        cols = self.num_cols[:8]
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Correlation Matrix - {self.name}", self.FT)
        ws.set_row(2, 18)
        ws.write(2, 0, "Pearson correlation (-1 to +1)", self.FL)
        ws.set_column(0, 0, 25)
        for ci, col in enumerate(cols):
            ws.set_column(ci + 1, ci + 1, 14)
            ws.write(3, ci + 1, col, self.FH)
            ws.write(4 + ci, 0, col, self.FL)
        sub = self.df.select(cols).drop_nulls()
        for ri, rc in enumerate(cols):
            for ci, cc2 in enumerate(cols):
                if rc == cc2:
                    ws.write(4 + ri, 1 + ci, "1.000", self.FP)
                    continue
                try:
                    corr = float(sub.select(pl.pearson_corr(rc, cc2)).item())
                    if math.isnan(corr):
                        ws.write(4 + ri, 1 + ci, "N/A", self.FE)
                    else:
                        cf = (
                            self.FP
                            if abs(corr) > 0.5
                            else self.FF if abs(corr) > 0.3 else self.FE
                        )
                        ws.write(4 + ri, 1 + ci, f"{corr:.3f}", cf)
                except:
                    ws.write(4 + ri, 1 + ci, "N/A", self.FE)
        return (sn, "Pearson correlation matrix")

    def _t11_forecast(self):
        sn = "11 Forecasting"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_AMBER)
        ws.freeze_panes(3, 0)
        dc = self.date_cols[0]
        vc = self.num_cols[0] if self.num_cols else None
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"30-Period Forecast - {self.name}", self.FT)
        if not vc:
            ws.write(2, 0, "No numeric col.", self.FV)
            return (sn, "Forecast N/A")
        tdf = (
            self.df.filter(pl.col(dc).is_not_null() & pl.col(vc).is_not_null())
            .sort(dc)
            .group_by(dc)
            .agg(pl.col(vc).mean().alias("val"))
            .sort(dc)
        )
        if len(tdf) < 10:
            ws.write(2, 0, f"Only {len(tdf)} pts. Need 10+.", self.FV)
            return (sn, "Forecast N/A")
        dts = tdf[dc].to_list()
        vals = [_safe_float(v) for v in tdf["val"].to_list()]
        vals = [v for v in vals if v is not None]
        x = np.arange(len(vals), dtype=float)
        co = np.polyfit(x, vals, 1)
        po = np.poly1d(co)
        fx = np.arange(len(vals), len(vals) + 30, dtype=float)
        fc = po(fx)
        ws.set_column(0, 0, 18)
        ws.set_column(1, 1, 18)
        ws.set_column(2, 2, 18)
        ws.write(2, 0, dc, self.FH)
        ws.write(2, 1, f"Actual {vc}", self.FH)
        ws.write(2, 2, "Forecast", self.FH)
        ds = 2
        for ri, (d, v) in enumerate(zip(dts, vals)):
            xl = ds + 1 + ri
            ie = ri % 2 == 0
            ws.write(xl, 0, str(d), self.FE if ie else self.FO)
            ws.write_number(xl, 1, v, self.FNE if ie else self.FNO)
            ws.write_number(xl, 2, float(po(ri)), self.FNE if ie else self.FNO)
        he = ds + len(vals)
        for ri, fv in enumerate(fc):
            r = he + 1 + ri
            ws.write(r, 0, f"+{ri+1}", self.FE)
            ws.write(r, 1, "", self.FE)
            ws.write_number(r, 2, float(fv), self.FNE)
        tr2 = len(vals) + 30
        ch = self._wb.add_chart({"type": "line"})
        ch.add_series(
            {
                "name": f"Actual {vc}",
                "categories": [sn, ds + 1, 0, he, 0],
                "values": [sn, ds + 1, 1, he, 1],
                "line": {"color": C_TEAL, "width": 2},
            }
        )
        ch.add_series(
            {
                "name": "Forecast",
                "categories": [sn, ds + 1, 0, ds + tr2, 0],
                "values": [sn, ds + 1, 2, ds + tr2, 2],
                "line": {"color": C_AMBER, "width": 2, "dash_type": "dash"},
            }
        )
        ch.set_title({"name": f"Forecast - {vc}"})
        ch.set_size({"width": 560, "height": 300})
        ws.insert_chart(ds, 4, ch)
        return (sn, f"30-period forecast of '{vc}'")

    def _t11_top(self):
        sn = "11 Top Records"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_AMBER)
        ws.freeze_panes(3, 1)
        ws.set_row(0, 40)
        if not self.num_cols:
            ws.merge_range("A1:N1", f"Top Records - {self.name}", self.FT)
            ws.write(2, 0, "No numeric col.", self.FV)
            return (sn, "Top records")
        sc = self.num_cols[0]
        df = self.df.sort(sc, descending=True).head(25)
        ws.merge_range("A1:N1", f"Top 25 by {sc}", self.FT)
        hdrs = df.columns
        nci = {ci for ci, c in enumerate(hdrs) if c in self.num_cols}
        for ci, col in enumerate(hdrs):
            ws.set_column(ci, ci, _col_w(df, col))
            ws.write(2, ci, col, self.FH)
        self._write_rows(ws, 3, df, hdrs, nci)
        return (sn, f"Top 25 by '{sc}'")

    def _t12_anomalies(self):
        sn = "12 Risk & Anomalies"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_RED)
        ws.freeze_panes(4, 1)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Risk & Anomalies - {self.name}", self.FT)
        cc = self.num_cols[:6]
        mask = pl.lit(False)
        for col in cc:
            mv = self.df[col].mean()
            sv = self.df[col].std()
            if sv and sv > 0:
                mask = mask | (((pl.col(col) - mv) / sv).abs() > 3)
        adf = self.df.filter(mask).head(500)
        ws.set_row(2, 18)
        ws.write(2, 0, f"Z>3 across: {', '.join(cc)}  |  {len(adf):,} rows", self.FL)
        if len(adf) == 0:
            ws.write(4, 0, "No anomalies (Z > 3).", self.FP)
            return (sn, "No anomalies detected")
        hdrs = adf.columns
        nci = {ci for ci, c in enumerate(hdrs) if c in self.num_cols}
        for ci, col in enumerate(hdrs):
            ws.set_column(ci, ci, _col_w(adf, col))
            ws.write(3, ci, col, self.FH)
        for ri, rd in enumerate(adf.iter_rows(named=True)):
            xl = 4 + ri
            for ci, col in enumerate(hdrs):
                isn = ci in nci
                fmt = self.FNA if isn else self.FA
                self._wr(ws, xl, ci, rd[col], fmt, isn)
        return (sn, f"{len(adf):,} anomaly rows (Z>3)")

    def _t12_catfreq(self):
        sn = "12 Category Freq"
        ws = self._wb.add_worksheet(sn)
        ws.set_tab_color(C_RED)
        ws.freeze_panes(0, 0)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Category Frequencies - {self.name}", self.FT)
        ws.set_column(0, 0, 28)
        ws.set_column(1, 1, 14)
        ws.set_column(2, 2, 12)
        cr = 2
        tr = len(self.df)
        for col in self.cat_cols[:5]:
            vc = self.df[col].drop_nulls().value_counts().sort("count", descending=True)
            cr = self._sec(ws, cr, f"Column: {col}", 3)
            ws.write(cr, 0, col, self.FH)
            ws.write(cr, 1, "Count", self.FH)
            ws.write(cr, 2, "%", self.FH)
            cr += 1
            for ri, rd in enumerate(vc.iter_rows(named=True)):
                ie = ri % 2 == 0
                cnt = int(rd.get("count", 0))
                pct = cnt / tr * 100 if tr else 0
                ws.write(cr, 0, str(rd.get(col, "")), self.FE if ie else self.FO)
                ws.write_number(cr, 1, cnt, self.FNE if ie else self.FNO)
                ws.write(cr, 2, f"{pct:.1f}%", self.FE if ie else self.FO)
                cr += 1
            cr += 1
        return (sn, "Category frequency counts")

    def _t13_recs(self):
        ws = self._wb.add_worksheet("13 Recommendations")
        ws.set_tab_color(C_GREEN)
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 5)
        ws.set_column(1, 1, 88)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Recommendations - {self.name}", self.FT)
        row = 2
        recs = self.ai.get("recommendations", [])
        if recs:
            row = self._sec(ws, row, "AI Recommendations", 2)
            for i, r in enumerate(recs):
                ws.set_row(row, 60)
                ws.write(row, 0, f"{i+1}.", self.FL)
                ws.write(row, 1, str(r), self.FWRAP)
                row += 1
        # Auto-generate recs from profile if AI recs empty
        if not recs:
            ov = self.profile.get("overview", {})
            rc = ov.get("row_count") or len(self.df)
            cc = ov.get("column_count") or len(self.df.columns)
            qs = float(
                ov.get("quality_score") or self.profile.get("quality_score") or 0
            )
            mp = float(
                ov.get("missing_cells_pct")
                or self.profile.get("missing_cells_pct")
                or 0
            )
            row = self._sec(ws, row, "Automated Recommendations", 2)
            auto_recs = [
                f"This dataset has {rc:,} rows and {cc} columns — suitable for statistical modeling.",
                f"Quality score is {qs:.1f}/100 — {'excellent data quality.' if qs >= 90 else 'review missing values before modeling.'}",
            ]
            if mp > 5:
                auto_recs.append(
                    f"Missing data at {mp:.1f}% — apply imputation strategies (mean/median/mode) before analysis."
                )
            if self.num_cols:
                auto_recs.append(
                    f"Perform correlation analysis on numeric columns: {', '.join(self.num_cols[:4])}."
                )
            if self.cat_cols:
                auto_recs.append(
                    f"Encode categorical columns ({', '.join(self.cat_cols[:3])}) before machine learning models."
                )
            if not self.date_cols:
                auto_recs.append(
                    "Add a date/timestamp column to enable time-series Trend and Forecast analysis."
                )
            for i, r in enumerate(auto_recs):
                ws.set_row(row, 50)
                ws.write(row, 0, f"{i+1}.", self.FL)
                ws.write(row, 1, r, self.FWRAP)
                row += 1
            row += 1
        row += 1
        row = self._sec(ws, row, "Data-Driven Checks", 2)
        ov = self.profile.get("overview", {})
        dup = int(ov.get("duplicate_rows") or 0)
        mp = float(ov.get("missing_cells_pct") or 0)
        cp = self.profile.get("columns", {})
        hn = [c for c, d in cp.items() if d.get("null_pct", 0) > 50]
        auto = []
        if dup > 0:
            auto.append(f"Remove {dup:,} duplicate rows.")
        if mp > 5:
            auto.append(f"Missing data is {mp:.1f}% - consider imputation.")
        if hn:
            auto.append(f"Cols >50% nulls: {', '.join(hn)}.")
        if not self.date_cols:
            auto.append("No date col - add one to unlock Trend and Forecast tabs.")
        if not self.num_cols:
            auto.append("No numeric cols - encode categoricals for deeper analysis.")
        if not auto:
            auto.append("Dataset passes all quality checks.")
        for r in auto:
            ws.set_row(row, 40)
            ws.write(row, 0, "*", self.FL)
            ws.write(row, 1, r, self.FWRAP)
            row += 1
        return ("13 Recommendations", "AI and data-driven recommendations")

    def _t14_method(self):
        ws = self._wb.add_worksheet("14 Methodology")
        ws.set_tab_color(C_SLATE)
        ws.hide_gridlines(2)
        ws.set_column(0, 0, 35)
        ws.set_column(1, 1, 55)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Methodology - {self.name}", self.FT)
        ov = self.profile.get("overview", {})
        row = 2
        row = self._sec(ws, row, "Processing Pipeline", 2)
        steps = [
            (
                "Step 1: File Parsing",
                "Raw file parsed using PolarsEngine for columnar processing.",
            ),
            (
                "Step 2: Data Cleaning",
                "Nulls identified, duplicates flagged, types inferred.",
            ),
            (
                "Step 3: Profiling",
                "Per-column stats: null%, unique%, mean, std, min, max.",
            ),
            (
                "Step 4: AI Analysis",
                "Stats sent to Groq AI. Returns insights, recs, anomaly summary, col descriptions.",
            ),
            (
                "Step 5: Excel Build",
                "15-tab XLSX via XlsxWriter: real aggregations, native charts, auto-sized cols.",
            ),
            (
                "Step 6: Save",
                "File saved to storage. WebSocket triggers frontend download.",
            ),
        ]
        for lbl, desc in steps:
            ws.set_row(row, 40)
            ws.write(row, 0, lbl, self.FL)
            ws.write(row, 1, desc, self.FWRAP)
            row += 1
        row += 1
        row = self._sec(ws, row, "Dataset Metrics", 2)
        metrics = [
            ("Generator", "DataInsight AI - AdvancedExcelBuilder v2"),
            ("Generated At", self.generated_at),
            ("Dataset", self.name),
            ("Rows", f"{ov.get('row_count') or len(self.df):,}"),
            ("Columns", str(ov.get("column_count") or len(self.df.columns))),
            ("Quality", f"{float(ov.get('quality_score') or 0):.1f}/100"),
        ]
        for lbl, val in metrics:
            ws.set_row(row, 20)
            ws.write(row, 0, lbl, self.FL)
            ws.write(row, 1, val, self.FV)
            row += 1
        return ("14 Methodology", "Processing pipeline and metrics")

    def _t15_dict(self):
        ws = self._wb.add_worksheet("15 Data Dictionary")
        ws.set_tab_color(C_NAVY)
        ws.freeze_panes(3, 1)
        ws.set_row(0, 40)
        ws.merge_range("A1:N1", f"Data Dictionary - {self.name}", self.FT)
        hdrs = [
            "Column",
            "Data Type",
            "Null Count",
            "Null %",
            "Unique Count",
            "Sample Values",
            "AI Description",
        ]
        wds = [28, 14, 12, 10, 14, 35, 55]
        ws.set_row(2, 20)
        for ci, (h, w) in enumerate(zip(hdrs, wds)):
            ws.set_column(ci, ci, w)
            ws.write(2, ci, h, self.FH)
        cd = self.ai.get("column_descriptions", {})
        tr = len(self.df)
        for ri, col in enumerate(self.df.columns):
            row = 3 + ri
            ie = ri % 2 == 0
            bg = self.FE if ie else self.FO
            dtype = str(self.df[col].dtype).split("(")[0].strip()
            nc = int(self.df[col].null_count())
            np_ = nc / tr * 100 if tr else 0
            uc = int(self.df[col].n_unique())
            smp = (
                self.df[col]
                .drop_nulls()
                .unique()
                .head(3)
                .cast(pl.Utf8, strict=False)
                .to_list()
            )
            smp_str = " | ".join(str(s) for s in smp) if smp else "-"
            ws.set_row(row, 40)
            ws.write(row, 0, col, self.FL)
            ws.write(row, 1, dtype, bg)
            ws.write_number(row, 2, nc, bg)
            ws.write(row, 3, f"{np_:.1f}%", bg)
            ws.write_number(row, 4, uc, bg)
            ws.write(row, 5, smp_str, bg)
            ws.write(row, 6, str(cd.get(col, "")) or "-", self.FWRAP)
        return ("15 Data Dictionary", "Column types, nulls, samples, AI descriptions")
