"""AI-Powered 15-Tab Excel Generation Celery Task.

Generates a professionally formatted 15-tab .xlsx file from a dataset using
AdvancedExcelBuilder + XlsxWriter. Every tab is driven by real dataset data.
Zero fake data policy enforced.
"""
from __future__ import annotations
import asyncio
import io
import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict
from loguru import logger
from celery import shared_task

@shared_task(bind=True, name="dataset.generate_excel", max_retries=2, default_retry_delay=60)
def generate_ai_excel_task(self, dataset_id: str, user_id: str):
    """Celery task: generate real AI Excel file from dataset."""
    import asyncio
    # Must create fresh loop each time
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_generate_ai_excel_safe(self, dataset_id, user_id))
    except Exception as exc:
        raise self.retry(exc=exc)
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except Exception:
            pass
        loop.close()


def _build_excel_workbook(df_cleaned, profile: Dict[str, Any], dataset_name: str) -> bytes:
    import xlsxwriter
    import math

    buf = io.BytesIO()
    workbook = xlsxwriter.Workbook(buf, {'in_memory': True})
    
    # Formats
    header_format_green = workbook.add_format({
        'bg_color': '#1E293B', 'font_color': '#FFFFFF', 'bold': True, 'font_size': 12, 'align': 'center', 'valign': 'vcenter'
    })
    row_even_format_green = workbook.add_format({'bg_color': '#F0FDF4'})
    row_odd_format_green = workbook.add_format({'bg_color': '#FFFFFF'})
    num_format_even_green = workbook.add_format({'bg_color': '#F0FDF4', 'num_format': '#,##0.00'})
    num_format_odd_green = workbook.add_format({'bg_color': '#FFFFFF', 'num_format': '#,##0.00'})
    # Sticky sidebar column A — visually distinct emerald stripe
    sidebar_even_fmt = workbook.add_format({
        'bg_color': '#ECFDF5', 'bold': True, 'font_color': '#065F46',
        'left': 2, 'left_color': '#10B981', 'right': 1, 'right_color': '#D1FAE5'
    })
    sidebar_odd_fmt = workbook.add_format({
        'bg_color': '#D1FAE5', 'bold': True, 'font_color': '#065F46',
        'left': 2, 'left_color': '#10B981', 'right': 1, 'right_color': '#A7F3D0'
    })
    sidebar_num_even_fmt = workbook.add_format({
        'bg_color': '#ECFDF5', 'bold': True, 'font_color': '#065F46',
        'num_format': '#,##0.00', 'left': 2, 'left_color': '#10B981'
    })
    sidebar_num_odd_fmt = workbook.add_format({
        'bg_color': '#D1FAE5', 'bold': True, 'font_color': '#065F46',
        'num_format': '#,##0.00', 'left': 2, 'left_color': '#10B981'
    })

    # TAB 1: Clean Data
    ws1 = workbook.add_worksheet("📊 Clean Data")
    ws1.set_tab_color('#10B981')
    # freeze_panes(1, 1) locks both the top header row AND column A as a sticky sidebar
    ws1.freeze_panes(1, 1)
    ws1.set_row(0, 25)

    headers = df_cleaned.columns
    for col_idx, header in enumerate(headers):
        ws1.write(0, col_idx, header, header_format_green)
        ws1.set_column(col_idx, col_idx, min(60, len(str(header)) + 4))

    # Take first 10000 rows max
    max_rows = min(10000, len(df_cleaned))
    df_head = df_cleaned.head(max_rows)

    for row_idx, row in enumerate(df_head.iter_rows(named=True)):
        xl_row = row_idx + 1
        is_even = xl_row % 2 == 0
        fmt = row_even_format_green if is_even else row_odd_format_green
        num_fmt = num_format_even_green if is_even else num_format_odd_green
        for col_idx, col in enumerate(headers):
            val = row[col]
            # Column A (index 0) gets the sticky emerald sidebar style
            if col_idx == 0:
                cell_fmt = sidebar_even_fmt if is_even else sidebar_odd_fmt
                cell_num_fmt = sidebar_num_even_fmt if is_even else sidebar_num_odd_fmt
            else:
                cell_fmt = fmt
                cell_num_fmt = num_fmt
            if val is None:
                ws1.write(xl_row, col_idx, "", cell_fmt)
            elif isinstance(val, (int, float)):
                if math.isnan(val) or math.isinf(val):
                    ws1.write(xl_row, col_idx, str(val), cell_fmt)
                else:
                    ws1.write_number(xl_row, col_idx, val, cell_num_fmt)
            else:
                ws1.write(xl_row, col_idx, str(val), cell_fmt)

    # Auto-size column widths based on real content length
    for col_idx, col in enumerate(headers):
        max_len = len(str(col))
        for row in df_head.iter_rows(named=True):
            max_len = max(max_len, len(str(row[col])))
        ws1.set_column(col_idx, col_idx, min(60, max_len + 4))

    # TAB 2: Executive Summary
    ws2 = workbook.add_worksheet("📋 Executive Summary")
    ws2.set_tab_color('#6366F1')
    
    title_fmt = workbook.add_format({'bold': True, 'font_size': 16})
    section_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'bg_color': '#E0E7FF'})
    kpi_label_fmt = workbook.add_format({'bold': True})
    kpi_val_fmt = workbook.add_format({'align': 'left'})
    
    ws2.write(0, 0, f"Dataset: {dataset_name}", title_fmt)
    ws2.set_column(0, 0, 30)
    ws2.set_column(1, 1, 20)
    
    ws2.write(2, 0, "Dataset Overview", section_fmt)
    ws2.write(2, 1, "", section_fmt)
    ws2.write(3, 0, "Total Rows", kpi_label_fmt)
    ws2.write(3, 1, profile.get('row_count', 0), kpi_val_fmt)
    ws2.write(4, 0, "Total Columns", kpi_label_fmt)
    ws2.write(4, 1, profile.get('column_count', 0), kpi_val_fmt)
    
    ws2.write(6, 0, "Data Quality Metrics", section_fmt)
    ws2.write(6, 1, "", section_fmt)
    ws2.write(7, 0, "Quality Score", kpi_label_fmt)
    ws2.write(7, 1, profile.get('quality_score', 0), kpi_val_fmt)
    ws2.write(8, 0, "Quality Grade", kpi_label_fmt)
    ws2.write(8, 1, profile.get('quality_grade', 'N/A'), kpi_val_fmt)
    ws2.write(9, 0, "Duplicate Rows", kpi_label_fmt)
    ws2.write(9, 1, profile.get('duplicate_rows', 0), kpi_val_fmt)
    ws2.write(10, 0, "Missing Data %", kpi_label_fmt)
    ws2.write(10, 1, f"{profile.get('missing_cells_pct', 0):.2f}%", kpi_val_fmt)
    
    # TAB 3: Column Profiles
    ws3 = workbook.add_worksheet("🔬 Column Profiles")
    ws3.set_tab_color('#F59E0B')
    # freeze_panes(1,1): sticky header row + sticky Column Name sidebar
    ws3.freeze_panes(1, 1)
    
    ws3_header_fmt = workbook.add_format({'bg_color': '#1E293B', 'font_color': '#FFFFFF', 'bold': True})
    ws3_headers = ["Column Name", "Data Type", "Null Count", "Null %", "Unique Count", "Unique %", "Min", "Max", "Mean", "Std Dev", "Outlier Count"]
    for i, h in enumerate(ws3_headers):
        ws3.write(0, i, h, ws3_header_fmt)
        ws3.set_column(i, i, 15)
        
    ws3.set_column(0, 0, 25)
    
    row_idx = 1
    for col_name, col_data in profile.get('columns', {}).items():
        ws3.write(row_idx, 0, col_name)
        ws3.write(row_idx, 1, col_data.get('dtype', 'N/A'))
        ws3.write(row_idx, 2, col_data.get('null_count', 0))
        ws3.write(row_idx, 3, f"{col_data.get('null_pct', 0):.2f}%")
        ws3.write(row_idx, 4, col_data.get('unique_count', 0))
        ws3.write(row_idx, 5, f"{col_data.get('unique_pct', 0):.2f}%")
        
        if col_data.get('type') == 'numeric':
            ws3.write(row_idx, 6, col_data.get('min', 'N/A'))
            ws3.write(row_idx, 7, col_data.get('max', 'N/A'))
            ws3.write(row_idx, 8, col_data.get('mean', 'N/A'))
            ws3.write(row_idx, 9, col_data.get('std', 'N/A'))
            ws3.write(row_idx, 10, col_data.get('outliers', 0))
        else:
            for i in range(6, 11):
                ws3.write(row_idx, i, "N/A")
        row_idx += 1
        
    # TAB 4: Quality Report
    ws4 = workbook.add_worksheet("✅ Quality Report")
    ws4.set_tab_color('#14B8A6')
    
    ws4_header_fmt = workbook.add_format({'bg_color': '#1E293B', 'font_color': '#FFFFFF', 'bold': True})
    ws4_pass_fmt = workbook.add_format({'bg_color': '#D1FAE5'})
    ws4_fail_fmt = workbook.add_format({'bg_color': '#FEF3C7'})
    
    ws4_headers = ["Check Name", "Status", "Value", "Recommendation"]
    for i, h in enumerate(ws4_headers):
        ws4.write(0, i, h, ws4_header_fmt)
        ws4.set_column(i, i, 20)
    ws4.set_column(3, 3, 40)
    
    checks = []
    
    dup_rows = profile.get('duplicate_rows', 0)
    checks.append({
        "name": "No duplicates",
        "status": "PASS" if dup_rows == 0 else "FAIL",
        "value": f"{dup_rows} duplicates",
        "rec": "Good" if dup_rows == 0 else "Consider removing duplicate rows"
    })
    
    miss_pct = profile.get('missing_cells_pct', 0)
    checks.append({
        "name": "Low missingness (<5%)",
        "status": "PASS" if miss_pct < 5 else "FAIL",
        "value": f"{miss_pct:.2f}%",
        "rec": "Good" if miss_pct < 5 else "Investigate missing values"
    })
    
    high_null_cols = [c for c, d in profile.get('columns', {}).items() if d.get('null_pct', 0) > 50]
    checks.append({
        "name": "No high-null columns",
        "status": "PASS" if not high_null_cols else "FAIL",
        "value": f"{len(high_null_cols)} columns",
        "rec": "Good" if not high_null_cols else "Consider dropping columns with >50% missing data"
    })
    
    const_cols = [c for c, d in profile.get('columns', {}).items() if d.get('unique_count', 0) == 1]
    checks.append({
        "name": "No constant columns",
        "status": "PASS" if not const_cols else "FAIL",
        "value": f"{len(const_cols)} columns",
        "rec": "Good" if not const_cols else "Consider dropping constant columns"
    })
    
    outliers_ratio = profile.get('outliers_pct', 0)
    checks.append({
        "name": "Outlier ratio <5%",
        "status": "PASS" if outliers_ratio < 5 else "FAIL",
        "value": f"{outliers_ratio:.2f}%",
        "rec": "Good" if outliers_ratio < 5 else "Review outliers in numeric columns"
    })
    
    for i, check in enumerate(checks):
        fmt = ws4_pass_fmt if check['status'] == 'PASS' else ws4_fail_fmt
        ws4.write(i+1, 0, check['name'], fmt)
        ws4.write(i+1, 1, check['status'], fmt)
        ws4.write(i+1, 2, check['value'], fmt)
        ws4.write(i+1, 3, check['rec'], fmt)

    workbook.close()
    return buf.getvalue()



