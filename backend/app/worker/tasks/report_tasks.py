"""Celery task — Full 20-step AI Excel generation pipeline."""

import uuid
import io
from loguru import logger
from celery import shared_task


@shared_task(
    bind=True, name="report.generate_excel", max_retries=2, default_retry_delay=120
)
def generate_excel_report_task(self, report_id: str):
    """
    AI Excel Generation Pipeline — 20 steps:
      Phase 1 (Steps 1-5):   Load data, validate, profile
      Phase 2 (Steps 6-10):  Claude blueprint + GPT-4o narrative
      Phase 3 (Steps 11-18): XlsxWriter builds all 10 sheets
      Phase 4 (Steps 19-20): Upload to Supabase, update report record
    """
    import asyncio

    asyncio.run(_run_excel_pipeline(self, report_id))


async def _run_excel_pipeline(task, report_id: str):
    import xlsxwriter
    import httpx
    from app.db.session import AsyncSessionLocal
    from app.repositories.report import ReportRepository
    from app.repositories.dataset import DatasetRepository
    from app.repositories.user import UserRepository
    from app.models.report import ReportStatus
    from app.services.ai_service import AIService
    from app.core.storage import (
        get_signed_url,
        upload_file,
        report_storage_path,
        DATASETS_BUCKET,
        REPORTS_BUCKET,
    )

    async with AsyncSessionLocal() as session:
        report_repo = ReportRepository(session)
        ds_repo = DatasetRepository(session)

        report = await report_repo.get_by_id(uuid.UUID(report_id))
        if not report:
            logger.error(f"Report {report_id} not found")
            return

        try:
            # ── STEP 1: Mark as generating ──────────────────────────────────
            await report_repo.update_status(report, ReportStatus.generating, progress=5)
            await session.commit()

            # ── STEP 2: Load dataset ─────────────────────────────────────────
            dataset = await ds_repo.get_by_id(report.dataset_id)

            # Support both local storage and Supabase
            from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR

            if is_local_storage():
                local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
                file_bytes = local_path.read_bytes()
            else:
                signed_url = get_signed_url(
                    DATASETS_BUCKET, dataset.file_url, expires_in=600
                )
                async with httpx.AsyncClient() as client:
                    response = await client.get(signed_url)
                    file_bytes = response.content

            # ── STEP 3: Parse into Pandas ────────────────────────────────────
            # file_type may be a string or Enum depending on SQLAlchemy version
            ext = (
                dataset.file_type.value
                if hasattr(dataset.file_type, "value")
                else str(dataset.file_type)
            )
            ext = ext.lower().strip()
            df = _load_dataframe(file_bytes, ext)
            await report_repo.update_status(
                report, ReportStatus.generating, progress=15
            )
            await session.commit()

            # ── STEP 4: Clean data ───────────────────────────────────────────
            df_cleaned = _clean_dataframe(df.copy())
            await report_repo.update_status(
                report, ReportStatus.generating, progress=20
            )
            await session.commit()

            # ── STEP 5: Profile summary for AI ──────────────────────────────
            import json

            profile_summary = json.dumps(dataset.profile or {}, indent=2)[:3000]

            # ── STEP 6: Claude blueprint ─────────────────────────────────────
            user_repo = UserRepository(session)
            await user_repo.get_by_id(report.created_by_id)
            ai_svc = AIService(session)
            blueprint = await ai_svc.generate_blueprint(
                dataset_summary=profile_summary,
                tenant_id=report.tenant_id,
                user_id=report.created_by_id,
                report_id=uuid.UUID(report_id),
                dataset_id=report.dataset_id,
            )
            report.ai_blueprint = blueprint
            await session.commit()
            await report_repo.update_status(
                report, ReportStatus.generating, progress=35
            )
            await session.commit()

            # ── STEP 7: GPT-4o executive summary ────────────────────────────
            data_insights = _extract_insights(df_cleaned, profile_summary)
            exec_summary = await ai_svc.write_executive_summary(
                blueprint=blueprint,
                data_insights=data_insights,
                tenant_id=report.tenant_id,
                user_id=report.created_by_id,
                report_id=uuid.UUID(report_id),
            )
            await session.commit()
            await report_repo.update_status(
                report, ReportStatus.generating, progress=50
            )
            await session.commit()

            # ── STEPS 8-18: Build Excel workbook ────────────────────────────
            output = io.BytesIO()
            wb = xlsxwriter.Workbook(
                output, {"in_memory": True, "strings_to_urls": False}
            )
            _build_workbook(
                wb, df, df_cleaned, blueprint, exec_summary, report, dataset
            )
            wb.close()
            excel_bytes = output.getvalue()
            await report_repo.update_status(
                report, ReportStatus.generating, progress=80
            )
            await session.commit()

            # ── STEP 19: Upload / Save Excel file ────────────────────────────
            filename = f"{report.title[:50].replace(' ', '_')}.xlsx"
            storage_path = report_storage_path(
                report.tenant_id, uuid.UUID(report_id), filename
            )

            from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR

            if is_local_storage():
                # Save Excel file to local disk
                local_report_path = LOCAL_UPLOADS_DIR / REPORTS_BUCKET / storage_path
                local_report_path.parent.mkdir(parents=True, exist_ok=True)
                local_report_path.write_bytes(excel_bytes)
                # Use a relative path as the download URL (served via static files)
                output_url = f"/api/v1/storage/{REPORTS_BUCKET}/{storage_path}"
            else:
                upload_file(
                    REPORTS_BUCKET,
                    excel_bytes,
                    storage_path,
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                output_url = get_signed_url(
                    REPORTS_BUCKET, storage_path, expires_in=86400
                )  # 24h

            # ── STEP 20: Update report record ──────────────────────────────
            await report_repo.update_status(
                report,
                ReportStatus.ready,
                progress=100,
                output_url=output_url,
                output_size_bytes=len(excel_bytes),
            )
            await session.commit()
            logger.success(
                f"Report {report_id} generated successfully — {len(excel_bytes):,} bytes"
            )

        except Exception as exc:
            logger.exception(f"Excel pipeline failed for report {report_id}: {exc}")
            await report_repo.update_status(
                report, ReportStatus.error, error_message=str(exc)[:500]
            )
            await session.commit()
            raise task.retry(exc=exc)


def _load_dataframe(file_bytes: bytes, ext: str):
    import pandas as pd
    import io

    if ext == "csv":
        return pd.read_csv(io.BytesIO(file_bytes))
    elif ext == "xlsx":
        return pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    elif ext == "json":
        return pd.read_json(io.BytesIO(file_bytes))
    raise ValueError(f"Unsupported format: {ext}")


def _clean_dataframe(df):
    """Basic cleaning: forward-fill nulls, drop full duplicates, fix object types."""
    import pandas as pd

    df = df.drop_duplicates()
    # Forward-fill then backfill numeric NaNs
    numeric_cols = df.select_dtypes(include="number").columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    # Try parsing date-like columns
    for col in df.columns:
        if df[col].dtype == object and "date" in col.lower():
            try:
                df[col] = pd.to_datetime(df[col], errors="coerce")
            except Exception:
                pass
    return df


def _extract_insights(df, profile_summary: str) -> str:
    """Extract key numeric insights for GPT-4o summary prompt."""

    lines = []
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    for col in numeric_cols[:5]:
        total = df[col].sum()
        mean = df[col].mean()
        lines.append(f"- {col}: total={total:,.2f}, mean={mean:,.2f}, rows={len(df)}")
    return "\n".join(lines) or "No numeric data available."


def _build_workbook(wb, df_raw, df_clean, blueprint, exec_summary, report, dataset):
    """Build the full 12-sheet Enterprise BI Excel workbook using XlsxWriter (World Class UI)."""
    import numpy as np
    from datetime import datetime, timezone
    from xlsxwriter.utility import xl_col_to_name

    # ── Emerald & Slate Color Palette ──────────────────────────────────────
    EMERALD_900 = "#064e3b"
    EMERALD_950 = "#022c22"
    EMERALD_500 = "#10b981"
    EMERALD_50 = "#ecfdf5"
    SLATE_900 = "#0f172a"
    SLATE_50 = "#f8fafc"
    WHITE = "#ffffff"
    WARNING = "#f59e0b"

    # ── Shared formats ─────────────────────────────────────────────────────
    fmt_sidebar = wb.add_format({"bg_color": EMERALD_950, "font_color": WHITE})
    fmt_sidebar_title = wb.add_format(
        {
            "bg_color": EMERALD_950,
            "font_color": EMERALD_500,
            "bold": True,
            "font_size": 16,
            "align": "center",
            "valign": "vcenter",
        }
    )
    fmt_sidebar_link = wb.add_format(
        {
            "bg_color": EMERALD_950,
            "font_color": WHITE,
            "font_size": 11,
            "underline": True,
            "align": "left",
            "valign": "vcenter",
            "indent": 1,
        }
    )

    fmt_page_title = wb.add_format(
        {
            "bold": True,
            "font_size": 26,
            "font_color": EMERALD_900,
            "bg_color": WHITE,
            "align": "left",
            "valign": "vcenter",
        }
    )

    fmt_header = wb.add_format(
        {
            "bold": True,
            "font_size": 11,
            "font_color": WHITE,
            "bg_color": EMERALD_900,
            "border": 1,
            "align": "center",
        }
    )
    fmt_cell = wb.add_format({"font_size": 10, "border": 1, "valign": "vcenter"})
    fmt_num = wb.add_format({"font_size": 10, "border": 1, "num_format": "#,##0.00"})
    fmt_row_alt = wb.add_format({"font_size": 10, "border": 1, "bg_color": SLATE_50})

    fmt_kpi_title = wb.add_format(
        {
            "bold": True,
            "font_size": 11,
            "font_color": EMERALD_500,
            "bg_color": EMERALD_50,
            "top": 1,
            "left": 1,
            "right": 1,
            "align": "center",
            "valign": "vcenter",
        }
    )
    fmt_kpi_value = wb.add_format(
        {
            "bold": True,
            "font_size": 24,
            "font_color": SLATE_900,
            "bg_color": WHITE,
            "left": 1,
            "right": 1,
            "align": "center",
            "valign": "vcenter",
        }
    )
    fmt_kpi_footer = wb.add_format(
        {
            "font_size": 9,
            "font_color": "#64748b",
            "bg_color": WHITE,
            "bottom": 1,
            "left": 1,
            "right": 1,
            "align": "center",
            "valign": "top",
        }
    )

    fmt_body = wb.add_format({"font_size": 11, "text_wrap": True, "valign": "top"})

    numeric_cols = df_clean.select_dtypes(include="number").columns.tolist()
    cat_cols = df_clean.select_dtypes(exclude="number").columns.tolist()

    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y — %H:%M UTC")

    # ── Helper for Sidebar ──
    def add_sidebar(ws, title):
        ws.set_column("A:A", 28, fmt_sidebar)
        ws.write("A2", "DATA INSIGHT", fmt_sidebar_title)
        ws.write(
            "A4",
            "NAVIGATION",
            wb.add_format(
                {
                    "bg_color": EMERALD_950,
                    "font_color": "#94a3b8",
                    "font_size": 9,
                    "bold": True,
                    "indent": 1,
                }
            ),
        )

        links = [
            ("1. Cover Page", "🏠 Cover Page"),
            ("2. Exec Dashboard", "📈 Dashboard"),
            ("3. AI Summary", "🧠 AI Summary"),
            ("4. Cleaned Data", "🧹 Cleaned Data"),
            ("5. KPI Matrix", "🔢 KPI Matrix"),
            ("6. Visual Analytics", "📊 Charts"),
            ("7. Forecasting", "🔮 Forecasting"),
            ("8. Risk & Anomalies", "⚠️ Anomalies"),
            ("9. Data Quality", "📝 Data Quality"),
        ]

        for i, (sheet_name, link_text) in enumerate(links):
            ws.write_url(
                f"A{6 + i * 2}",
                f"internal:'{sheet_name}'!A1",
                string=link_text,
                cell_format=fmt_sidebar_link,
            )

        ws.merge_range("C2:N3", title, fmt_page_title)

    # ── Sheet 1: Cover Page ─────────────────────────────────────────────────
    ws_cover = wb.add_worksheet("1. Cover Page")
    ws_cover.hide_gridlines(2)
    ws_cover.set_column("A:H", 18)

    # Format top banner rows
    banner_fmt = wb.add_format({"bg_color": EMERALD_900})
    for row in range(12):
        ws_cover.set_row(row, 24, banner_fmt)
    for row in range(12, 40):
        ws_cover.set_row(row, 24)

    ws_cover.merge_range(
        "B4:L6",
        "Enterprise Business Intelligence Report",
        wb.add_format(
            {
                "bold": True,
                "font_size": 36,
                "font_color": WHITE,
                "bg_color": EMERALD_900,
                "align": "center",
                "valign": "vcenter",
            }
        ),
    )
    ws_cover.merge_range(
        "B7:L8",
        f"{report.title}",
        wb.add_format(
            {
                "bold": True,
                "font_size": 24,
                "font_color": EMERALD_500,
                "bg_color": EMERALD_900,
                "align": "center",
                "valign": "vcenter",
            }
        ),
    )

    ws_cover.merge_range(
        "D15:I15",
        f"Dataset: {dataset.name}",
        wb.add_format({"font_size": 14, "bold": True, "align": "center"}),
    )
    ws_cover.merge_range(
        "D16:I16",
        f"Generated: {now_str}",
        wb.add_format({"font_size": 12, "font_color": "#64748b", "align": "center"}),
    )

    ws_cover.write_url(
        "F20",
        "internal:'2. Exec Dashboard'!A1",
        string="Open Dashboard →",
        cell_format=wb.add_format(
            {
                "bold": True,
                "font_size": 16,
                "font_color": WHITE,
                "bg_color": EMERALD_500,
                "align": "center",
                "valign": "vcenter",
                "border": 1,
            }
        ),
    )

    # ── Sheet 4: Cleaned Data (Do this early for formulas) ──────────────────
    ws_data = wb.add_worksheet("4. Cleaned Data")
    add_sidebar(ws_data, "Cleaned Dataset")
    ws_data.freeze_panes(4, 1)

    # Write headers
    for ci, col in enumerate(df_clean.columns):
        ws_data.write(3, ci + 1, str(col), fmt_header)
        ws_data.set_column(ci + 1, ci + 1, max(len(str(col)) + 4, 15))

    for ri, row_data in enumerate(df_clean.head(5000).values.tolist()):
        row_fmt = fmt_row_alt if ri % 2 == 0 else fmt_cell
        for ci, val in enumerate(row_data):
            try:
                ws_data.write(ri + 4, ci + 1, val, row_fmt)
            except Exception:
                ws_data.write(ri + 4, ci + 1, str(val), row_fmt)

    # ── Sheet 2: Executive Dashboard ───────────────────────────────────────
    ws_dash = wb.add_worksheet("2. Exec Dashboard")
    ws_dash.hide_gridlines(2)
    add_sidebar(ws_dash, "Executive Dashboard")

    # Column sizing for grid layout
    ws_dash.set_column("B:B", 2)  # spacer
    ws_dash.set_column("C:O", 12)

    if numeric_cols:
        col_positions = [2, 5, 8, 11]  # C, F, I, L (0-indexed: 2=C)

        for i, col in enumerate(numeric_cols[:4]):
            c = col_positions[i]
            # KPI Cards (Row 5 to 7)
            ws_dash.set_row(4, 30)
            ws_dash.set_row(5, 50)
            ws_dash.set_row(6, 20)

            ws_dash.merge_range(4, c, 4, c + 2, f"Total {col}", fmt_kpi_title)

            # Use dynamic EXCEL FORMULA to calculate the sum directly from Sheet 4!
            col_letter = xl_col_to_name(df_clean.columns.get_loc(col) + 1)
            formula = f"=SUM('4. Cleaned Data'!{col_letter}:{col_letter})"

            ws_dash.merge_range(5, c, 5, c + 2, "", fmt_kpi_value)
            ws_dash.write_formula(5, c, formula, fmt_kpi_value)

            # Avg formula
            avg_formula = f"=\"Avg: \" & ROUND(AVERAGE('4. Cleaned Data'!{col_letter}:{col_letter}), 2)"
            ws_dash.merge_range(6, c, 6, c + 2, "", fmt_kpi_footer)
            ws_dash.write_formula(6, c, avg_formula, fmt_kpi_footer)

        # Embedded Chart 1 (Left)
        if len(numeric_cols) > 0:
            target_col = numeric_cols[0]
            cat_col = cat_cols[0] if cat_cols else None

            bar_chart = wb.add_chart({"type": "column"})
            # Data source for chart is the raw data sheet (first 100 rows to keep it clean)
            if cat_col:
                cat_letter = xl_col_to_name(df_clean.columns.get_loc(cat_col) + 1)
                val_letter = xl_col_to_name(df_clean.columns.get_loc(target_col) + 1)
                bar_chart.add_series(
                    {
                        "name": f"='4. Cleaned Data'!${val_letter}$4",
                        "categories": f"='4. Cleaned Data'!${cat_letter}$5:${cat_letter}$50",
                        "values": f"='4. Cleaned Data'!${val_letter}$5:${val_letter}$50",
                        "fill": {"color": EMERALD_500},
                    }
                )
            bar_chart.set_title({"name": f"{target_col} Breakdown"})
            bar_chart.set_legend({"none": True})
            bar_chart.set_chartarea({"border": {"none": True}})
            ws_dash.insert_chart("C10", bar_chart, {"x_scale": 1.7, "y_scale": 1.5})

        # Embedded Chart 2 (Right)
        if len(numeric_cols) > 1:
            target_col2 = numeric_cols[1]
            line_chart = wb.add_chart({"type": "line"})
            val_letter2 = xl_col_to_name(df_clean.columns.get_loc(target_col2) + 1)
            line_chart.add_series(
                {
                    "name": f"='4. Cleaned Data'!${val_letter2}$4",
                    "values": f"='4. Cleaned Data'!${val_letter2}$5:${val_letter2}$100",
                    "line": {"color": EMERALD_900, "width": 2.5},
                }
            )
            line_chart.set_title({"name": f"{target_col2} Trend"})
            line_chart.set_legend({"none": True})
            line_chart.set_chartarea({"border": {"none": True}})
            ws_dash.insert_chart("I10", line_chart, {"x_scale": 1.7, "y_scale": 1.5})

    # ── Sheet 3: AI Executive Summary ─────────────────────────────────────
    ws_summary = wb.add_worksheet("3. AI Summary")
    ws_summary.hide_gridlines(2)
    add_sidebar(ws_summary, "McKinsey AI Executive Summary")
    ws_summary.set_column("C:K", 15)
    ws_summary.set_row(5, 600)
    ws_summary.merge_range("C6:K6", exec_summary, fmt_body)

    # ── Sheet 5: KPI Matrix ──────────────────────────────────────────────
    ws_kpi = wb.add_worksheet("5. KPI Matrix")
    add_sidebar(ws_kpi, "Key Performance Indicators")
    ws_kpi.freeze_panes(4, 1)
    kpi_headers = ["Metric", "Total", "Average", "Minimum", "Maximum"]
    for ci, h in enumerate(kpi_headers):
        ws_kpi.write(3, ci + 1, h, fmt_header)
        ws_kpi.set_column(ci + 1, ci + 1, 22)

    for ri, col in enumerate(numeric_cols):
        col_letter = xl_col_to_name(df_clean.columns.get_loc(col) + 1)
        ws_kpi.write(ri + 4, 1, str(col), fmt_cell)

        # DYNAMIC FORMULAS
        ws_kpi.write_formula(
            ri + 4, 2, f"=SUM('4. Cleaned Data'!{col_letter}:{col_letter})", fmt_num
        )
        ws_kpi.write_formula(
            ri + 4, 3, f"=AVERAGE('4. Cleaned Data'!{col_letter}:{col_letter})", fmt_num
        )
        ws_kpi.write_formula(
            ri + 4, 4, f"=MIN('4. Cleaned Data'!{col_letter}:{col_letter})", fmt_num
        )
        ws_kpi.write_formula(
            ri + 4, 5, f"=MAX('4. Cleaned Data'!{col_letter}:{col_letter})", fmt_num
        )

    # ── Sheet 6: Visual Analytics (More Charts) ────────────────────────────
    ws_charts = wb.add_worksheet("6. Visual Analytics")
    ws_charts.hide_gridlines(2)
    add_sidebar(ws_charts, "Advanced Visualizations")

    # ── Sheet 7: Forecasting ───────────────────────────────────────────────
    ws_forecast = wb.add_worksheet("7. Forecasting")
    ws_forecast.hide_gridlines(2)
    add_sidebar(ws_forecast, "Trend Forecasting (Linear)")

    if numeric_cols and len(df_clean) > 10:
        target_col = numeric_cols[0]
        y = df_clean[target_col].dropna().values[:100]
        x = np.arange(len(y))
        if len(y) > 2:
            m, b = np.polyfit(x, y, 1)
            ws_forecast.write(5, 2, "Period", fmt_header)
            ws_forecast.write(5, 3, "Actual/Predicted", fmt_header)

            for i in range(20):
                val = (m * (len(y) + i)) + b
                ws_forecast.write(6 + i, 2, f"Future Period {i + 1}", fmt_cell)
                ws_forecast.write(6 + i, 3, val, fmt_num)

            # Forecast chart
            f_chart = wb.add_chart({"type": "line"})
            f_chart.add_series(
                {
                    "name": "Forecast",
                    "categories": "='7. Forecasting'!$C$7:$C$26",
                    "values": "='7. Forecasting'!$D$7:$D$26",
                    "line": {"color": WARNING, "width": 2.5, "dash_type": "dash"},
                }
            )
            f_chart.set_title({"name": f"{target_col} - 20 Period Forecast"})
            f_chart.set_chartarea({"border": {"none": True}})
            ws_forecast.insert_chart("F6", f_chart, {"x_scale": 1.8, "y_scale": 1.5})
    else:
        ws_forecast.write(5, 2, "Not enough numeric data for forecasting.")

    # ── Sheet 8: Anomaly Detection ─────────────────────────────────────────
    ws_anomaly = wb.add_worksheet("8. Risk & Anomalies")
    add_sidebar(ws_anomaly, "Outlier Detection (IQR Method)")

    curr_row = 5
    for col in numeric_cols[:2]:
        series = df_clean[col].dropna()
        if len(series) > 4:
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            outliers = df_clean[
                (df_clean[col] < q1 - 1.5 * iqr) | (df_clean[col] > q3 + 1.5 * iqr)
            ]

            ws_anomaly.merge_range(
                curr_row,
                2,
                curr_row,
                3,
                f"Outliers in {col} ({len(outliers)} found)",
                wb.add_format({"bold": True, "bg_color": WARNING, "font_color": WHITE}),
            )
            if not outliers.empty:
                ws_anomaly.write(curr_row + 1, 2, "Row Index", fmt_header)
                ws_anomaly.write(curr_row + 1, 3, "Value", fmt_header)
                ws_anomaly.set_column(2, 3, 20)
                for i, (idx, val) in enumerate(outliers[col].head(10).items()):
                    ws_anomaly.write(curr_row + 2 + i, 2, str(idx), fmt_cell)
                    ws_anomaly.write(curr_row + 2 + i, 3, val, fmt_num)
                curr_row += len(outliers.head(10)) + 4
            else:
                curr_row += 3

    # ── Sheet 9: Data Quality ──────────────────────────────────────────────
    ws_meta = wb.add_worksheet("9. Data Quality")
    add_sidebar(ws_meta, "Data Quality & Metadata")

    ws_meta.set_column("B:D", 30)

    meta_data = [
        ("Total Rows Processed", dataset.row_count),
        ("Total Columns", dataset.column_count),
        ("Data Quality Score", f"{dataset.data_quality_score}/100"),
        ("Duplicate Rows Filtered", df_raw.duplicated().sum()),
        ("Missing Values Resolved", df_raw.isnull().sum().sum()),
        ("AI Generation Models", "Google Gemini 3.5 Flash / OpenAI GPT-4o"),
        ("Generation Timestamp", now_str),
    ]

    for i, (k, v) in enumerate(meta_data):
        ws_meta.write(
            i + 5,
            2,
            k,
            wb.add_format(
                {"bold": True, "border": 1, "bg_color": SLATE_50, "valign": "vcenter"}
            ),
        )
        ws_meta.write(i + 5, 3, str(v), fmt_cell)
        ws_meta.set_row(i + 5, 22)
