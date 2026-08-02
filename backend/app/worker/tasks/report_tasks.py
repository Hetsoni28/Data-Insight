"""Celery task — Full AI Excel Intelligence Engine (World-Class 15-Sheet Pipeline)."""

import uuid
import io
from loguru import logger
from celery import shared_task


@shared_task(
    bind=True, name="report.generate_excel", max_retries=2, default_retry_delay=120
)
def generate_excel_report_task(self, report_id: str):
    """
    AI Excel Generation Pipeline — 22 steps:
      Phase 1 (Steps 1-5):   Load data, validate, profile, clean
      Phase 2 (Steps 6-10):  AI blueprint + executive summary + insights + recommendations
      Phase 3 (Steps 11-20): XlsxWriter builds all 15+ sheets
      Phase 4 (Steps 21-22): Upload to storage, update report record
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
            await report_repo.update_status(report, ReportStatus.generating, progress=3)
            await session.commit()

            # ── STEP 2: Load dataset file ────────────────────────────────────
            dataset = await ds_repo.get_by_id(report.dataset_id)
            from app.core.storage import is_local_storage, LOCAL_UPLOADS_DIR

            if is_local_storage():
                local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
                file_bytes = local_path.read_bytes()
            else:
                signed_url = await get_signed_url(
                    DATASETS_BUCKET, dataset.file_url, expires_in=600
                )
                async with httpx.AsyncClient() as client:
                    response = await client.get(signed_url)
                    file_bytes = response.content

            # ── STEP 3: Parse into Pandas ────────────────────────────────────
            ext = (
                dataset.file_type.value
                if hasattr(dataset.file_type, "value")
                else str(dataset.file_type)
            )
            ext = ext.lower().strip()
            df_raw = _load_dataframe(file_bytes, ext)
            await report_repo.update_status(report, ReportStatus.generating, progress=10)
            await session.commit()

            # ── STEP 4: Deep clean ───────────────────────────────────────────
            df_clean, cleaning_log = _clean_dataframe(df_raw.copy())
            await report_repo.update_status(report, ReportStatus.generating, progress=18)
            await session.commit()

            # ── STEP 5: Profile summary for AI ──────────────────────────────
            import json

            profile_summary = json.dumps(dataset.profile or {}, indent=2)[:4000]
            data_insights = _extract_deep_insights(df_clean, profile_summary)

            # ── STEP 6: AI Blueprint (World-Class Master Prompt) ─────────────
            ai_svc = AIService(session)
            try:
                blueprint = await ai_svc.generate_blueprint(
                    dataset_summary=profile_summary,
                    tenant_id=report.tenant_id,
                    user_id=report.created_by_id,
                    report_id=uuid.UUID(report_id),
                    dataset_id=report.dataset_id,
                )
            except Exception as e:
                logger.warning(f"Fallback blueprint used: {e}")
                blueprint = ai_svc._get_fallback_blueprint(profile_summary)
            report.ai_blueprint = blueprint
            await session.commit()
            await report_repo.update_status(report, ReportStatus.generating, progress=30)
            await session.commit()

            # ── STEP 7: Executive Summary (McKinsey Grade) ───────────────────
            try:
                exec_summary = await ai_svc.write_executive_summary(
                    blueprint=blueprint,
                    data_insights=data_insights,
                    tenant_id=report.tenant_id,
                    user_id=report.created_by_id,
                    report_id=uuid.UUID(report_id),
                )
            except Exception as e:
                logger.warning(f"Fallback executive summary used: {e}")
                exec_summary = (
                    "SECTION 1 — BUSINESS OVERVIEW\n"
                    f"This {blueprint.get('domain', 'Business')} report provides structured business analytics.\n\n"
                    "SECTION 2 — TOP FINDINGS\n"
                    "1. Dataset validated, parsed, and statistical metrics computed.\n"
                    "2. Charts and KPI cards generated across all workbook sheets.\n\n"
                    "SECTION 3 — RECOMMENDATIONS\n"
                    "1. Review distribution curves and KPI sheets for detailed drill-down."
                )
            await session.commit()
            await report_repo.update_status(report, ReportStatus.generating, progress=42)
            await session.commit()

            # ── STEP 8: AI Insights (WHY-Analysis) ──────────────────────────
            try:
                ai_insights = await ai_svc.write_ai_insights(
                    blueprint=blueprint,
                    data_insights=data_insights,
                    tenant_id=report.tenant_id,
                    user_id=report.created_by_id,
                    report_id=uuid.UUID(report_id),
                )
            except Exception as e:
                logger.warning(f"Fallback AI insights used: {e}")
                ai_insights = (
                    "INSIGHT 1: Data Ingestion Complete\n"
                    "WHAT: All dataset records were loaded and validated.\n"
                    "WHY: Automated pipeline structured categorical and numeric variables.\n"
                    "SO WHAT: Review KPI summary cards and pivot tables for high-value segments."
                )
            await session.commit()
            await report_repo.update_status(report, ReportStatus.generating, progress=52)
            await session.commit()

            # ── STEP 9: Strategic Recommendations ───────────────────────────
            try:
                recommendations = await ai_svc.write_recommendations(
                    blueprint=blueprint,
                    data_insights=data_insights,
                    tenant_id=report.tenant_id,
                    user_id=report.created_by_id,
                    report_id=uuid.UUID(report_id),
                )
            except Exception as e:
                logger.warning(f"Fallback recommendations used: {e}")
                recommendations = (
                    "RECOMMENDATION 1: Monitor High-Volume Metric Clusters\n"
                    "PRIORITY: HIGH\n"
                    "IMPACT: Operational Efficiency\n"
                    "WHAT TO DO: Track outlier transactions and distribution skews.\n"
                    "WHY IT MATTERS: Ensures data consistency across business operations.\n"
                    "EXPECTED OUTCOME: Improved KPI predictability.\n"
                    "TIMELINE: Immediate (0-30d)"
                )
            await session.commit()
            await report_repo.update_status(report, ReportStatus.generating, progress=60)
            await session.commit()

            # ── STEPS 10-20: Build Excel Workbook ───────────────────────────
            output = io.BytesIO()
            wb = xlsxwriter.Workbook(
                output, {"in_memory": True, "strings_to_urls": False}
            )
            _build_workbook(
                wb, df_raw, df_clean, blueprint, exec_summary,
                ai_insights, recommendations, cleaning_log, report, dataset
            )
            wb.close()
            excel_bytes = output.getvalue()
            await report_repo.update_status(report, ReportStatus.generating, progress=82)
            await session.commit()

            # ── STEP 21: Upload / Save Excel file ───────────────────────────
            filename = f"{report.title[:50].replace(' ', '_')}.xlsx"
            storage_path = report_storage_path(
                report.tenant_id, uuid.UUID(report_id), filename
            )

            if is_local_storage():
                local_report_path = LOCAL_UPLOADS_DIR / REPORTS_BUCKET / storage_path
                local_report_path.parent.mkdir(parents=True, exist_ok=True)
                local_report_path.write_bytes(excel_bytes)
                output_url = f"/api/v1/storage/{REPORTS_BUCKET}/{storage_path}"
            else:
                await upload_file(
                    REPORTS_BUCKET,
                    excel_bytes,
                    storage_path,
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                output_url = await get_signed_url(
                    REPORTS_BUCKET, storage_path, expires_in=86400
                )

            # ── STEP 22: Finalize report record ─────────────────────────────
            await report_repo.update_status(
                report,
                ReportStatus.ready,
                progress=100,
                output_url=output_url,
                output_size_bytes=len(excel_bytes),
            )
            await session.commit()
            logger.success(
                f"[AI Excel Engine] Report {report_id} complete — "
                f"{len(excel_bytes):,} bytes | {len(df_clean)} rows | "
                f"domain={blueprint.get('domain', 'Unknown')}"
            )

        except Exception as exc:
            logger.exception(f"[AI Excel Engine] Pipeline failed for {report_id}: {exc}")
            await report_repo.update_status(
                report, ReportStatus.error, error_message=str(exc)[:500]
            )
            await session.commit()
            raise task.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════════════════════
# DATA PROCESSING HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _load_dataframe(file_bytes: bytes, ext: str):
    import pandas as pd

    if ext == "csv":
        return pd.read_csv(io.BytesIO(file_bytes))
    elif ext == "xlsx":
        return pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    elif ext == "json":
        return pd.read_json(io.BytesIO(file_bytes))
    raise ValueError(f"Unsupported format: {ext}")


def _clean_dataframe(df):
    """Enterprise-grade data cleaning with full audit log."""
    import pandas as pd

    log = []
    original_rows = len(df)

    # 1. Drop full duplicates
    dupes = df.duplicated().sum()
    df = df.drop_duplicates()
    if dupes > 0:
        log.append(f"Removed {dupes} duplicate rows")

    # 2. Trim string whitespace & fix capitalization
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].str.strip() if hasattr(df[col], "str") else df[col]

    # 3. Normalize date-like columns
    date_cols_fixed = []
    for col in df.columns:
        if df[col].dtype == object and any(
            kw in col.lower() for kw in ["date", "time", "year", "month", "day"]
        ):
            try:
                df[col] = pd.to_datetime(df[col], errors="coerce")
                date_cols_fixed.append(col)
            except Exception:
                pass
    if date_cols_fixed:
        log.append(f"Normalized date columns: {', '.join(date_cols_fixed)}")

    # 4. Fill numeric NaNs with median
    numeric_cols = df.select_dtypes(include="number").columns
    missing_total = df[numeric_cols].isnull().sum().sum()
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    if missing_total > 0:
        log.append(f"Imputed {missing_total} missing numeric values with column median")

    # 5. Fill string NaNs with "Unknown"
    str_missing = df[str_cols].isnull().sum().sum()
    df[str_cols] = df[str_cols].fillna("Unknown")
    if str_missing > 0:
        log.append(f"Replaced {str_missing} missing text values with 'Unknown'")

    # 6. Strip currency symbols from string columns that look numeric
    for col in str_cols:
        try:
            cleaned = df[col].str.replace(r"[\$,£€¥₹,]", "", regex=True).str.strip()
            converted = pd.to_numeric(cleaned, errors="coerce")
            if converted.notna().mean() > 0.8:
                df[col] = converted
                log.append(f"Converted currency column '{col}' to numeric")
        except Exception:
            pass

    cleaned_rows = len(df)
    if original_rows != cleaned_rows:
        log.append(f"Dataset reduced from {original_rows} to {cleaned_rows} rows")

    return df, log


def _extract_deep_insights(df, profile_summary: str) -> str:
    """Extract comprehensive statistical profile for AI prompts."""
    lines = [f"Dataset: {len(df)} rows × {len(df.columns)} columns"]

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols = df.select_dtypes(exclude="number").columns.tolist()

    # Numeric stats
    for col in numeric_cols[:8]:
        try:
            total = df[col].sum()
            mean = df[col].mean()
            med = df[col].median()
            mx = df[col].max()
            mn = df[col].min()
            null_pct = df[col].isnull().mean() * 100
            lines.append(
                f"- {col}: total={total:,.2f}, mean={mean:,.2f}, "
                f"median={med:,.2f}, min={mn:,.2f}, max={mx:,.2f}, "
                f"null%={null_pct:.1f}%"
            )
        except Exception:
            pass

    # Categorical top values
    for col in cat_cols[:4]:
        try:
            top = df[col].value_counts().head(3)
            top_str = ", ".join([f"{k}({v})" for k, v in top.items()])
            lines.append(f"- {col} (top values): {top_str}")
        except Exception:
            pass

    # Growth rate if date + metric present
    date_cols = [c for c in df.columns if hasattr(df[c], "dt")]
    if date_cols and numeric_cols:
        try:
            df_sorted = df.sort_values(date_cols[0])
            first_half = df_sorted.head(len(df_sorted) // 2)[numeric_cols[0]].mean()
            second_half = df_sorted.tail(len(df_sorted) // 2)[numeric_cols[0]].mean()
            if first_half and first_half != 0:
                growth = ((second_half - first_half) / first_half) * 100
                lines.append(f"- Period-over-period growth ({numeric_cols[0]}): {growth:+.1f}%")
        except Exception:
            pass

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# WORLD-CLASS EXCEL WORKBOOK BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def _build_workbook(
    wb, df_raw, df_clean, blueprint, exec_summary,
    ai_insights, recommendations, cleaning_log, report, dataset
):
    """
    Data Insight AI Excel Intelligence Engine.
    Builds a 15+ sheet Enterprise BI Workbook using the website brand palette.

    Brand Palette (from globals.css):
      Primary:    #10B981  (Emerald 500 — signature teal-green)
      Deep Green: #059669  (Emerald 600)
      Darkest:    #064e3b  (Emerald 900)
      Near-Black: #022c22  (Emerald 950)
      Light Mint: #ECFDF5  (Emerald 50)
      Off-White:  #F8FAFC  (Slate 50)
      Charcoal:   #0F172A  (Slate 900)
      Mid-Slate:  #475569  (Slate 600)
      Light Slate:#94a3b8  (Slate 400)
      Accent Teal:#134e4a  (Teal 900 — for variety)
      Warning:    #F59E0B  (Amber 500)
      Danger:     #EF4444  (Red 500)
      Info:       #3B82F6  (Blue 500)
      Success:    #10B981  (same as primary)
    """
    import numpy as np
    from datetime import datetime, timezone
    from xlsxwriter.utility import xl_col_to_name

    # ── Brand Palette ────────────────────────────────────────────────────────
    C_PRIMARY    = "#10B981"   # Emerald 500 — signature
    C_DEEP       = "#059669"   # Emerald 600
    C_DARK       = "#064e3b"   # Emerald 900
    C_DARKEST    = "#022c22"   # Emerald 950
    C_MINT       = "#ECFDF5"   # Emerald 50
    C_OFF_WHITE  = "#F8FAFC"   # Slate 50
    C_CHARCOAL   = "#0F172A"   # Slate 900
    C_SLATE_600  = "#475569"   # Slate 600
    C_SLATE_400  = "#94a3b8"   # Slate 400
    C_SLATE_200  = "#e2e8f0"   # Slate 200
    C_TEAL_900   = "#134e4a"   # Teal 900
    C_WARNING    = "#F59E0B"   # Amber 500
    C_DANGER     = "#EF4444"   # Red 500
    C_INFO       = "#3B82F6"   # Blue 500
    C_WHITE      = "#FFFFFF"
    C_ACCENT_BG  = "#f0fdf4"   # Very light green bg for alternating rows

    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y — %H:%M UTC")
    now_short = datetime.now(timezone.utc).strftime("%d %b %Y")
    gen_id = str(report.id)[:8].upper()
    domain = blueprint.get("domain", "Business Intelligence")
    report_subtitle = blueprint.get("report_subtitle", f"{domain} Intelligence Report")

    numeric_cols = df_clean.select_dtypes(include="number").columns.tolist()
    cat_cols = df_clean.select_dtypes(exclude="number").columns.tolist()
    all_cols = df_clean.columns.tolist()

    primary_metric = blueprint.get("primary_metric_column") or (numeric_cols[0] if numeric_cols else None)
    groupby_dim = blueprint.get("groupby_dimension") or (cat_cols[0] if cat_cols else None)
    date_col = blueprint.get("primary_date_column")
    additional_sheets = blueprint.get("additional_sheets", [])

    # ── Shared Format Factory ─────────────────────────────────────────────────
    def F(**kwargs):
        return wb.add_format(kwargs)

    # Core formats
    fmt = {
        # Sidebar
        "sidebar_bg":    F(bg_color=C_DARKEST, font_color=C_WHITE),
        "sidebar_title": F(bg_color=C_DARKEST, font_color=C_PRIMARY, bold=True,
                           font_size=13, align="center", valign="vcenter"),
        "sidebar_nav":   F(bg_color=C_DARKEST, font_color=C_SLATE_400, bold=True,
                           font_size=8, indent=1),
        "sidebar_link":  F(bg_color=C_DARKEST, font_color="#d1fae5", font_size=10,
                           underline=True, align="left", valign="vcenter", indent=1),
        "sidebar_sep":   F(bg_color=C_DARK, font_color=C_DARK),

        # Headers
        "page_title":    F(bold=True, font_size=22, font_color=C_DARK,
                           bg_color=C_WHITE, align="left", valign="vcenter"),
        "page_subtitle": F(font_size=11, font_color=C_SLATE_600,
                           bg_color=C_WHITE, align="left", valign="vcenter"),
        "table_header":  F(bold=True, font_size=10, font_color=C_WHITE,
                           bg_color=C_DARK, border=1, align="center", valign="vcenter"),
        "table_header2": F(bold=True, font_size=10, font_color=C_WHITE,
                           bg_color=C_TEAL_900, border=1, align="center", valign="vcenter"),

        # Table cells
        "cell":          F(font_size=10, border=1, valign="vcenter"),
        "cell_alt":      F(font_size=10, border=1, valign="vcenter", bg_color=C_ACCENT_BG),
        "num":           F(font_size=10, border=1, num_format="#,##0.00", valign="vcenter"),
        "num_alt":       F(font_size=10, border=1, num_format="#,##0.00",
                           bg_color=C_ACCENT_BG, valign="vcenter"),
        "pct":           F(font_size=10, border=1, num_format="0.00%", valign="vcenter"),
        "cur":           F(font_size=10, border=1, num_format='"$"#,##0.00', valign="vcenter"),
        "date_fmt":      F(font_size=10, border=1, num_format="dd/mm/yyyy", valign="vcenter"),

        # KPI cards
        "kpi_label":     F(bold=True, font_size=9, font_color=C_PRIMARY,
                           bg_color=C_MINT, border=1, align="center", valign="vcenter"),
        "kpi_value":     F(bold=True, font_size=22, font_color=C_CHARCOAL,
                           bg_color=C_WHITE, border=1, align="center", valign="vcenter"),
        "kpi_sub":       F(font_size=9, font_color=C_SLATE_600,
                           bg_color=C_WHITE, border=1, align="center", valign="top"),

        # Narrative / body text
        "body":          F(font_size=11, text_wrap=True, valign="top"),
        "body_bold":     F(font_size=11, bold=True, text_wrap=True, valign="top"),
        "insight_head":  F(bold=True, font_size=11, font_color=C_WHITE,
                           bg_color=C_PRIMARY, border=1, align="left", valign="vcenter", indent=1),
        "insight_body":  F(font_size=10, text_wrap=True, valign="top",
                           bg_color=C_MINT, border=1, indent=1),
        "rec_critical":  F(bold=True, font_size=9, font_color=C_WHITE,
                           bg_color=C_DANGER, align="center", valign="vcenter", border=1),
        "rec_high":      F(bold=True, font_size=9, font_color=C_WHITE,
                           bg_color=C_WARNING, align="center", valign="vcenter", border=1),
        "rec_medium":    F(bold=True, font_size=9, font_color=C_CHARCOAL,
                           bg_color="#fef9c3", align="center", valign="vcenter", border=1),
        "rec_low":       F(bold=True, font_size=9, font_color=C_WHITE,
                           bg_color=C_INFO, align="center", valign="vcenter", border=1),

        # Status / quality
        "quality_good":  F(bold=True, font_size=11, font_color=C_WHITE,
                           bg_color=C_PRIMARY, align="center", valign="vcenter", border=1),
        "quality_warn":  F(bold=True, font_size=11, font_color=C_WHITE,
                           bg_color=C_WARNING, align="center", valign="vcenter", border=1),
        "quality_bad":   F(bold=True, font_size=11, font_color=C_WHITE,
                           bg_color=C_DANGER, align="center", valign="vcenter", border=1),
        "outlier_tag":   F(bold=True, bg_color=C_DANGER, font_color=C_WHITE,
                           border=1, align="center"),

        # Footer / meta
        "footer":        F(font_size=8, font_color=C_SLATE_400, italic=True,
                           align="center", valign="vcenter"),
        "watermark":     F(font_size=9, font_color=C_SLATE_400, italic=True,
                           align="right", valign="vcenter"),
    }

    # ── SHEET REGISTRY (determines sidebar nav and TOC) ──────────────────────
    SHEETS = [
        ("01 Cover Page",        "🏠",  "Report overview & branding"),
        ("02 Table of Contents", "📋",  "Navigation & sheet index"),
        ("03 Executive Summary", "📊",  "CEO-level narrative & overview"),
        ("04 AI Insights",       "🧠",  "AI WHY-analysis observations"),
        ("05 KPI Dashboard",     "🔢",  "Dynamic key performance indicators"),
        ("06 Exec Dashboard",    "📈",  "Multi-chart executive dashboard"),
        ("07 Cleaned Data",      "🧹",  "Cleaned & normalized dataset"),
        ("08 Data Quality",      "✅",  "Quality score & cleaning audit"),
        ("09 Pivot Analysis",    "🔀",  "Cross-tabulation & aggregation"),
        ("10 Trend Analysis",    "📉",  "Period-over-period trend table"),
        ("11 Forecasting",       "🔮",  "Statistical trend forecasting"),
        ("12 Risk & Anomalies",  "⚠️",  "IQR outlier detection & risk flags"),
        ("13 Recommendations",   "💡",  "Evidence-based strategic actions"),
        ("14 Methodology",       "📝",  "Data cleaning log & assumptions"),
        ("15 Data Dictionary",   "📖",  "Column schema & business definitions"),
    ]

    # Append domain-specific sheets
    domain_sheet_map = {
        "Revenue Analysis":     ("🏦", "Revenue breakdown & analysis"),
        "Profit Analysis":      ("💰", "Profit margin & cost analysis"),
        "Customer Analysis":    ("👥", "Customer segmentation & behavior"),
        "Product Analysis":     ("📦", "Product performance & ranking"),
        "Regional Analysis":    ("🗺️",  "Geographic performance breakdown"),
        "Time Analysis":        ("🕐", "Monthly/quarterly/annual breakdown"),
        "Correlation Analysis": ("🔗", "Multi-variable correlation matrix"),
    }
    extra_sheet_num = 16
    extra_sheets = []
    for sh_name in additional_sheets:
        if sh_name in domain_sheet_map:
            icon, desc = domain_sheet_map[sh_name]
            xls_name = f"{extra_sheet_num:02d} {sh_name}"
            SHEETS.append((xls_name, icon, desc))
            extra_sheets.append((xls_name, sh_name))
            extra_sheet_num += 1

    # ── SIDEBAR HELPER ────────────────────────────────────────────────────────
    def add_sidebar(ws, current_sheet_name):
        ws.set_column("A:A", 26, fmt["sidebar_bg"])
        ws.set_row(0, 8, fmt["sidebar_bg"])   # top padding
        ws.set_row(1, 40, fmt["sidebar_bg"])  # logo row
        ws.write("A2", "◆ DATA INSIGHT", fmt["sidebar_title"])
        ws.set_row(2, 6, fmt["sidebar_bg"])   # spacer
        ws.write("A3", "", fmt["sidebar_bg"])
        ws.write(
            "A4",
            "  NAVIGATION",
            F(bg_color=C_DARKEST, font_color=C_SLATE_400, bold=True, font_size=8)
        )
        ws.set_row(4, 4, fmt["sidebar_bg"])

        for i, (sheet_name, icon, _desc) in enumerate(SHEETS):
            row = 5 + i * 2
            ws.set_row(row, 18, fmt["sidebar_bg"])
            link_text = f"  {icon} {sheet_name}"
            if sheet_name == current_sheet_name:
                # Highlight active sheet
                ws.write(
                    row, 0, link_text,
                    F(bg_color=C_DARK, font_color=C_PRIMARY, font_size=9,
                      bold=True, align="left", valign="vcenter")
                )
            else:
                ws.write_url(
                    row, 0,
                    f"internal:'{sheet_name}'!A1",
                    string=link_text,
                    cell_format=fmt["sidebar_link"]
                )
            ws.set_row(row + 1, 2, fmt["sidebar_bg"])  # micro gap

    # ── PAGE HEADER HELPER ────────────────────────────────────────────────────
    def add_page_header(ws, title, subtitle=""):
        ws.set_row(0, 5)    # top padding
        ws.set_row(1, 36)   # title row
        ws.set_row(2, 20)   # subtitle row
        ws.set_row(3, 8)    # separator

        # Title
        ws.merge_range("B2:P2", title, fmt["page_title"])
        if subtitle:
            ws.merge_range("B3:P3", subtitle, fmt["page_subtitle"])

        # Separator line
        sep_fmt = F(bg_color=C_PRIMARY, border=0)
        ws.merge_range("B4:P4", "", sep_fmt)
        ws.set_row(3, 3, sep_fmt)

    # ── PAGE FOOTER HELPER ────────────────────────────────────────────────────
    def add_page_footer(ws, page_num, total_pages):
        ws.set_footer(
            f"&L&8◆ Data Insight AI — {domain}"
            f"&C&8CONFIDENTIAL — Generated {now_short}"
            f"&R&8AI Generation ID: {gen_id} | Page {page_num}/{total_pages}"
        )
        ws.set_header(
            f"&L&8{report.title[:60]}"
            f"&R&8Data Insight AI · Enterprise BI Report"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 01: COVER PAGE
    # ─────────────────────────────────────────────────────────────────────────
    ws_cover = wb.add_worksheet("01 Cover Page")
    ws_cover.hide_gridlines(2)
    ws_cover.set_column("A:A", 4)
    ws_cover.set_column("B:L", 13)

    # Full-bleed banner (rows 0-14)
    banner = F(bg_color=C_DARKEST)
    for r in range(15):
        ws_cover.set_row(r, 28, banner)

    # Branding header
    ws_cover.merge_range(
        "B2:K3", "◆ DATA INSIGHT AI",
        F(bold=True, font_size=28, font_color=C_PRIMARY,
          bg_color=C_DARKEST, align="center", valign="vcenter")
    )
    ws_cover.merge_range(
        "B4:K5", "Enterprise Business Intelligence Report",
        F(bold=True, font_size=20, font_color=C_WHITE,
          bg_color=C_DARKEST, align="center", valign="vcenter")
    )
    ws_cover.merge_range(
        "B6:K7", report_subtitle,
        F(bold=True, font_size=15, font_color="#a7f3d0",
          bg_color=C_DARKEST, align="center", valign="vcenter")
    )

    # Accent divider
    ws_cover.merge_range("B9:K9", "", F(bg_color=C_PRIMARY))
    ws_cover.set_row(8, 3, F(bg_color=C_PRIMARY))

    # Body section
    for r in range(15, 50):
        ws_cover.set_row(r, 22)

    ws_cover.merge_range(
        "C11:J11", report.title,
        F(bold=True, font_size=18, font_color=C_DARK, align="center")
    )
    cover_meta = [
        ("Dataset",          dataset.name),
        ("Domain",           domain),
        ("Total Records",    f"{dataset.row_count:,}" if dataset.row_count else "—"),
        ("Total Columns",    str(dataset.column_count or "—")),
        ("Quality Score",    f"{dataset.data_quality_score}/100" if dataset.data_quality_score else "—"),
        ("Generated By",     "Data Insight AI Intelligence Engine"),
        ("Generated On",     now_str),
        ("Report Version",   "1.0"),
        ("AI Generation ID", gen_id),
        ("Classification",   "CONFIDENTIAL"),
    ]
    label_fmt = F(bold=True, font_size=10, font_color=C_SLATE_600,
                  bg_color=C_OFF_WHITE, border=1, align="right", valign="vcenter", indent=1)
    value_fmt = F(font_size=10, font_color=C_CHARCOAL,
                  bg_color=C_WHITE, border=1, valign="vcenter", indent=1)

    for i, (lbl, val) in enumerate(cover_meta):
        row = 12 + i
        ws_cover.write(row, 2, lbl, label_fmt)
        ws_cover.merge_range(row, 3, row, 7, val, value_fmt)
        ws_cover.set_row(row, 24)

    # CTA Button
    ws_cover.set_row(24, 36)
    ws_cover.merge_range(
        "D25:G25", "▶  Open Executive Dashboard",
        F(bold=True, font_size=13, font_color=C_WHITE,
          bg_color=C_PRIMARY, align="center", valign="vcenter", border=0)
    )
    ws_cover.write_url(
        "D25", "internal:'06 Exec Dashboard'!A1",
        string="▶  Open Executive Dashboard",
        cell_format=F(bold=True, font_size=13, font_color=C_WHITE,
                      bg_color=C_PRIMARY, align="center", valign="vcenter")
    )
    ws_cover.write_url(
        "H25", "internal:'02 Table of Contents'!A1",
        string="📋  Table of Contents →",
        cell_format=F(bold=True, font_size=11, font_color=C_DARK,
                      bg_color=C_MINT, align="center", valign="vcenter", border=1)
    )
    ws_cover.merge_range("H25:J25", "")
    ws_cover.write_url(
        "H25", "internal:'02 Table of Contents'!A1",
        string="📋  Table of Contents →",
        cell_format=F(bold=True, font_size=11, font_color=C_DARK,
                      bg_color=C_MINT, align="center", valign="vcenter", border=1)
    )

    add_page_footer(ws_cover, 1, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 02: TABLE OF CONTENTS
    # ─────────────────────────────────────────────────────────────────────────
    ws_toc = wb.add_worksheet("02 Table of Contents")
    ws_toc.hide_gridlines(2)
    add_sidebar(ws_toc, "02 Table of Contents")
    add_page_header(ws_toc, "Table of Contents", report_subtitle)

    ws_toc.set_column("B:B", 2)
    ws_toc.set_column("C:C", 8)   # num
    ws_toc.set_column("D:J", 16)  # title
    ws_toc.set_column("K:K", 40)  # description

    toc_header_row = 5
    ws_toc.set_row(toc_header_row, 24)
    ws_toc.write(toc_header_row, 2, "#", fmt["table_header"])
    ws_toc.merge_range(toc_header_row, 3, toc_header_row, 9, "Sheet Name", fmt["table_header"])
    ws_toc.write(toc_header_row, 10, "Description", fmt["table_header"])

    for i, (sheet_name, icon, desc) in enumerate(SHEETS):
        row = toc_header_row + 1 + i
        ws_toc.set_row(row, 22)
        is_alt = i % 2 == 0
        bg = C_ACCENT_BG if is_alt else C_WHITE
        num_fmt = F(font_size=10, bold=True, font_color=C_PRIMARY, bg_color=bg,
                    border=1, align="center", valign="vcenter")
        lnk_fmt = F(font_size=10, font_color=C_DARK, bg_color=bg,
                    border=1, valign="vcenter", underline=True, indent=1)
        desc_fmt = F(font_size=10, font_color=C_SLATE_600, bg_color=bg,
                     border=1, valign="vcenter", indent=1, italic=True)

        ws_toc.write(row, 2, f"{icon}", num_fmt)
        ws_toc.write_url(
            row, 3, f"internal:'{sheet_name}'!A1",
            string=sheet_name, cell_format=lnk_fmt
        )
        ws_toc.merge_range(row, 3, row, 9, "")
        ws_toc.write_url(
            row, 3, f"internal:'{sheet_name}'!A1",
            string=sheet_name, cell_format=lnk_fmt
        )
        ws_toc.write(row, 10, desc, desc_fmt)

    add_page_footer(ws_toc, 2, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 03: EXECUTIVE SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    ws_exec = wb.add_worksheet("03 Executive Summary")
    ws_exec.hide_gridlines(2)
    add_sidebar(ws_exec, "03 Executive Summary")
    add_page_header(ws_exec, "Executive Summary", "CEO-Level Business Intelligence Narrative")

    ws_exec.set_column("B:B", 2)
    ws_exec.set_column("C:N", 13)

    # Summary header card
    ws_exec.set_row(5, 30)
    ws_exec.merge_range(
        "C6:N6", f"  {domain} — AI Executive Briefing",
        F(bold=True, font_size=13, font_color=C_WHITE,
          bg_color=C_DARK, align="left", valign="vcenter", indent=1)
    )

    ws_exec.set_row(6, 500)
    ws_exec.merge_range(
        "C7:N7",
        exec_summary if exec_summary else "Executive summary not available.",
        F(font_size=11, text_wrap=True, valign="top", indent=1,
          bg_color=C_WHITE, border=1)
    )

    # Metadata footer strip
    ws_exec.set_row(8, 22)
    ws_exec.merge_range(
        "C9:N9",
        f"  Generated by Data Insight AI Intelligence Engine · {now_str} · Report ID: {gen_id}",
        F(font_size=9, italic=True, font_color=C_SLATE_400,
          bg_color=C_OFF_WHITE, border=1, valign="vcenter")
    )
    add_page_footer(ws_exec, 3, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 04: AI EXECUTIVE INSIGHTS
    # ─────────────────────────────────────────────────────────────────────────
    ws_insights = wb.add_worksheet("04 AI Insights")
    ws_insights.hide_gridlines(2)
    add_sidebar(ws_insights, "04 AI Insights")
    add_page_header(ws_insights, "AI Executive Insights", "WHY-Analysis: Root Causes & Business Implications")

    ws_insights.set_column("B:B", 2)
    ws_insights.set_column("C:N", 13)

    insights_text = ai_insights if ai_insights else "AI insights not available."

    # Parse & render insights as cards
    insight_blocks = insights_text.split("INSIGHT ")
    row = 5
    for block in insight_blocks[1:]:  # skip empty first
        lines = block.strip().splitlines()
        if not lines:
            continue
        title_line = f"INSIGHT {lines[0]}" if lines else "INSIGHT"
        body_lines = "\n".join(lines[1:]).strip()

        ws_insights.set_row(row, 24)
        ws_insights.merge_range(row, 2, row, 13, f"  ▸ {title_line}", fmt["insight_head"])
        row += 1
        ws_insights.set_row(row, max(60, len(body_lines) // 3))
        ws_insights.merge_range(row, 2, row, 13, body_lines, fmt["insight_body"])
        row += 2

    if len(insight_blocks) <= 1:
        ws_insights.set_row(row, 400)
        ws_insights.merge_range(row, 2, row, 13, insights_text, fmt["body"])

    add_page_footer(ws_insights, 4, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 05: KPI DASHBOARD (Dynamic cards powered by live Excel formulas)
    # ─────────────────────────────────────────────────────────────────────────
    ws_kpi = wb.add_worksheet("05 KPI Dashboard")
    ws_kpi.hide_gridlines(2)
    add_sidebar(ws_kpi, "05 KPI Dashboard")
    add_page_header(ws_kpi, "KPI Dashboard", "Dynamic Key Performance Indicators — Live Excel Formulas")

    ws_kpi.set_column("B:B", 2)
    ws_kpi.set_column("C:C", 1)   # spacer
    ws_kpi.set_column("D:F", 12)  # card 1
    ws_kpi.set_column("G:G", 2)   # gap
    ws_kpi.set_column("H:J", 12)  # card 2
    ws_kpi.set_column("K:K", 2)   # gap
    ws_kpi.set_column("L:N", 12)  # card 3
    ws_kpi.set_column("O:O", 2)   # gap
    ws_kpi.set_column("P:R", 12)  # card 4

    detected_kpis = blueprint.get("detected_kpis", [])

    # Build KPI cards from numeric columns using live formulas
    kpi_items = []
    for col in numeric_cols[:8]:
        col_letter = xl_col_to_name(df_clean.columns.get_loc(col) + 1)
        kpi_items.append({
            "label": str(col).replace("_", " ").title(),
            "sum_formula":  f"=SUM('07 Cleaned Data'!{col_letter}5:{col_letter}9999)",
            "avg_formula":  f"=AVERAGE('07 Cleaned Data'!{col_letter}5:{col_letter}9999)",
            "max_formula":  f"=MAX('07 Cleaned Data'!{col_letter}5:{col_letter}9999)",
            "min_formula":  f"=MIN('07 Cleaned Data'!{col_letter}5:{col_letter}9999)",
        })

    kpi_positions = [
        (5, 3),   # row 5, col D (idx 3)
        (5, 7),   # row 5, col H
        (5, 11),  # row 5, col L
        (5, 15),  # row 5, col P
        (10, 3),  # row 10, col D
        (10, 7),
        (10, 11),
        (10, 15),
    ]

    for idx, kpi in enumerate(kpi_items[:8]):
        if idx >= len(kpi_positions):
            break
        r, c = kpi_positions[idx]
        ws_kpi.set_row(r,   24)
        ws_kpi.set_row(r+1, 50)
        ws_kpi.set_row(r+2, 18)
        ws_kpi.set_row(r+3, 18)

        ws_kpi.merge_range(r, c, r, c+2, kpi["label"], fmt["kpi_label"])
        ws_kpi.merge_range(r+1, c, r+1, c+2, "", fmt["kpi_value"])
        ws_kpi.write_formula(r+1, c, kpi["sum_formula"], fmt["kpi_value"])
        ws_kpi.merge_range(r+2, c, r+2, c+2, "", fmt["kpi_sub"])
        ws_kpi.write_formula(r+2, c, f'="Avg: "&ROUND({kpi["avg_formula"][1:]},2)', fmt["kpi_sub"])
        ws_kpi.merge_range(r+3, c, r+3, c+2, "", fmt["kpi_sub"])
        ws_kpi.write_formula(r+3, c, f'="Max: "&{kpi["max_formula"][1:]}', fmt["kpi_sub"])

    add_page_footer(ws_kpi, 5, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 06: EXECUTIVE DASHBOARD (Multi-chart premium)
    # ─────────────────────────────────────────────────────────────────────────
    ws_dash = wb.add_worksheet("06 Exec Dashboard")
    ws_dash.hide_gridlines(2)
    add_sidebar(ws_dash, "06 Exec Dashboard")
    add_page_header(ws_dash, "Executive Dashboard", f"{domain} — Performance Overview")
    ws_dash.set_column("B:B", 2)
    ws_dash.set_column("C:P", 10)

    if numeric_cols and len(numeric_cols) >= 1:
        rec_charts = blueprint.get("recommended_charts", [])

        # Chart 1: Column chart (primary metric)
        col1 = primary_metric or numeric_cols[0]
        chart1 = wb.add_chart({"type": "column"})
        c1_letter = xl_col_to_name(df_clean.columns.get_loc(col1) + 1)

        if groupby_dim and groupby_dim in df_clean.columns:
            cat_letter = xl_col_to_name(df_clean.columns.get_loc(groupby_dim) + 1)
            chart1.add_series({
                "name":       f"='07 Cleaned Data'!${c1_letter}$4",
                "categories": f"='07 Cleaned Data'!${cat_letter}$5:${cat_letter}$51",
                "values":     f"='07 Cleaned Data'!${c1_letter}$5:${c1_letter}$51",
                "fill":       {"color": C_PRIMARY},
                "gap":        60,
            })
        else:
            chart1.add_series({
                "name":   f"='07 Cleaned Data'!${c1_letter}$4",
                "values": f"='07 Cleaned Data'!${c1_letter}$5:${c1_letter}$51",
                "fill":   {"color": C_PRIMARY},
            })

        chart_title1 = rec_charts[0]["title"] if rec_charts else f"{col1} Breakdown"
        chart1.set_title({"name": chart_title1})
        chart1.set_style(2)
        chart1.set_legend({"none": True})
        chart1.set_chartarea({"border": {"none": True}, "fill": {"color": C_WHITE}})
        chart1.set_plotarea({"border": {"none": True}})
        ws_dash.insert_chart("C6", chart1, {"x_scale": 1.9, "y_scale": 1.6})

        # Chart 2: Line chart (second metric or trend)
        if len(numeric_cols) > 1:
            col2 = numeric_cols[1]
            chart2 = wb.add_chart({"type": "line"})
            c2_letter = xl_col_to_name(df_clean.columns.get_loc(col2) + 1)
            chart2.add_series({
                "name":   f"='07 Cleaned Data'!${c2_letter}$4",
                "values": f"='07 Cleaned Data'!${c2_letter}$5:${c2_letter}$101",
                "line":   {"color": C_DARK, "width": 2.5, "smooth": True},
                "marker": {"type": "circle", "size": 4, "fill": {"color": C_PRIMARY}},
            })
            chart_title2 = rec_charts[1]["title"] if len(rec_charts) > 1 else f"{col2} Trend"
            chart2.set_title({"name": chart_title2})
            chart2.set_style(2)
            chart2.set_legend({"none": True})
            chart2.set_chartarea({"border": {"none": True}, "fill": {"color": C_WHITE}})
            chart2.set_plotarea({"border": {"none": True}})
            ws_dash.insert_chart("I6", chart2, {"x_scale": 1.9, "y_scale": 1.6})

        # Chart 3: Area chart (third metric)
        if len(numeric_cols) > 2:
            col3 = numeric_cols[2]
            chart3 = wb.add_chart({"type": "area"})
            c3_letter = xl_col_to_name(df_clean.columns.get_loc(col3) + 1)
            chart3.add_series({
                "name":   f"='07 Cleaned Data'!${c3_letter}$4",
                "values": f"='07 Cleaned Data'!${c3_letter}$5:${c3_letter}$51",
                "fill":   {"color": C_MINT},
                "line":   {"color": C_PRIMARY, "width": 2},
            })
            chart_title3 = rec_charts[2]["title"] if len(rec_charts) > 2 else f"{col3} Distribution"
            chart3.set_title({"name": chart_title3})
            chart3.set_style(2)
            chart3.set_legend({"none": True})
            chart3.set_chartarea({"border": {"none": True}, "fill": {"color": C_WHITE}})
            ws_dash.insert_chart("C24", chart3, {"x_scale": 1.9, "y_scale": 1.4})

    ws_dash.set_landscape()
    add_page_footer(ws_dash, 6, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 07: CLEANED DATA (Named Table, filters, freeze panes)
    # ─────────────────────────────────────────────────────────────────────────
    ws_data = wb.add_worksheet("07 Cleaned Data")
    add_sidebar(ws_data, "07 Cleaned Data")
    add_page_header(ws_data, "Cleaned Dataset", f"{len(df_clean):,} rows × {len(df_clean.columns)} columns — AI-Cleaned & Normalized")

    ws_data.freeze_panes(4, 1)

    # Headers row 4 (0-indexed: 3)
    for ci, col in enumerate(df_clean.columns):
        ws_data.write(3, ci + 1, str(col), fmt["table_header"])
        col_width = max(len(str(col)) + 4, 12)
        ws_data.set_column(ci + 1, ci + 1, col_width)

    # Data rows
    for ri, row_data in enumerate(df_clean.head(5000).values.tolist()):
        is_alt = ri % 2 == 0
        row_fmt = fmt["cell_alt"] if is_alt else fmt["cell"]
        row_num_fmt = fmt["num_alt"] if is_alt else fmt["num"]
        for ci, val in enumerate(row_data):
            try:
                if isinstance(val, (int, float)):
                    ws_data.write(ri + 4, ci + 1, val, row_num_fmt)
                else:
                    ws_data.write(ri + 4, ci + 1, val, row_fmt)
            except Exception:
                ws_data.write(ri + 4, ci + 1, str(val), row_fmt)

    # AutoFilter
    ws_data.autofilter(3, 1, 3 + len(df_clean), len(df_clean.columns))
    add_page_footer(ws_data, 7, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 08: DATA QUALITY REPORT
    # ─────────────────────────────────────────────────────────────────────────
    ws_qual = wb.add_worksheet("08 Data Quality")
    ws_qual.hide_gridlines(2)
    add_sidebar(ws_qual, "08 Data Quality")
    add_page_header(ws_qual, "Data Quality Report", "Cleaning Audit, Quality Score & Dataset Health")

    ws_qual.set_column("B:B", 2)
    ws_qual.set_column("C:C", 30)
    ws_qual.set_column("D:G", 18)

    quality_score = getattr(dataset, "data_quality_score", None) or 85
    score_fmt = (
        fmt["quality_good"] if quality_score >= 80
        else fmt["quality_warn"] if quality_score >= 60
        else fmt["quality_bad"]
    )

    ws_qual.set_row(5, 60)
    ws_qual.merge_range(
        "C6:D6", f"Quality Score: {quality_score}/100", score_fmt
    )
    ws_qual.merge_range(
        "E6:G6",
        "EXCELLENT" if quality_score >= 80 else "NEEDS ATTENTION" if quality_score >= 60 else "CRITICAL",
        score_fmt
    )

    # Quality metrics table
    null_total = df_raw.isnull().sum().sum()
    dup_total = df_raw.duplicated().sum()
    numeric_count = len(numeric_cols)
    cat_count = len(cat_cols)

    quality_rows = [
        ("Total Raw Rows",          df_raw.shape[0],           "info"),
        ("Total Cleaned Rows",      df_clean.shape[0],         "good"),
        ("Total Columns",           df_raw.shape[1],           "info"),
        ("Numeric Columns",         numeric_count,             "info"),
        ("Categorical Columns",     cat_count,                 "info"),
        ("Duplicate Rows Removed",  int(dup_total),            "warn" if dup_total > 0 else "good"),
        ("Missing Values Resolved", int(null_total),           "warn" if null_total > 0 else "good"),
        ("Data Quality Score",      f"{quality_score}/100",    "good" if quality_score >= 80 else "warn"),
        ("AI Models Used",          "Gemini Flash / GPT-4o",   "info"),
        ("Generated On",            now_str,                   "info"),
        ("AI Generation ID",        gen_id,                    "info"),
    ]

    ws_qual.set_row(7, 22)
    ws_qual.write(7, 2, "Metric", fmt["table_header"])
    ws_qual.write(7, 3, "Value", fmt["table_header"])
    ws_qual.write(7, 4, "Status", fmt["table_header"])

    for i, (label, value, status) in enumerate(quality_rows):
        row = 8 + i
        ws_qual.set_row(row, 22)
        is_alt = i % 2 == 0
        bg = C_ACCENT_BG if is_alt else C_WHITE
        lbl_f = F(bold=True, font_size=10, font_color=C_SLATE_600, bg_color=bg,
                  border=1, valign="vcenter", indent=1)
        val_f = F(font_size=10, font_color=C_CHARCOAL, bg_color=bg,
                  border=1, valign="vcenter", indent=1)
        status_fmts = {
            "good": F(bold=True, font_size=10, font_color=C_WHITE, bg_color=C_PRIMARY,
                      border=1, align="center", valign="vcenter"),
            "warn": F(bold=True, font_size=10, font_color=C_WHITE, bg_color=C_WARNING,
                      border=1, align="center", valign="vcenter"),
            "bad":  F(bold=True, font_size=10, font_color=C_WHITE, bg_color=C_DANGER,
                      border=1, align="center", valign="vcenter"),
            "info": F(font_size=10, font_color=C_SLATE_600, bg_color=bg,
                      border=1, align="center", valign="vcenter", italic=True),
        }
        ws_qual.write(row, 2, label, lbl_f)
        ws_qual.write(row, 3, str(value), val_f)
        ws_qual.write(row, 4, "✓ OK" if status == "good" else "⚠ Note" if status == "warn" else "ⓘ", status_fmts[status])

    # Cleaning Log
    ws_qual.set_row(20, 24)
    ws_qual.merge_range("C21:G21", "  AI Data Cleaning Log", fmt["table_header"])
    for i, log_entry in enumerate(cleaning_log or ["No cleaning operations performed."]):
        row = 21 + i
        ws_qual.set_row(row, 20)
        is_alt = i % 2 == 0
        ws_qual.merge_range(
            row, 2, row, 6, f"  ✔ {log_entry}",
            F(font_size=10, font_color=C_DARK, bg_color=C_ACCENT_BG if is_alt else C_WHITE,
              border=1, valign="vcenter")
        )

    add_page_footer(ws_qual, 8, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 09: PIVOT ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    ws_pivot = wb.add_worksheet("09 Pivot Analysis")
    ws_pivot.hide_gridlines(2)
    add_sidebar(ws_pivot, "09 Pivot Analysis")
    add_page_header(ws_pivot, "Pivot Analysis", "Cross-Tabulation & Aggregated Performance Metrics")

    ws_pivot.set_column("B:B", 2)
    ws_pivot.set_column("C:C", 28)
    ws_pivot.set_column("D:L", 16)

    if groupby_dim and groupby_dim in df_clean.columns and numeric_cols:
        try:
            import pandas as pd
            pivot_df = df_clean.groupby(groupby_dim)[numeric_cols[:6]].agg(["sum", "mean", "count"])
            pivot_df.columns = [f"{col}_{agg}" for col, agg in pivot_df.columns]
            pivot_df = pivot_df.reset_index().head(50)

            ws_pivot.set_row(5, 24)
            ws_pivot.write(5, 2, groupby_dim, fmt["table_header"])
            col_offset = 3
            for col_name in pivot_df.columns[1:]:
                ws_pivot.write(5, col_offset, col_name.replace("_", " ").title(), fmt["table_header"])
                ws_pivot.set_column(col_offset, col_offset, 18)
                col_offset += 1

            for ri, row_data in enumerate(pivot_df.values.tolist()):
                r = 6 + ri
                ws_pivot.set_row(r, 20)
                is_alt = ri % 2 == 0
                ws_pivot.write(r, 2, str(row_data[0]),
                               fmt["cell_alt"] if is_alt else fmt["cell"])
                for ci, val in enumerate(row_data[1:]):
                    ws_pivot.write(r, 3 + ci, val,
                                   fmt["num_alt"] if is_alt else fmt["num"])
        except Exception as e:
            ws_pivot.write(5, 2, f"Pivot analysis error: {str(e)}", fmt["body"])
    else:
        ws_pivot.write(5, 2, "Insufficient data for pivot analysis (requires categorical + numeric columns).", fmt["body"])

    add_page_footer(ws_pivot, 9, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 10: TREND ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    ws_trend = wb.add_worksheet("10 Trend Analysis")
    ws_trend.hide_gridlines(2)
    add_sidebar(ws_trend, "10 Trend Analysis")
    add_page_header(ws_trend, "Trend Analysis", "Period-over-Period Performance with Directional Indicators")

    ws_trend.set_column("B:B", 2)
    ws_trend.set_column("C:C", 24)
    ws_trend.set_column("D:M", 16)

    if primary_metric and primary_metric in df_clean.columns:
        try:
            metric_series = df_clean[primary_metric].dropna().reset_index(drop=True)
            n = len(metric_series)
            chunk = max(1, n // 10)
            periods = []
            for i in range(10):
                start = i * chunk
                end = min((i + 1) * chunk, n)
                if start >= n:
                    break
                val = metric_series.iloc[start:end].mean()
                periods.append((f"Period {i+1}", val))

            ws_trend.set_row(5, 24)
            ws_trend.write(5, 2, "Period", fmt["table_header"])
            ws_trend.write(5, 3, primary_metric, fmt["table_header"])
            ws_trend.write(5, 4, "Change", fmt["table_header"])
            ws_trend.write(5, 5, "Trend", fmt["table_header"])
            ws_trend.write(5, 6, "% Change", fmt["table_header"])

            for i, (period_name, val) in enumerate(periods):
                r = 6 + i
                ws_trend.set_row(r, 22)
                is_alt = i % 2 == 0
                bg = C_ACCENT_BG if is_alt else C_WHITE
                ws_trend.write(r, 2, period_name,
                               F(font_size=10, bg_color=bg, border=1, valign="vcenter", indent=1))
                ws_trend.write(r, 3, round(val, 2),
                               F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00", valign="vcenter"))

                if i > 0:
                    prev = periods[i-1][1]
                    change = val - prev
                    pct_change = ((val - prev) / prev * 100) if prev != 0 else 0
                    arrow = "▲" if change >= 0 else "▼"
                    arrow_color = C_PRIMARY if change >= 0 else C_DANGER
                    ws_trend.write(r, 4, round(change, 2),
                                   F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00",
                                     font_color=arrow_color, valign="vcenter"))
                    ws_trend.write(r, 5, arrow,
                                   F(bold=True, font_size=12, font_color=arrow_color,
                                     bg_color=bg, border=1, align="center", valign="vcenter"))
                    ws_trend.write(r, 6, pct_change / 100,
                                   F(font_size=10, bg_color=bg, border=1, num_format="0.0%",
                                     font_color=arrow_color, valign="vcenter"))
                else:
                    ws_trend.write(r, 4, "—", fmt["cell_alt" if is_alt else "cell"])
                    ws_trend.write(r, 5, "—", fmt["cell_alt" if is_alt else "cell"])
                    ws_trend.write(r, 6, "—", fmt["cell_alt" if is_alt else "cell"])
        except Exception as e:
            ws_trend.write(5, 2, f"Trend analysis error: {str(e)}", fmt["body"])
    else:
        ws_trend.write(5, 2, "No numeric data available for trend analysis.", fmt["body"])

    add_page_footer(ws_trend, 10, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 11: FORECASTING
    # ─────────────────────────────────────────────────────────────────────────
    ws_fc = wb.add_worksheet("11 Forecasting")
    ws_fc.hide_gridlines(2)
    add_sidebar(ws_fc, "11 Forecasting")
    add_page_header(ws_fc, "Forecasting", "Linear Regression — 20-Period Statistical Forecast")

    ws_fc.set_column("B:B", 2)
    ws_fc.set_column("C:E", 20)

    if numeric_cols and len(df_clean) > 10:
        target_col = primary_metric or numeric_cols[0]
        y = df_clean[target_col].dropna().values[:200].astype(float)
        x = np.arange(len(y))
        if len(y) > 2:
            m, b = np.polyfit(x, y, 1)
            direction = "upward" if m > 0 else "downward"
            confidence = "High" if abs(m) / (y.mean() + 1e-9) < 0.3 else "Moderate"

            ws_fc.set_row(5, 24)
            ws_fc.write(5, 2, "Period", fmt["table_header"])
            ws_fc.write(5, 3, f"{target_col} (Forecast)", fmt["table_header"])
            ws_fc.write(5, 4, "Confidence Band (±10%)", fmt["table_header"])

            # Historical anchor
            ws_fc.set_row(6, 22)
            ws_fc.write(6, 2, "Current (Baseline)", fmt["cell"])
            ws_fc.write(6, 3, round(y[-1], 2), fmt["num"])
            ws_fc.write(6, 4, f"Trend: {direction.title()} ({confidence} Confidence)", fmt["cell"])

            for i in range(20):
                r = 7 + i
                ws_fc.set_row(r, 20)
                val = float((m * (len(y) + i)) + b)
                band = abs(val * 0.10)
                is_alt = i % 2 == 0
                bg = C_ACCENT_BG if is_alt else C_WHITE
                ws_fc.write(r, 2, f"Future Period {i+1}",
                            F(font_size=10, bg_color=bg, border=1, valign="vcenter", indent=1))
                ws_fc.write(r, 3, round(val, 2),
                            F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00",
                              valign="vcenter",
                              font_color=C_PRIMARY if val > y[-1] else C_DANGER))
                ws_fc.write(r, 4, f"±{band:,.2f}",
                            F(font_size=10, bg_color=bg, border=1, valign="vcenter",
                              font_color=C_SLATE_600, italic=True))

            # Forecast chart
            fc_chart = wb.add_chart({"type": "line"})
            fc_chart.add_series({
                "name":       "Forecast",
                "categories": "='11 Forecasting'!$C$8:$C$27",
                "values":     "='11 Forecasting'!$D$8:$D$27",
                "line":       {"color": C_WARNING, "width": 2.5, "dash_type": "dash"},
                "marker":     {"type": "diamond", "size": 5,
                               "fill": {"color": C_WARNING},
                               "border": {"color": C_WARNING}},
            })
            fc_chart.set_title({"name": f"{target_col} — 20-Period Forecast"})
            fc_chart.set_style(2)
            fc_chart.set_chartarea({"border": {"none": True}, "fill": {"color": C_WHITE}})
            fc_chart.set_plotarea({"border": {"none": True}})
            ws_fc.insert_chart("F6", fc_chart, {"x_scale": 2.2, "y_scale": 1.8})

            # Methodology note
            ws_fc.set_row(30, 22)
            ws_fc.merge_range(
                "C31:F31",
                f"Methodology: Ordinary Least Squares (OLS) Linear Regression on {len(y)} data points. "
                f"Slope: {m:+.4f}/period. Confidence: {confidence}. "
                "Note: Forecasts are statistical projections. Actual results may differ.",
                F(font_size=9, italic=True, font_color=C_SLATE_400, text_wrap=True,
                  bg_color=C_OFF_WHITE, border=1, valign="vcenter")
            )
    else:
        ws_fc.write(5, 2, "Insufficient data for forecasting (minimum 10 rows required).", fmt["body"])

    add_page_footer(ws_fc, 11, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 12: RISK & ANOMALIES
    # ─────────────────────────────────────────────────────────────────────────
    ws_risk = wb.add_worksheet("12 Risk & Anomalies")
    add_sidebar(ws_risk, "12 Risk & Anomalies")
    add_page_header(ws_risk, "Risk & Anomaly Detection", "IQR Method — Statistical Outlier Identification & Risk Flags")

    ws_risk.set_column("B:B", 2)
    ws_risk.set_column("C:E", 24)

    anom_col = blueprint.get("anomaly_detection_column") or (numeric_cols[0] if numeric_cols else None)
    check_cols = []
    if anom_col and anom_col in df_clean.columns:
        check_cols.append(anom_col)
    for col in numeric_cols[:3]:
        if col not in check_cols:
            check_cols.append(col)
    check_cols = check_cols[:4]

    curr_row = 5
    for col in check_cols:
        series = df_clean[col].dropna()
        if len(series) < 4:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = df_clean[
            (df_clean[col] < lower) | (df_clean[col] > upper)
        ]
        severity = "CRITICAL" if len(outliers) > 10 else "WARNING" if len(outliers) > 3 else "INFO"
        sev_fmt = (fmt["rec_critical"] if severity == "CRITICAL"
                   else fmt["rec_high"] if severity == "WARNING"
                   else fmt["quality_good"])

        ws_risk.set_row(curr_row, 26)
        ws_risk.merge_range(
            curr_row, 2, curr_row, 3,
            f"  ⚠ {col}: {len(outliers)} outlier(s) detected",
            F(bold=True, font_size=11, font_color=C_WHITE,
              bg_color=C_DANGER if len(outliers) > 5 else C_WARNING,
              border=1, valign="vcenter")
        )
        ws_risk.write(curr_row, 4, severity, sev_fmt)
        curr_row += 1

        ws_risk.set_row(curr_row, 20)
        ws_risk.write(curr_row, 2, f"IQR Range: [{lower:,.2f} — {upper:,.2f}]",
                      F(font_size=9, italic=True, font_color=C_SLATE_600,
                        bg_color=C_OFF_WHITE, border=1, valign="vcenter", indent=1))
        ws_risk.write(curr_row, 3, f"Q1={q1:,.2f}  Q3={q3:,.2f}  IQR={iqr:,.2f}",
                      F(font_size=9, italic=True, font_color=C_SLATE_600,
                        bg_color=C_OFF_WHITE, border=1, valign="vcenter", indent=1))
        ws_risk.write(curr_row, 4, f"{len(outliers)}/{len(series)} records flagged",
                      F(font_size=9, font_color=C_SLATE_600,
                        bg_color=C_OFF_WHITE, border=1, align="center", valign="vcenter"))
        curr_row += 1

        if not outliers.empty:
            ws_risk.set_row(curr_row, 20)
            ws_risk.write(curr_row, 2, "Row #", fmt["table_header2"])
            ws_risk.write(curr_row, 3, col, fmt["table_header2"])
            ws_risk.write(curr_row, 4, "Deviation", fmt["table_header2"])
            curr_row += 1

            for idx, (orig_idx, val) in enumerate(outliers[col].head(10).items()):
                ws_risk.set_row(curr_row, 20)
                deviation = val - series.mean()
                ws_risk.write(curr_row, 2, str(orig_idx), fmt["cell"])
                ws_risk.write(curr_row, 3, val, fmt["num"])
                ws_risk.write(curr_row, 4, f"{deviation:+,.2f}",
                              F(font_size=10, border=1, valign="vcenter",
                                font_color=C_DANGER if deviation < 0 else C_PRIMARY,
                                bold=True))
                curr_row += 1

        curr_row += 2

    if not check_cols:
        ws_risk.write(5, 2, "No numeric columns available for anomaly detection.", fmt["body"])

    add_page_footer(ws_risk, 12, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 13: RECOMMENDATIONS
    # ─────────────────────────────────────────────────────────────────────────
    ws_rec = wb.add_worksheet("13 Recommendations")
    ws_rec.hide_gridlines(2)
    add_sidebar(ws_rec, "13 Recommendations")
    add_page_header(ws_rec, "Strategic Recommendations",
                    "Evidence-Based Actions — Ranked by Business Impact")

    ws_rec.set_column("B:B", 2)
    ws_rec.set_column("C:N", 12)

    recs_text = recommendations if recommendations else "Strategic recommendations not available."
    rec_blocks = recs_text.split("RECOMMENDATION ")

    row = 5
    for block in rec_blocks[1:]:
        lines = block.strip().splitlines()
        if not lines:
            continue
        title_line = f"RECOMMENDATION {lines[0]}" if lines else "RECOMMENDATION"
        body_lines = "\n".join(lines[1:]).strip()

        # Detect priority for coloring
        priority = "HIGH"
        for line in lines:
            if "PRIORITY:" in line.upper():
                if "CRITICAL" in line.upper():
                    priority = "CRITICAL"
                elif "MEDIUM" in line.upper():
                    priority = "MEDIUM"
                elif "LOW" in line.upper():
                    priority = "LOW"
                break
        p_fmt = (fmt["rec_critical"] if priority == "CRITICAL"
                 else fmt["rec_high"] if priority == "HIGH"
                 else fmt["rec_medium"] if priority == "MEDIUM"
                 else fmt["rec_low"])

        ws_rec.set_row(row, 26)
        ws_rec.merge_range(row, 2, row, 12, f"  ▸ {title_line}", fmt["insight_head"])
        ws_rec.write(row, 13, priority, p_fmt)
        row += 1
        text_height = max(80, len(body_lines) // 3)
        ws_rec.set_row(row, text_height)
        ws_rec.merge_range(row, 2, row, 13, body_lines, fmt["insight_body"])
        row += 2

    if len(rec_blocks) <= 1:
        ws_rec.set_row(row, 500)
        ws_rec.merge_range(row, 2, row, 13, recs_text, fmt["body"])

    add_page_footer(ws_rec, 13, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 14: METHODOLOGY
    # ─────────────────────────────────────────────────────────────────────────
    ws_meth = wb.add_worksheet("14 Methodology")
    ws_meth.hide_gridlines(2)
    add_sidebar(ws_meth, "14 Methodology")
    add_page_header(ws_meth, "AI Methodology & Transparency",
                    "Data Cleaning Steps, Analytical Assumptions & Forecast Limitations")

    ws_meth.set_column("B:B", 2)
    ws_meth.set_column("C:N", 14)

    meth_sections = [
        ("ANALYTICAL APPROACH", [
            "• Blueprint Generation: Google Gemini Flash / OpenAI GPT-4o analyzed the dataset profile to determine domain, KPIs, charts, and sheet architecture.",
            "• Executive Summary: AI wrote a 5-section CEO-level narrative based on computed data metrics.",
            "• AI Insights: 8 WHY-analysis observations with root cause and strategic implications.",
            "• Recommendations: 8 evidence-based strategic actions ranked by business impact.",
            f"• Forecasting: Ordinary Least Squares (OLS) linear regression on primary metric '{primary_metric or 'N/A'}'.",
            "• Anomaly Detection: Interquartile Range (IQR) method with 1.5× fence to flag outliers.",
        ]),
        ("DATA CLEANING STEPS", [f"• {step}" for step in (cleaning_log or ["No cleaning operations were required."])]),
        ("ASSUMPTIONS & LIMITATIONS", [
            "• Forecasts are statistical projections based on historical trends in the uploaded data only.",
            "• AI insights are generated from aggregate statistics; individual record details may not be fully captured.",
            "• Missing values were imputed using column median; this may not reflect true values.",
            "• IQR outlier detection uses a 1.5× fence; some business-valid extreme values may be flagged.",
            "• All KPIs are calculated directly from the cleaned dataset using Excel native formulas.",
            "• The quality score is an estimate based on null %, duplicate %, and data type consistency.",
        ]),
        ("DATA PROVENANCE", [
            f"• Source Dataset: {dataset.name}",
            f"• Original Row Count: {dataset.row_count:,}" if dataset.row_count else "• Original Row Count: Unknown",
            f"• Cleaned Row Count: {len(df_clean):,}",
            f"• Column Count: {len(df_clean.columns)}",
            f"• Generation Timestamp: {now_str}",
            f"• AI Generation ID: {gen_id}",
            "• Classification: CONFIDENTIAL — For internal use only",
        ]),
    ]

    row = 5
    for section_title, items in meth_sections:
        ws_meth.set_row(row, 26)
        ws_meth.merge_range(row, 2, row, 13, f"  {section_title}", fmt["insight_head"])
        row += 1
        for item in items:
            ws_meth.set_row(row, 20)
            ws_meth.merge_range(row, 2, row, 13, item, fmt["insight_body"])
            row += 1
        row += 1

    add_page_footer(ws_meth, 14, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 15: DATA DICTIONARY
    # ─────────────────────────────────────────────────────────────────────────
    ws_dict = wb.add_worksheet("15 Data Dictionary")
    ws_dict.hide_gridlines(2)
    add_sidebar(ws_dict, "15 Data Dictionary")
    add_page_header(ws_dict, "Data Dictionary",
                    "Column Schema — Data Types, Statistics & Business Definitions")

    ws_dict.set_column("B:B", 2)
    ws_dict.set_column("C:C", 28)   # column name
    ws_dict.set_column("D:D", 14)   # data type
    ws_dict.set_column("E:E", 10)   # null %
    ws_dict.set_column("F:F", 14)   # unique count
    ws_dict.set_column("G:H", 18)   # min / max
    ws_dict.set_column("I:K", 22)   # business definition

    ws_dict.set_row(5, 24)
    dict_headers = ["Column Name", "Data Type", "Null %", "Unique Values", "Min", "Max", "Business Definition"]
    for ci, h in enumerate(dict_headers):
        ws_dict.write(5, 2 + ci, h, fmt["table_header"])

    for ri, col in enumerate(df_clean.columns):
        row = 6 + ri
        ws_dict.set_row(row, 22)
        is_alt = ri % 2 == 0
        bg = C_ACCENT_BG if is_alt else C_WHITE
        cell_f = F(font_size=10, bg_color=bg, border=1, valign="vcenter", indent=1)
        num_f  = F(font_size=10, bg_color=bg, border=1, valign="vcenter",
                   align="center", num_format="#,##0.00")

        dtype_str = str(df_clean[col].dtype)
        null_pct   = df_raw[col].isnull().mean() * 100 if col in df_raw.columns else 0.0
        uniques    = df_clean[col].nunique()
        col_min    = df_clean[col].min() if df_clean[col].dtype != object else "—"
        col_max    = df_clean[col].max() if df_clean[col].dtype != object else "—"
        biz_def    = f"Auto-detected: {dtype_str} field with {uniques} unique values."

        ws_dict.write(row, 2, str(col), F(bold=True, font_size=10, bg_color=bg,
                                          border=1, valign="vcenter", indent=1,
                                          font_color=C_DARK))
        ws_dict.write(row, 3, dtype_str, cell_f)
        ws_dict.write(row, 4, round(null_pct, 1), num_f)
        ws_dict.write(row, 5, uniques, num_f)
        try:
            ws_dict.write(row, 6, float(col_min), num_f)
            ws_dict.write(row, 7, float(col_max), num_f)
        except (TypeError, ValueError):
            ws_dict.write(row, 6, str(col_min), cell_f)
            ws_dict.write(row, 7, str(col_max), cell_f)
        ws_dict.merge_range(row, 8, row, 10, biz_def, cell_f)

    add_page_footer(ws_dict, 15, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # DOMAIN-ADAPTIVE EXTRA SHEETS
    # ─────────────────────────────────────────────────────────────────────────
    for sheet_num, (xls_name, friendly_name) in enumerate(extra_sheets):
        ws_extra = wb.add_worksheet(xls_name)
        ws_extra.hide_gridlines(2)
        add_sidebar(ws_extra, xls_name)
        add_page_header(ws_extra, friendly_name,
                        f"Domain-Specific Analysis — {domain}")
        ws_extra.set_column("B:B", 2)
        ws_extra.set_column("C:N", 14)

        try:
            if "Time" in friendly_name and date_col and date_col in df_clean.columns:
                # Time Analysis — monthly breakdown
                import pandas as pd
                df_temp = df_clean.copy()
                df_temp["_month"] = pd.to_datetime(df_temp[date_col], errors="coerce").dt.to_period("M")
                if primary_metric and primary_metric in df_temp.columns:
                    monthly = df_temp.groupby("_month")[primary_metric].sum().reset_index()
                    monthly.columns = ["Month", primary_metric]
                    ws_extra.set_row(5, 24)
                    ws_extra.write(5, 2, "Month", fmt["table_header"])
                    ws_extra.write(5, 3, primary_metric, fmt["table_header"])
                    ws_extra.write(5, 4, "MoM Change", fmt["table_header"])
                    for ri, row_data in monthly.iterrows():
                        r = 6 + int(ri)
                        ws_extra.set_row(r, 20)
                        is_alt = int(ri) % 2 == 0
                        bg = C_ACCENT_BG if is_alt else C_WHITE
                        ws_extra.write(r, 2, str(row_data["Month"]),
                                       F(font_size=10, bg_color=bg, border=1, valign="vcenter", indent=1))
                        ws_extra.write(r, 3, round(float(row_data[primary_metric]), 2),
                                       F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00", valign="vcenter"))
                        if ri > 0:
                            prev_val = float(monthly.iloc[int(ri)-1][primary_metric])
                            curr_val = float(row_data[primary_metric])
                            pct_chg = ((curr_val - prev_val) / prev_val * 100) if prev_val != 0 else 0
                            clr = C_PRIMARY if pct_chg >= 0 else C_DANGER
                            ws_extra.write(r, 4, f"{pct_chg:+.1f}%",
                                           F(font_size=10, bg_color=bg, border=1,
                                             font_color=clr, bold=True, align="center", valign="vcenter"))
                        else:
                            ws_extra.write(r, 4, "—",
                                           F(font_size=10, bg_color=bg, border=1, align="center", valign="vcenter"))

            elif "Correlation" in friendly_name and len(numeric_cols) >= 3:
                # Correlation Analysis
                corr_cols = blueprint.get("correlation_columns", numeric_cols[:6])
                corr_cols = [c for c in corr_cols if c in df_clean.columns]
                if len(corr_cols) >= 2:
                    corr_matrix = df_clean[corr_cols].corr()
                    ws_extra.set_row(5, 24)
                    ws_extra.write(5, 2, "Metric", fmt["table_header"])
                    for ci, col_name in enumerate(corr_cols):
                        ws_extra.write(5, 3 + ci, col_name, fmt["table_header"])
                        ws_extra.set_column(3 + ci, 3 + ci, 18)

                    for ri, row_col in enumerate(corr_cols):
                        r = 6 + ri
                        ws_extra.set_row(r, 22)
                        ws_extra.write(r, 2, row_col,
                                       F(bold=True, font_size=10, border=1, valign="vcenter",
                                         bg_color=C_MINT, font_color=C_DARK, indent=1))
                        for ci, col_name in enumerate(corr_cols):
                            val = corr_matrix.loc[row_col, col_name]
                            # Color by correlation strength
                            if abs(val) >= 0.7:
                                bg = C_PRIMARY if val > 0 else C_DANGER
                                fc = C_WHITE
                            elif abs(val) >= 0.4:
                                bg = "#a7f3d0" if val > 0 else "#fca5a5"
                                fc = C_CHARCOAL
                            else:
                                bg = C_WHITE
                                fc = C_SLATE_600
                            ws_extra.write(r, 3 + ci, round(val, 3),
                                           F(font_size=10, border=1, align="center",
                                             valign="vcenter", bg_color=bg, font_color=fc,
                                             bold=abs(val) >= 0.7, num_format="0.000"))
                else:
                    ws_extra.write(5, 2, "Insufficient numeric columns for correlation analysis.", fmt["body"])

            elif groupby_dim and groupby_dim in df_clean.columns and primary_metric and primary_metric in df_clean.columns:
                # Generic groupby analysis (Revenue, Customer, Product, Regional)
                grouped = (
                    df_clean.groupby(groupby_dim)[primary_metric]
                    .agg(["sum", "mean", "count"])
                    .reset_index()
                    .sort_values("sum", ascending=False)
                    .head(30)
                )
                ws_extra.set_row(5, 24)
                ws_extra.write(5, 2, groupby_dim, fmt["table_header"])
                ws_extra.write(5, 3, f"Total {primary_metric}", fmt["table_header"])
                ws_extra.write(5, 4, f"Avg {primary_metric}", fmt["table_header"])
                ws_extra.write(5, 5, "Count", fmt["table_header"])
                ws_extra.write(5, 6, "% of Total", fmt["table_header"])
                total_sum = grouped["sum"].sum()
                for ri, row_data in grouped.iterrows():
                    r = 6 + list(grouped.index).index(ri)
                    ws_extra.set_row(r, 22)
                    is_alt = r % 2 == 0
                    bg = C_ACCENT_BG if is_alt else C_WHITE
                    pct = row_data["sum"] / total_sum if total_sum else 0
                    ws_extra.write(r, 2, str(row_data[groupby_dim]),
                                   F(font_size=10, bg_color=bg, border=1, valign="vcenter", indent=1))
                    ws_extra.write(r, 3, round(float(row_data["sum"]), 2),
                                   F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00", valign="vcenter"))
                    ws_extra.write(r, 4, round(float(row_data["mean"]), 2),
                                   F(font_size=10, bg_color=bg, border=1, num_format="#,##0.00", valign="vcenter"))
                    ws_extra.write(r, 5, int(row_data["count"]),
                                   F(font_size=10, bg_color=bg, border=1, align="center", valign="vcenter"))
                    ws_extra.write(r, 6, pct,
                                   F(font_size=10, bg_color=bg, border=1, num_format="0.0%",
                                     align="center", valign="vcenter"))
            else:
                ws_extra.write(5, 2, f"Analysis for '{friendly_name}' requires specific column types not detected in this dataset.", fmt["body"])

        except Exception as e:
            ws_extra.write(5, 2, f"Analysis error: {str(e)}", fmt["body"])
            logger.warning(f"Extra sheet '{xls_name}' failed: {e}")

        add_page_footer(ws_extra, 15 + sheet_num + 1, len(SHEETS))

    # ─────────────────────────────────────────────────────────────────────────
    # WORKBOOK-LEVEL PROPERTIES
    # ─────────────────────────────────────────────────────────────────────────
    wb.set_properties({
        "title":    report.title,
        "subject":  f"{domain} — Executive BI Report",
        "author":   "Data Insight AI Intelligence Engine",
        "company":  "Data Insight",
        "comments": f"Generated by Data Insight AI on {now_str}. AI Generation ID: {gen_id}.",
        "keywords": f"BI, Analytics, {domain}, Executive Report, Data Insight AI",
    })
