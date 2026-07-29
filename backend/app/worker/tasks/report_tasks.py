"""Celery task — Full 20-step AI Excel generation pipeline."""
import uuid
import io
from loguru import logger
from celery import shared_task


@shared_task(bind=True, name="report.generate_excel", max_retries=2, default_retry_delay=120)
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
    import pandas as pd
    import xlsxwriter
    import httpx
    from app.db.session import AsyncSessionLocal
    from app.repositories.report import ReportRepository
    from app.repositories.dataset import DatasetRepository
    from app.repositories.user import UserRepository
    from app.models.report import ReportStatus
    from app.services.ai_service import AIService
    from app.core.storage import (
        get_signed_url, upload_file, report_storage_path,
        DATASETS_BUCKET, REPORTS_BUCKET,
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
                signed_url = get_signed_url(DATASETS_BUCKET, dataset.file_url, expires_in=600)
                async with httpx.AsyncClient() as client:
                    response = await client.get(signed_url)
                    file_bytes = response.content

            # ── STEP 3: Parse into Pandas ────────────────────────────────────
            # file_type may be a string or Enum depending on SQLAlchemy version
            ext = dataset.file_type.value if hasattr(dataset.file_type, 'value') else str(dataset.file_type)
            ext = ext.lower().strip()
            df = _load_dataframe(file_bytes, ext)
            await report_repo.update_status(report, ReportStatus.generating, progress=15)
            await session.commit()

            # ── STEP 4: Clean data ───────────────────────────────────────────
            df_cleaned = _clean_dataframe(df.copy())
            await report_repo.update_status(report, ReportStatus.generating, progress=20)
            await session.commit()

            # ── STEP 5: Profile summary for AI ──────────────────────────────
            import json
            profile_summary = json.dumps(dataset.profile or {}, indent=2)[:3000]

            # ── STEP 6: Claude blueprint ─────────────────────────────────────
            user_repo = UserRepository(session)
            creator = await user_repo.get_by_id(report.created_by_id)
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
            await report_repo.update_status(report, ReportStatus.generating, progress=35)
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
            await report_repo.update_status(report, ReportStatus.generating, progress=50)
            await session.commit()

            # ── STEPS 8-18: Build Excel workbook ────────────────────────────
            output = io.BytesIO()
            wb = xlsxwriter.Workbook(output, {"in_memory": True, "strings_to_urls": False})
            _build_workbook(wb, df, df_cleaned, blueprint, exec_summary, report, dataset)
            wb.close()
            excel_bytes = output.getvalue()
            await report_repo.update_status(report, ReportStatus.generating, progress=80)
            await session.commit()

            # ── STEP 19: Upload / Save Excel file ────────────────────────────
            filename = f"{report.title[:50].replace(' ', '_')}.xlsx"
            storage_path = report_storage_path(report.tenant_id, uuid.UUID(report_id), filename)
            
            from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR
            if is_local_storage():
                # Save Excel file to local disk
                local_report_path = LOCAL_UPLOADS_DIR / REPORTS_BUCKET / storage_path
                local_report_path.parent.mkdir(parents=True, exist_ok=True)
                local_report_path.write_bytes(excel_bytes)
                # Use a relative path as the download URL (served via static files)
                output_url = f"/api/v1/storage/{REPORTS_BUCKET}/{storage_path}"
            else:
                upload_file(REPORTS_BUCKET, excel_bytes, storage_path, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                output_url = get_signed_url(REPORTS_BUCKET, storage_path, expires_in=86400)  # 24h

            # ── STEP 20: Update report record ──────────────────────────────
            await report_repo.update_status(
                report, ReportStatus.ready, progress=100,
                output_url=output_url,
                output_size_bytes=len(excel_bytes),
            )
            await session.commit()
            logger.success(f"Report {report_id} generated successfully — {len(excel_bytes):,} bytes")

        except Exception as exc:
            logger.exception(f"Excel pipeline failed for report {report_id}: {exc}")
            await report_repo.update_status(report, ReportStatus.error, error_message=str(exc)[:500])
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
    import pandas as pd
    lines = []
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    for col in numeric_cols[:5]:
        total = df[col].sum()
        mean = df[col].mean()
        lines.append(f"- {col}: total={total:,.2f}, mean={mean:,.2f}, rows={len(df)}")
    return "\n".join(lines) or "No numeric data available."


def _build_workbook(wb, df_raw, df_clean, blueprint, exec_summary, report, dataset):
    """Build the full 10-sheet Excel workbook using XlsxWriter."""
    import pandas as pd

    # ── Color palette ──────────────────────────────────────────────────────
    DARK_BG   = "#1A1A2E"
    ACCENT    = "#4F8EF7"
    LIGHT_BG  = "#F8F9FA"
    SUCCESS   = "#28A745"
    DANGER    = "#DC3545"
    WARNING   = "#FFC107"
    WHITE     = "#FFFFFF"
    DARK_TEXT = "#212529"

    # ── Shared formats ─────────────────────────────────────────────────────
    fmt_title  = wb.add_format({"bold": True, "font_size": 28, "font_color": WHITE, "bg_color": DARK_BG, "align": "center", "valign": "vcenter"})
    fmt_header = wb.add_format({"bold": True, "font_size": 11, "font_color": WHITE, "bg_color": ACCENT, "border": 1, "align": "center"})
    fmt_cell   = wb.add_format({"font_size": 10, "border": 1, "valign": "vcenter"})
    fmt_num    = wb.add_format({"font_size": 10, "border": 1, "num_format": "#,##0.00"})
    fmt_pct    = wb.add_format({"font_size": 10, "border": 1, "num_format": "0.0%"})
    fmt_row_alt = wb.add_format({"font_size": 10, "border": 1, "bg_color": "#EEF2FF"})
    fmt_kpi_label = wb.add_format({"bold": True, "font_size": 12, "font_color": DARK_TEXT, "bg_color": LIGHT_BG, "border": 2, "align": "center", "valign": "vcenter"})
    fmt_kpi_value = wb.add_format({"bold": True, "font_size": 22, "font_color": ACCENT, "bg_color": WHITE, "border": 2, "align": "center", "valign": "vcenter"})
    fmt_section  = wb.add_format({"bold": True, "font_size": 13, "font_color": ACCENT, "bottom": 2})
    fmt_body     = wb.add_format({"font_size": 10, "text_wrap": True, "valign": "top"})

    # ── Sheet 1: Cover ─────────────────────────────────────────────────────
    ws_cover = wb.add_worksheet("📊 Cover")
    ws_cover.hide_gridlines(2)
    ws_cover.set_column("A:H", 18)
    for row in range(20):
        ws_cover.set_row(row, 24)
    ws_cover.set_row(3, 60)
    ws_cover.merge_range("A1:H2", "", wb.add_format({"bg_color": DARK_BG}))
    ws_cover.merge_range("A3:H5", f"📊 {report.title}", fmt_title)
    ws_cover.merge_range("A6:H7", f"Dataset: {dataset.name} | Generated by Data Insight AI", wb.add_format({"font_size": 12, "font_color": "#AAAACC", "bg_color": DARK_BG, "align": "center"}))

    from datetime import datetime, timezone
    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y — %H:%M UTC")
    ws_cover.merge_range("A8:H8", f"Generated: {now_str}", wb.add_format({"font_size": 10, "font_color": WHITE, "bg_color": DARK_BG, "align": "center"}))
    ws_cover.merge_range("A9:H20", "", wb.add_format({"bg_color": DARK_BG}))

    # ── Sheet 2: Executive Dashboard (KPIs) ────────────────────────────────
    ws_dash = wb.add_worksheet("📈 Executive Dashboard")
    ws_dash.hide_gridlines(2)
    ws_dash.merge_range("A1:L2", "Executive Dashboard", wb.add_format({"bold": True, "font_size": 20, "bg_color": DARK_BG, "font_color": WHITE, "align": "center"}))

    numeric_cols = df_clean.select_dtypes(include="number").columns.tolist()[:6]
    col_positions = [(3, 0), (3, 3), (3, 6), (7, 0), (7, 3), (7, 6)]
    for i, col in enumerate(numeric_cols):
        r, c = col_positions[i]
        ws_dash.set_row(r, 22)
        ws_dash.set_row(r + 1, 40)
        ws_dash.set_row(r + 2, 22)
        ws_dash.merge_range(r, c, r, c + 2, col, fmt_kpi_label)
        ws_dash.merge_range(r + 1, c, r + 1, c + 2, f"{df_clean[col].sum():,.0f}", fmt_kpi_value)
        ws_dash.merge_range(r + 2, c, r + 2, c + 2, f"Avg: {df_clean[col].mean():,.2f}", wb.add_format({"font_size": 9, "align": "center", "font_color": "#666666"}))

    # ── Sheet 3: AI Executive Summary ─────────────────────────────────────
    ws_summary = wb.add_worksheet("🧠 AI Summary")
    ws_summary.hide_gridlines(2)
    ws_summary.set_column("A:A", 120)
    ws_summary.merge_range("A1:A2", "AI Executive Summary", wb.add_format({"bold": True, "font_size": 18, "bg_color": DARK_BG, "font_color": WHITE, "align": "center"}))
    ws_summary.set_row(3, 600)
    ws_summary.write("A4", exec_summary, fmt_body)

    # ── Sheet 4: Cleaned Data ──────────────────────────────────────────────
    ws_data = wb.add_worksheet("🧹 Cleaned Data")
    ws_data.freeze_panes(1, 0)
    for ci, col in enumerate(df_clean.columns):
        ws_data.write(0, ci, str(col), fmt_header)
        ws_data.set_column(ci, ci, max(len(str(col)) + 4, 12))
    for ri, row_data in enumerate(df_clean.head(1000).values.tolist()):
        row_fmt = fmt_row_alt if ri % 2 == 0 else fmt_cell
        for ci, val in enumerate(row_data):
            try:
                ws_data.write(ri + 1, ci, val, row_fmt)
            except Exception:
                ws_data.write(ri + 1, ci, str(val), row_fmt)

    # ── Sheet 5: KPI Analysis ──────────────────────────────────────────────
    ws_kpi = wb.add_worksheet("🔢 KPI Analysis")
    ws_kpi.freeze_panes(1, 0)
    kpi_headers = ["KPI", "Total", "Mean", "Min", "Max", "Std Dev", "Status"]
    for ci, h in enumerate(kpi_headers):
        ws_kpi.write(0, ci, h, fmt_header)
        ws_kpi.set_column(ci, ci, 18)

    status_green = wb.add_format({"bold": True, "font_color": SUCCESS, "border": 1, "align": "center"})
    status_red   = wb.add_format({"bold": True, "font_color": DANGER,  "border": 1, "align": "center"})

    for ri, col in enumerate(numeric_cols):
        series = df_clean[col]
        total, mean, mn, mx, std = series.sum(), series.mean(), series.min(), series.max(), series.std()
        pct_change = ((mx - mn) / mn * 100) if mn != 0 else 0
        status = "🟢 On Track" if pct_change >= 0 else "🔴 At Risk"
        ws_kpi.write(ri + 1, 0, col, fmt_cell)
        ws_kpi.write(ri + 1, 1, total, fmt_num)
        ws_kpi.write(ri + 1, 2, mean, fmt_num)
        ws_kpi.write(ri + 1, 3, mn, fmt_num)
        ws_kpi.write(ri + 1, 4, mx, fmt_num)
        ws_kpi.write(ri + 1, 5, std, fmt_num)
        ws_kpi.write(ri + 1, 6, status, status_green if "🟢" in status else status_red)

    # ── Sheet 6: Charts ────────────────────────────────────────────────────
    ws_charts = wb.add_worksheet("📈 Charts")
    ws_charts.hide_gridlines(2)
    ws_charts.merge_range("A1:P2", "Charts & Visualizations", wb.add_format({"bold": True, "font_size": 16, "bg_color": DARK_BG, "font_color": WHITE, "align": "center"}))

    if numeric_cols and len(df_clean) > 1:
        # Bar chart — first numeric column
        _write_chart_data(wb, ws_charts, df_clean, numeric_cols[0], row_start=4)
        bar_chart = wb.add_chart({"type": "column"})
        bar_chart.add_series({
            "name": numeric_cols[0],
            "categories": f"='📈 Charts'!$A$5:$A${min(15, len(df_clean) + 4)}",
            "values":     f"='📈 Charts'!$B$5:$B${min(15, len(df_clean) + 4)}",
            "fill": {"color": ACCENT},
        })
        bar_chart.set_title({"name": f"Top Values — {numeric_cols[0]}"})
        bar_chart.set_style(10)
        ws_charts.insert_chart("D4", bar_chart, {"x_scale": 2.5, "y_scale": 1.8})

        # Line chart — second numeric column (if exists)
        if len(numeric_cols) > 1:
            _write_chart_data(wb, ws_charts, df_clean, numeric_cols[1], row_start=4, col_start=5)
            line_chart = wb.add_chart({"type": "line"})
            line_chart.add_series({
                "name": numeric_cols[1],
                "values": f"='📈 Charts'!$G$5:$G${min(15, len(df_clean) + 4)}",
                "line": {"color": SUCCESS, "width": 2.5},
                "marker": {"type": "circle", "size": 5},
            })
            line_chart.set_title({"name": f"Trend — {numeric_cols[1]}"})
            line_chart.set_style(10)
            ws_charts.insert_chart("D24", line_chart, {"x_scale": 2.5, "y_scale": 1.8})

    # ── Sheet 7: Methodology ───────────────────────────────────────────────
    ws_method = wb.add_worksheet("📝 Methodology")
    ws_method.set_column("A:A", 100)
    ws_method.write("A1", "Methodology & Report Notes", wb.add_format({"bold": True, "font_size": 16, "bg_color": DARK_BG, "font_color": WHITE}))
    notes = [
        f"Report Title: {report.title}",
        f"Dataset: {dataset.name} ({dataset.row_count:,} rows × {dataset.column_count} columns)",
        f"Data Quality Score: {dataset.data_quality_score}/100",
        f"AI Models Used: Claude 3.5 Sonnet (blueprint), GPT-4o (narrative & analysis)",
        f"Generation Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "Disclaimer: This report was AI-generated by Data Insight. All insights are based on",
        "statistical analysis of the provided data. Review figures against source data before",
        "sharing with external stakeholders.",
    ]
    for ri, note in enumerate(notes):
        ws_method.write(ri + 2, 0, note, fmt_body)


def _write_chart_data(wb, ws, df, col: str, row_start: int, col_start: int = 0):
    """Write label/value pairs for chart data source."""
    import pandas as pd
    head = df.head(10)
    ws.write(row_start - 1, col_start, "Label", wb.add_format({"bold": True}))
    ws.write(row_start - 1, col_start + 1, col, wb.add_format({"bold": True}))
    for ri, (idx, val) in enumerate(zip(head.index, head[col].values)):
        ws.write(row_start + ri, col_start, str(idx))
        try:
            ws.write(row_start + ri, col_start + 1, float(val))
        except Exception:
            ws.write(row_start + ri, col_start + 1, 0)