async def _get_ai_content(df, profile: Dict[str, Any], dataset_name: str) -> Dict[str, Any]:
    """Call Groq AI to generate real insights from dataset statistics. Returns structured dict."""
    empty = {"executive_summary": "", "insights": [], "recommendations": [], "anomaly_summary": "", "column_descriptions": {}}
    try:
        import polars as pl
        from app.core.config import settings
        from app.services.ai.router import LLMRouter

        ov = profile.get("overview", {})
        row_count   = ov.get("row_count") or len(df)
        col_count   = ov.get("column_count") or len(df.columns)
        quality     = ov.get("quality_score") or profile.get("quality_score") or 0
        missing_pct = ov.get("missing_cells_pct") or profile.get("missing_cells_pct") or 0
        dup_rows    = ov.get("duplicate_rows") or profile.get("duplicate_rows") or 0

        # Build per-column stats summary (real data, no fake values)
        col_summary_lines = []
        for col in df.columns[:20]:  # limit to 20 cols for prompt size
            dtype = str(df[col].dtype)
            nc    = int(df[col].null_count())
            np_   = round(nc / row_count * 100, 1) if row_count else 0
            uc    = int(df[col].n_unique())
            extras = ""
            num_types = (pl.Float32, pl.Float64, pl.Int8, pl.Int16, pl.Int32, pl.Int64, pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64)
            if df[col].dtype in num_types:
                s = df[col].drop_nulls()
                if len(s):
                    extras = f" mean={round(float(s.mean()),2)} min={round(float(s.min()),2)} max={round(float(s.max()),2)}"
            elif df[col].dtype == pl.Utf8 and uc <= 20:
                top = df[col].drop_nulls().value_counts().sort("count", descending=True).head(3)
                vals = [str(r[0]) for r in top.iter_rows()]
                extras = f" top_values=[{', '.join(vals)}]"
            col_summary_lines.append(f"  - {col} ({dtype}): null={np_}% unique={uc}{extras}")

        col_summary = "\n".join(col_summary_lines)

        prompt = f"""You are a senior data analyst. Analyze this dataset and return ONLY valid JSON.

Dataset: {dataset_name}
Rows: {row_count:,}  |  Columns: {col_count}  |  Quality Score: {quality:.1f}/100
Missing Data: {missing_pct:.1f}%  |  Duplicate Rows: {dup_rows}

Column Statistics:
{col_summary}

Return ONLY this exact JSON structure (no markdown, no explanation):
{{
  "executive_summary": "2-3 sentence business overview of this dataset",
  "insights": [
    "First key business insight from the data",
    "Second key business insight",
    "Third key business insight"
  ],
  "recommendations": [
    "First actionable recommendation",
    "Second actionable recommendation",
    "Third actionable recommendation"
  ],
  "anomaly_summary": "Brief description of any data quality issues or outliers detected",
  "column_descriptions": {{
    "{df.columns[0] if df.columns else 'col'}": "Plain English description of what this column represents"
  }}
}}

Write column_descriptions for ALL {col_count} columns. Return ONLY valid JSON."""

        router = LLMRouter(
            groq_api_key=settings.GROQ_API_KEY,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
        response = await router.generate(
            prompt=prompt,
            task_type="deep_report",
            temperature=0.2,
            max_tokens=3000,
        )
        text = response.strip()

        # Strip markdown fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)

        # Extract first JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            logger.warning("[AI Excel] No JSON found in AI response — using empty content")
            return empty

        data = json.loads(match.group())

        # Validate structure
        return {
            "executive_summary": str(data.get("executive_summary", "")),
            "insights": [str(x) for x in data.get("insights", []) if x][:5],
            "recommendations": [str(x) for x in data.get("recommendations", []) if x][:5],
            "anomaly_summary": str(data.get("anomaly_summary", "")),
            "column_descriptions": {k: str(v) for k, v in data.get("column_descriptions", {}).items()},
        }

    except Exception as exc:
        logger.warning(f"[AI Excel] AI content generation failed (non-critical): {exc}")
        return empty


async def _generate_ai_excel_safe(task, dataset_id: str, user_id: str):
    import httpx
    from app.db.session import AsyncSessionLocal
    from app.repositories.dataset import DatasetRepository
    from app.models.dataset import DatasetStatus
    from app.core.storage import get_signed_url, DATASETS_BUCKET, is_local_storage, LOCAL_UPLOADS_DIR
    from app.services.ingestion.polars_engine import PolarsEngine
    from app.services.ingestion.cleaner import DatasetCleaner
    from app.services.ingestion.profiler import DataProfiler
    from app.core.websockets import manager as ws_manager

    try:
        async with AsyncSessionLocal() as session:
            ds_repo = DatasetRepository(session)
            dataset = await ds_repo.get_by_id(uuid.UUID(dataset_id))
            if not dataset:
                logger.error(f"Dataset {dataset_id} not found")
                return

            try:
                # 1. Download File
                if is_local_storage():
                    local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / dataset.file_url
                    file_bytes = local_path.read_bytes()
                else:
                    signed_url = await get_signed_url(DATASETS_BUCKET, dataset.file_url, expires_in=300)
                    async with httpx.AsyncClient() as client:
                        response = await client.get(signed_url)
                        file_bytes = response.content

                # 2. Parse using PolarsEngine
                ext = dataset.file_type.value if hasattr(dataset.file_type, "value") else str(dataset.file_type)
                ext = ext.lower().strip().lstrip(".")
                df = PolarsEngine.load_from_bytes(file_bytes=file_bytes, file_type=ext)

                # 3. Clean
                df_cleaned, _ = DatasetCleaner.clean_dataframe(df)
                
                # 4. Profile
                profile = DataProfiler.profile_dataframe(df_cleaned)

                # 5. Get AI Insights (Groq) then build 15-tab Excel
                ai_content = await _get_ai_content(df_cleaned, profile, dataset.name)
                from app.services.ingestion.excel_builder import AdvancedExcelBuilder
                excel_bytes = AdvancedExcelBuilder(
                    df=df_cleaned,
                    profile=profile,
                    dataset_name=dataset.name,
                    ai_content=ai_content,
                ).build()

                # 6. Upload
                new_filename = f"ai_excel_{dataset_id}.xlsx"
                if is_local_storage():
                    out_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / new_filename
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    out_path.write_bytes(excel_bytes)
                    new_url = new_filename
                else:
                    from app.core.storage import _client
                    client = _client()
                    client.storage.from_(DATASETS_BUCKET).upload(
                        path=new_filename,
                        file=excel_bytes,
                        file_options={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "upsert": "true"}
                    )
                    new_url = new_filename

                # 7. Update Dataset
                dataset.excel_url = new_url
                dataset.status = DatasetStatus.ready
                await session.commit()
                
                # 8. Notify WebSocket
                try:
                    await ws_manager.publish_tenant_event(
                        str(dataset.tenant_id),
                        "dataset_excel_ready",
                        {"dataset_id": str(dataset.id)}
                    )
                except Exception as e:
                    pass

            except Exception as exc:
                import celery.exceptions
                logger.exception(f"Generate AI Excel failed: {exc}")
                try:
                    dataset.status = DatasetStatus.error
                    dataset.error_message = str(exc)[:500]
                    await session.commit()
                except Exception:
                    pass
                # Let Celery handle the retry — don't swallow it
                raise task.retry(exc=exc)

    except celery.exceptions.Retry:
        # Re-raise Celery Retry so it's properly handled
        raise
    except Exception as exc:
        logger.exception(f"Unhandled error in generate_ai_excel_task: {exc}")
