import uuid
import json
from typing import Any, AsyncIterator
import polars as pl
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.ai_service import AIService
from app.services.dataset import DatasetService
from app.services.ingestion.duckdb_engine import DuckDBEngine


def _col_index_to_excel_letter(idx: int) -> str:
    result = ""
    idx += 1
    while idx > 0:
        idx, remainder = divmod(idx - 1, 26)
        result = chr(65 + remainder) + result
    return result


class ExcelAIService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ai_service = AIService(session)
        self.dataset_service = DatasetService(session)

    async def _get_dataset_and_df(self, dataset_id: uuid.UUID, user: User):
        dataset = await self.dataset_service.get_dataset(dataset_id, user)
        df = await self.dataset_service.load_dataframe(dataset)
        return dataset, df

    def _build_smart_profile(self, df, workbook_context=None, selected_data=None):
        NUMERIC_DTYPES = {'Int8','Int16','Int32','Int64','UInt8','UInt16','UInt32','UInt64','Float32','Float64'}
        DATE_DTYPES = {'Date','Datetime','Time','Duration'}
        profile = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "all_columns": [],
            "numeric_columns": [],
            "text_columns": [],
            "date_columns": [],
            "id_columns": [],           # Columns that are IDs/unique keys — excluded from chart categories
            "excel_col_map": {},
            "active_sheet": (workbook_context or {}).get("activeSheetName", ""),
            "selected_range": None,
            "selected_headers": None,
        }
        for i, col in enumerate(df.columns):
            letter = _col_index_to_excel_letter(i)
            profile["excel_col_map"][col] = letter
            dtype_str = str(df.schema[col])
            col_info = {"name": col, "excel_col": letter, "dtype": dtype_str}
            if dtype_str in NUMERIC_DTYPES:
                try:
                    stats = DuckDBEngine.execute_query(df, f'SELECT MIN("{col}") as min_val, MAX("{col}") as max_val, ROUND(AVG("{col}"), 2) as avg_val FROM dataset', "dataset", 1)
                    if stats["rows"]:
                        row = stats["rows"][0]
                        col_info["stats"] = {"min": row[0], "max": row[1], "avg": row[2]}
                except Exception:
                    pass
                profile["numeric_columns"].append(col_info)
            elif any(d in dtype_str for d in DATE_DTYPES):
                try:
                    stats = DuckDBEngine.execute_query(df, f'SELECT MIN("{col}") as min_date, MAX("{col}") as max_date FROM dataset', "dataset", 1)
                    if stats["rows"]:
                        row = stats["rows"][0]
                        col_info["stats"] = {"min_date": str(row[0]), "max_date": str(row[1])}
                except Exception:
                    pass
                profile["date_columns"].append(col_info)
            else:
                # Count unique values to detect ID columns
                try:
                    uniq_r = DuckDBEngine.execute_query(df, f'SELECT COUNT(DISTINCT "{col}") as uniq FROM dataset', "dataset", 1)
                    uniq_count = uniq_r["rows"][0][0] if uniq_r["rows"] else 0
                    col_info["unique_count"] = uniq_count
                    total_rows = profile["row_count"]

                    # Detect ID column: unique == total rows OR column name looks like an ID
                    col_lower = col.lower()
                    is_id = (
                        (total_rows > 10 and uniq_count == total_rows) or
                        any(col_lower.endswith(s) for s in ["id", "_id", "uuid", "key", "code", "no", "number", "ref", "num"]) or
                        col_lower in ["id", "uuid", "key", "code"]
                    )
                    if is_id:
                        col_info["is_id"] = True
                        profile["id_columns"].append(col_info)
                        profile["all_columns"].append(col_info)
                        continue  # Skip — don't add to text_columns

                    # Get top values for real category columns
                    top_vals = DuckDBEngine.execute_query(df, f'SELECT "{col}", COUNT(*) as n FROM dataset WHERE "{col}" IS NOT NULL GROUP BY "{col}" ORDER BY n DESC LIMIT 5', "dataset", 5)
                    if top_vals["rows"]:
                        col_info["top_values"] = [r[0] for r in top_vals["rows"]]
                except Exception:
                    pass
                profile["text_columns"].append(col_info)
            profile["all_columns"].append(col_info)
        if selected_data:
            profile["selected_range"] = selected_data.get("address", "")
            profile["selected_headers"] = selected_data.get("headers", [])
            profile["selected_rows_sample"] = selected_data.get("rows", [])[:3]
        return profile

    def _profile_to_ctx(self, profile, dataset_name):
        lines = [
            f"Dataset: {dataset_name}",
            f"Total rows: {profile['row_count']:,} | Total columns: {profile['column_count']}",
        ]
        if profile.get("id_columns"):
            id_names = [c["name"] for c in profile["id_columns"]]
            lines.append(f"⚠ ID/unique columns (NEVER use as chart category or group-by): {', '.join(id_names)}")
        if profile["date_columns"]:
            lines.append(f"Date columns: {', '.join(c['name'] + '(' + c['excel_col'] + ')' for c in profile['date_columns'])}")
        if profile["numeric_columns"]:
            lines.append("Numeric columns (use for values/measures):")
            for c in profile["numeric_columns"]:
                s = c.get("stats", {})
                stat_str = f" [min={s.get('min')}, max={s.get('max')}, avg={s.get('avg')}]" if s else ""
                lines.append(f"  {c['excel_col']}={c['name']}{stat_str}")
        if profile["text_columns"]:
            lines.append("Category columns (safe to use for grouping/charts):")
            for c in profile["text_columns"]:
                top = c.get("top_values", [])
                uniq = c.get("unique_count", "?")
                lines.append(f"  {c['excel_col']}={c['name']} ({uniq} unique values, top: {top[:3]})")
        if profile.get("selected_range"):
            lines.append(f"User selected: {profile['selected_range']} headers={profile['selected_headers']}")
        if profile.get("active_sheet"):
            lines.append(f"Active sheet: {profile['active_sheet']}")
        return "\n".join(lines)

    async def chat(self, dataset_id, question, workbook_context, user):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context)
        ctx = self._profile_to_ctx(profile, dataset.name)
        prompt = f"{ctx}\n\nExcel headers visible: {(workbook_context or {}).get('columnHeaders', [])}\n\nUser Question: {question}\n\nAnswer with REAL numbers from the stats. Return JSON: {{\"answer\": \"...\", \"suggested_actions\": [...]}}"
        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        try:
            if "`json" in content: content = content.split("`json")[1].split("`")[0].strip()
            elif "`" in content: content = content.split("`")[1].split("`")[0].strip()
            parsed = json.loads(content)
            return {"answer": parsed.get("answer", content), "suggested_actions": parsed.get("suggested_actions", [])}
        except json.JSONDecodeError:
            return {"answer": content, "suggested_actions": []}

    async def explain(self, dataset_id, selected_data, user):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, selected_data=selected_data)
        ctx = self._profile_to_ctx(profile, dataset.name)
        sel_headers = selected_data.get("headers", [])
        sel_rows = selected_data.get("rows", [])[:10]
        address = selected_data.get("address", "")
        prompt = f"{ctx}\n\nUser selected {address}: headers={sel_headers}\nSample rows: {json.dumps(sel_rows)}\n\nExplain this selection in context of full dataset with REAL numbers.\nReturn JSON: {{\"explanation\": \"...\", \"key_insights\": [...]}}"
        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        try:
            if "`json" in content: content = content.split("`json")[1].split("`")[0].strip()
            elif "`" in content: content = content.split("`")[1].split("`")[0].strip()
            parsed = json.loads(content)
            return {"explanation": parsed.get("explanation", content), "key_insights": parsed.get("key_insights", [])}
        except json.JSONDecodeError:
            return {"explanation": content, "key_insights": []}

    async def generate_chart_action(self, dataset_id, question, user, workbook_context=None, selected_data=None):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context, selected_data)
        ctx = self._profile_to_ctx(profile, dataset.name)

        active_sheet = profile.get("active_sheet") or "Sheet1"
        col_map = "\n".join([f'  {c["excel_col"]}="{c["name"]}" ({c["dtype"]})' for c in profile["all_columns"]])
        num_cols = [c["name"] for c in profile["numeric_columns"]]
        cat_cols = [c["name"] for c in profile["text_columns"]]
        date_cols = [c["name"] for c in profile["date_columns"]]
        q_lower = question.lower()

        # ── Deterministic chart type detection from keywords ──────────────────
        chart_type = None
        if any(w in q_lower for w in ["donut", "doughnut"]):
            chart_type = "donut"
        elif any(w in q_lower for w in ["pie", "proportion", "share", "breakdown", "percentage of", "% of"]):
            chart_type = "pie"
        elif any(w in q_lower for w in ["scatter", "correlation", "vs ", " vs", "relationship between", "x vs y"]):
            chart_type = "scatter"
        elif any(w in q_lower for w in ["histogram", "distribution", "frequency", "how many values", "buckets", "bins"]):
            chart_type = "histogram"
        elif any(w in q_lower for w in ["stacked bar", "stacked horizontal"]):
            chart_type = "stacked_bar"
        elif any(w in q_lower for w in ["stacked column", "stacked vertical", "100%", "stacked"]):
            chart_type = "stacked_column"
        elif any(w in q_lower for w in ["area", "cumulative", "running total", "filled"]):
            chart_type = "area"
        elif any(w in q_lower for w in ["line", "trend", "over time", "timeline", "by month", "by year", "by day", "by week"]):
            chart_type = "line"
        elif any(w in q_lower for w in ["column", "vertical bar", "compare vertically"]):
            chart_type = "column"
        elif any(w in q_lower for w in ["bar", "horizontal"]):
            chart_type = "bar"

        # ── Ask AI for column selection + confirm chart type ──────────────────
        prompt = f"""{ctx}

Column map:
{col_map}

Numeric columns: {num_cols}
Category columns: {cat_cols}
Date columns: {date_cols}

User request: "{question}"

Available chart types: bar, column, line, area, pie, donut, scatter, histogram, stacked_bar, stacked_column

RULES:
- scatter: pick x_col (numeric) and y_col (numeric) — shows correlation
- histogram: pick value_col (numeric) — shows frequency distribution
- stacked_bar/stacked_column: pick category_col (text), stack_col (text), value_col (numeric)
- pie/donut: pick category_col (text) — shows proportions
- line/area: pick category_col (date or ordered category) and value_col (numeric)
- bar/column: pick category_col (text) and value_col (numeric) with aggregation

aggregation: AVG | SUM | COUNT | MAX | MIN

Return ONLY valid JSON:
{{"chart_type":"{chart_type or 'bar'}","category_col":"exact name","value_col":"exact name","x_col":"exact name for scatter","y_col":"exact name for scatter","stack_col":"exact name for stacked","aggregation":"AVG","title":"Under 55 chars"}}"""

        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        try:
            if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
            ai = json.loads(content)
        except json.JSONDecodeError:
            ai = {}

        # Use deterministic type if detected, else use AI's suggestion
        if not chart_type:
            chart_type = ai.get("chart_type", "bar")

        cat_col  = ai.get("category_col") or (cat_cols[0] if cat_cols else None)
        val_col  = ai.get("value_col") or (num_cols[0] if num_cols else None)
        x_col    = ai.get("x_col") or (num_cols[0] if len(num_cols) > 0 else None)
        y_col    = ai.get("y_col") or (num_cols[1] if len(num_cols) > 1 else num_cols[0] if num_cols else None)
        stack_col = ai.get("stack_col") or (cat_cols[1] if len(cat_cols) > 1 else None)
        agg_fn   = ai.get("aggregation", "COUNT" if chart_type in ("pie","donut") else "AVG").upper()
        title    = ai.get("title", question[:60])

        # Validate columns exist
        def valid(col): return col and col in df.columns
        if not valid(cat_col): cat_col = cat_cols[0] if cat_cols else None
        if not valid(val_col): val_col = num_cols[0] if num_cols else None
        if not valid(x_col):   x_col   = num_cols[0] if num_cols else None
        if not valid(y_col):   y_col   = num_cols[1] if len(num_cols) > 1 else (num_cols[0] if num_cols else None)

        # ── DuckDB aggregation per chart type ─────────────────────────────────
        chart_data = {"headers": [], "rows": []}

        try:
            if chart_type == "scatter":
                # Raw sample of two numeric columns (up to 200 points)
                xc = f'"{x_col}"'; yc = f'"{y_col}"'
                sql = f'SELECT {xc}, {yc} FROM dataset WHERE {xc} IS NOT NULL AND {yc} IS NOT NULL LIMIT 200'
                r = DuckDBEngine.execute_query(df, sql, "dataset", 200)
                chart_data = {"headers": [x_col, y_col], "rows": r.get("rows", [])}
                title = title or f"{x_col} vs {y_col} Correlation"

            elif chart_type == "histogram":
                # Compute 10 equal-width bins using DuckDB
                vc = f'"{val_col}"'
                minmax = DuckDBEngine.execute_query(df, f'SELECT MIN({vc}), MAX({vc}) FROM dataset', "dataset", 1)
                if minmax["rows"]:
                    mn, mx = float(minmax["rows"][0][0] or 0), float(minmax["rows"][0][1] or 1)
                    step = (mx - mn) / 10 if mx != mn else 1
                    rows = []
                    for i in range(10):
                        lo = mn + i * step; hi = mn + (i+1) * step
                        label = f"{lo:.1f}–{hi:.1f}"
                        cond = f'{vc} >= {lo} AND {vc} < {hi}' if i < 9 else f'{vc} >= {lo} AND {vc} <= {hi}'
                        cnt_r = DuckDBEngine.execute_query(df, f'SELECT COUNT(*) FROM dataset WHERE {cond}', "dataset", 1)
                        rows.append([label, cnt_r["rows"][0][0] if cnt_r["rows"] else 0])
                    chart_data = {"headers": [f"{val_col} Range", "Frequency"], "rows": rows}
                chart_type = "column"  # Histogram rendered as column chart
                title = title or f"Distribution of {val_col}"

            elif chart_type in ("stacked_bar", "stacked_column"):
                # GROUP BY cat_col and stack_col, SUM/COUNT value_col
                sc = f'"{stack_col}"' if stack_col else None
                cc = f'"{cat_col}"' if cat_col else None
                vc = f'"{val_col}"' if val_col else None
                if cc and sc and vc:
                    sql = f'SELECT {cc}, {sc}, ROUND({agg_fn}({vc}), 2) as val FROM dataset WHERE {cc} IS NOT NULL AND {sc} IS NOT NULL GROUP BY {cc}, {sc} ORDER BY {cc}, {sc}'
                    r = DuckDBEngine.execute_query(df, sql, "dataset", 200)
                    # Pivot: rows are cat_col values, columns are stack_col values
                    rows_raw = r.get("rows", [])
                    cats = list(dict.fromkeys(row[0] for row in rows_raw))
                    stacks = list(dict.fromkeys(row[1] for row in rows_raw))
                    pivot = {c: {s: 0 for s in stacks} for c in cats}
                    for row in rows_raw:
                        pivot[row[0]][row[1]] = row[2]
                    headers = [cat_col] + stacks
                    rows = [[c] + [pivot[c].get(s, 0) for s in stacks] for c in cats]
                    chart_data = {"headers": headers, "rows": rows}
                    title = title or f"{agg_fn} of {val_col} by {cat_col} & {stack_col}"
                else:
                    # Fallback to simple bar
                    chart_type = "bar"

            elif chart_type in ("pie", "donut"):
                cc = f'"{cat_col}"'
                sql = f'SELECT {cc}, COUNT(*) as "Count" FROM dataset WHERE {cc} IS NOT NULL GROUP BY {cc} ORDER BY "Count" DESC LIMIT 15'
                r = DuckDBEngine.execute_query(df, sql, "dataset", 15)
                chart_data = {"headers": [cat_col, "Count"], "rows": r.get("rows", [])}
                title = title or f"{cat_col} Breakdown"

            else:
                # bar, column, line, area
                cc = f'"{cat_col}"'
                if val_col:
                    vc = f'"{val_col}"'
                    sql = f'SELECT {cc}, ROUND({agg_fn}({vc}), 2) as "{agg_fn} of {val_col}" FROM dataset WHERE {cc} IS NOT NULL AND {vc} IS NOT NULL GROUP BY {cc} ORDER BY 2 DESC LIMIT 20'
                    r = DuckDBEngine.execute_query(df, sql, "dataset", 20)
                    chart_data = {"headers": [cat_col, f"{agg_fn} of {val_col}"], "rows": r.get("rows", [])}
                else:
                    sql = f'SELECT {cc}, COUNT(*) as "Count" FROM dataset WHERE {cc} IS NOT NULL GROUP BY {cc} ORDER BY "Count" DESC LIMIT 20'
                    r = DuckDBEngine.execute_query(df, sql, "dataset", 20)
                    chart_data = {"headers": [cat_col, "Count"], "rows": r.get("rows", [])}
                    val_col = "Count"
                title = title or f"{agg_fn} of {val_col} by {cat_col}"

        except Exception as ex:
            # Safe fallback: count by first category
            try:
                cc = f'"{cat_col}"' if cat_col else '"' + (cat_cols[0] if cat_cols else df.columns[0]) + '"'
                r = DuckDBEngine.execute_query(df, f'SELECT {cc}, COUNT(*) as "Count" FROM dataset GROUP BY {cc} ORDER BY "Count" DESC LIMIT 15', "dataset", 15)
                chart_data = {"headers": [cat_cols[0] if cat_cols else df.columns[0], "Count"], "rows": r.get("rows", [])}
                chart_type = "bar"
            except Exception:
                pass

        return {
            "action": "CREATE_CHART",
            "chart_type": chart_type,
            "sheet": active_sheet,
            "data_range": "",
            "title": title,
            "chart_data": chart_data,
        }


    async def generate_formula(self, dataset_id, description, cell_context, user):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df)
        ctx = self._profile_to_ctx(profile, dataset.name)
        col_map = "\n".join([f"  {c['excel_col']} = {c['name']}" for c in profile["all_columns"]])
        last_row = profile["row_count"] + 1
        cell = cell_context.split(".")[0].strip() if cell_context else "A1"
        prompt = f"{ctx}\n\nExact column letter map:\n{col_map}\n\nData rows: 2 to {last_row}\nTarget cell: {cell}\nUser request: {description}\n\nWrite a valid Excel formula using the EXACT column letters above. Example: =AVERAGE(H2:H{last_row})\n\nReturn ONLY JSON: {{\"action\":\"INSERT_FORMULA\",\"cell\":\"{cell}\",\"formula\":\"=...\",\"explanation\":\"one sentence\"}}"
        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        try:
            if "`json" in content: content = content.split("`json")[1].split("`")[0].strip()
            elif "`" in content: content = content.split("`")[1].split("`")[0].strip()
            return json.loads(content)
        except json.JSONDecodeError:
            first_num = profile["numeric_columns"][0] if profile["numeric_columns"] else None
            fallback = f'=SUM({first_num["excel_col"]}2:{first_num["excel_col"]}{last_row})' if first_num else "=SUM(A2:A100)"
            return {"action": "INSERT_FORMULA", "cell": cell, "formula": fallback, "explanation": content[:200]}

    async def chat_stream(self, dataset_id, question, workbook_context, user):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context)
        ctx = self._profile_to_ctx(profile, dataset.name)
        prompt = f"{ctx}\n\nUser Question: {question}\n\nAnswer with real numbers from the stats above."
        async for chunk in self.ai_service.copilot_chat_stream(question=prompt, dataset_id=dataset_id, actor=user):
            yield chunk

    async def detect_anomalies(self, dataset_id, sheet, user):
        from app.services.ingestion.profiler import DataProfiler
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile_data = DataProfiler.profile_dataframe(df)
        outlier_rows = {}
        for col, col_info in profile_data.get("columns", {}).items():
            if col_info.get("type") == "numeric" and col_info.get("outlier_count", 0) > 0:
                q25 = col_info.get("q25")
                q75 = col_info.get("q75")
                iqr = col_info.get("iqr")
                if q25 is not None and q75 is not None and iqr is not None and iqr > 0:
                    lower = q25 - (1.5 * iqr)
                    upper = q75 + (1.5 * iqr)
                    idx_list = df.with_row_index("__index__").filter((pl.col(col) < lower) | (pl.col(col) > upper))["__index__"].to_list()
                    for idx in idx_list:
                        if idx not in outlier_rows:
                            outlier_rows[idx] = []
                        outlier_rows[idx].append(f"{col} outside [{round(lower,2)}, {round(upper,2)}]")
        excel_rows = sorted([i + 2 for i in outlier_rows.keys()])[:100]
        details = {str(i+2): v for i, v in list(outlier_rows.items())[:5]}
        return {"action": "HIGHLIGHT_ANOMALIES", "sheet": sheet, "rows": excel_rows, "color": "#FF4444", "reason": f"IQR outlier in {len(outlier_rows)} row(s)", "details": details}

    async def analyze_workbook(self, dataset_id, workbook_schema, analysis_type, user):
        from datetime import datetime
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df)
        ctx = self._profile_to_ctx(profile, dataset.name)
        corr_info = ""
        if len(profile["numeric_columns"]) >= 2:
            try:
                corr = DuckDBEngine.compute_correlation_matrix(df)
                cols = corr.get("columns", [])
                matrix = corr.get("matrix", {})
                strong = []
                for i, c1 in enumerate(cols):
                    for j, c2 in enumerate(cols):
                        if i < j:
                            val = matrix.get(c1, {}).get(c2)
                            if val and abs(val) > 0.5:
                                strong.append(f"{c1}<>{c2}:r={val}")
                if strong:
                    corr_info = f"\nStrong correlations: {'; '.join(strong[:5])}"
            except Exception:
                pass
        prompt = f"{ctx}{corr_info}\n\nWorkbook structure: {json.dumps(workbook_schema)}\nAnalysis: {analysis_type}\n\nWrite a detailed BI report using REAL numbers from the stats. Return ONLY JSON:\n{{\"sections\":[{{\"heading\":\"Executive Summary\",\"content\":\"...\"}},{{\"heading\":\"Key Metrics\",\"content\":\"...\"}},{{\"heading\":\"Patterns & Correlations\",\"content\":\"...\"}},{{\"heading\":\"Recommendations\",\"content\":\"...\"}}],\"actions\":[{{\"action\":\"CREATE_CHART\",\"chart_type\":\"...\",\"sheet\":\"Sheet1\",\"data_range\":\"A1:B100\",\"title\":\"...\"}}]}}"
        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        parsed = {}
        try:
            if "`json" in content: content = content.split("`json")[1].split("`")[0].strip()
            elif "`" in content: content = content.split("`")[1].split("`")[0].strip()
            parsed = json.loads(content)
        except json.JSONDecodeError:
            parsed = {"sections": [{"heading": "Executive Summary", "content": content}], "actions": []}
        if "sections" not in parsed:
            parsed["sections"] = [{"heading": "Executive Summary", "content": str(content)}]
        actions = parsed.get("actions", [])
        if not actions and profile["numeric_columns"]:
            nc = profile["numeric_columns"][0]
            tc = profile["text_columns"][0] if profile["text_columns"] else None
            actions.append({"action": "CREATE_CHART", "chart_type": "bar" if tc else "column", "sheet": profile.get("active_sheet") or "Sheet1", "data_range": f"A1:{nc['excel_col']}{min(profile['row_count'],1000)+1}", "title": nc["name"] + (" by " + tc["name"] if tc else "")})
        return {"title": f"Analysis — {dataset.name}", "generated_at": datetime.utcnow().isoformat(), "dataset_name": dataset.name, "row_count": profile["row_count"], "column_count": profile["column_count"], "sections": parsed["sections"], "actions": actions}

    async def generate_forecast(self, dataset_id, periods, user, workbook_context=None, selected_data=None):
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context, selected_data)
        ctx = self._profile_to_ctx(profile, dataset.name)
        selected_address = profile.get("selected_range") or ""
        clean_range = selected_address.split("!")[-1] if selected_address and "!" in selected_address else selected_address
        active_sheet = profile.get("active_sheet", "Sheet1")
        date_col = profile["date_columns"][0]["name"] if profile["date_columns"] else None
        target_col_info = None
        if profile.get("selected_headers"):
            for c in profile["numeric_columns"]:
                if c["name"] in profile["selected_headers"]:
                    target_col_info = c
                    break
        if not target_col_info and profile["numeric_columns"]:
            target_col_info = profile["numeric_columns"][0]
        target_col = target_col_info["name"] if target_col_info else "primary metric"
        target_letter = target_col_info["excel_col"] if target_col_info else "B"
        last_row = profile["row_count"] + 1
        dr = clean_range or f"A1:{target_letter}{last_row}"
        prompt = f"{ctx}\n\nForecast {target_col} for next {periods} periods.\nDate column: {date_col or 'none (use row sequence)'}.\nSelected range: {clean_range or 'full dataset'}.\n\nReturn ONLY JSON:\n{{\"action\":\"CREATE_CHART\",\"chart_type\":\"line\",\"sheet\":\"{active_sheet}\",\"data_range\":\"{dr}\",\"title\":\"Forecast — {target_col} ({periods} periods)\",\"forecast_summary\":\"2-3 sentence trend insight with real numbers\"}}"
        response = await self.ai_service.copilot_chat(question=prompt, dataset_id=dataset_id, actor=user)
        content = response.get("answer", "{}")
        try:
            if "`json" in content: content = content.split("`json")[1].split("`")[0].strip()
            elif "`" in content: content = content.split("`")[1].split("`")[0].strip()
            result = json.loads(content)
            if clean_range: result["data_range"] = clean_range
            result["sheet"] = active_sheet or result.get("sheet", "Sheet1")
            return result
        except json.JSONDecodeError:
            return {"action": "CREATE_CHART", "chart_type": "line", "sheet": active_sheet, "data_range": dr, "title": f"Forecast — {target_col}", "forecast_summary": content[:300]}

    async def detect_missing_values(self, dataset_id, user, workbook_context=None):
        """Scan every column for nulls/empty values. Return per-column stats + row indices for Excel highlighting."""
        NUMERIC_DTYPES = {'Int8','Int16','Int32','Int64','UInt8','UInt16','UInt32','UInt64','Float32','Float64'}
        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context)
        total_rows = len(df)
        active_sheet = profile.get("active_sheet") or "Sheet1"

        columns_report = []
        total_missing_cells = 0

        for col_info in profile["all_columns"]:
            col = col_info["name"]
            excel_col = col_info["excel_col"]
            dtype_str = col_info.get("dtype", "")

            # Count nulls
            try:
                null_r = DuckDBEngine.execute_query(
                    df, f'SELECT COUNT(*) - COUNT("{col}") as null_count FROM dataset', "dataset", 1
                )
                null_count = int(null_r["rows"][0][0]) if null_r["rows"] else 0
            except Exception:
                null_count = 0

            # Also count empty strings for text columns
            empty_count = 0
            if dtype_str not in NUMERIC_DTYPES:
                try:
                    empty_r = DuckDBEngine.execute_query(
                        df, f'SELECT COUNT(*) FROM dataset WHERE TRIM(CAST("{col}" AS VARCHAR)) = \'\' AND "{col}" IS NOT NULL', "dataset", 1
                    )
                    empty_count = int(empty_r["rows"][0][0]) if empty_r["rows"] else 0
                except Exception:
                    pass

            total_missing = null_count + empty_count
            total_missing_cells += total_missing
            null_pct = round((total_missing / total_rows) * 100, 1) if total_rows > 0 else 0.0

            # Get row numbers of null/empty cells (Excel row = data_row + 1 for header)
            null_excel_rows = []
            if total_missing > 0 and total_missing <= 50000:  # Only for manageable sizes
                try:
                    rows_r = DuckDBEngine.execute_query(
                        df,
                        f'SELECT ROW_NUMBER() OVER () as rn FROM dataset WHERE "{col}" IS NULL OR TRIM(CAST("{col}" AS VARCHAR)) = \'\' LIMIT 500',
                        "dataset", 500
                    )
                    # +1 for header row in Excel
                    null_excel_rows = [int(r[0]) + 1 for r in rows_r.get("rows", [])]
                except Exception:
                    pass

            # Determine fill strategy
            if col_info.get("is_id"):
                fill_strategy = "skip"
                fill_value = None
            elif dtype_str in NUMERIC_DTYPES:
                stats = col_info.get("stats", {})
                mean_val = stats.get("avg")
                fill_strategy = "mean"
                fill_value = mean_val
            elif "Date" in dtype_str or "Datetime" in dtype_str:
                fill_strategy = "forward_fill"
                fill_value = None
            else:
                # Mode for text columns
                try:
                    mode_r = DuckDBEngine.execute_query(
                        df,
                        f'SELECT "{col}", COUNT(*) as n FROM dataset WHERE "{col}" IS NOT NULL AND TRIM(CAST("{col}" AS VARCHAR)) != \'\' GROUP BY "{col}" ORDER BY n DESC LIMIT 1',
                        "dataset", 1
                    )
                    fill_value = mode_r["rows"][0][0] if mode_r["rows"] else None
                    fill_strategy = "mode"
                except Exception:
                    fill_strategy = "mode"
                    fill_value = None

            columns_report.append({
                "column": col,
                "excel_col": excel_col,
                "dtype": dtype_str,
                "null_count": null_count,
                "empty_count": empty_count,
                "total_missing": total_missing,
                "missing_pct": null_pct,
                "null_excel_rows": null_excel_rows,      # Excel row numbers to highlight (1-based, header=1)
                "fill_strategy": fill_strategy,
                "fill_value": fill_value,
                "is_clean": total_missing == 0,
            })

        # Sort: worst columns first
        columns_report.sort(key=lambda x: x["total_missing"], reverse=True)

        quality_score = round(
            max(0, 100 - (total_missing_cells / max(total_rows * len(df.columns), 1)) * 100), 1
        )

        return {
            "dataset_name": dataset.name,
            "active_sheet": active_sheet,
            "total_rows": total_rows,
            "total_columns": len(df.columns),
            "total_missing_cells": total_missing_cells,
            "quality_score": quality_score,
            "columns": columns_report,
            "columns_with_issues": [c for c in columns_report if not c["is_clean"]],
            "clean_columns": [c["column"] for c in columns_report if c["is_clean"]],
        }

    # ── Auto-Clean Data ────────────────────────────────────────────────────────
    async def auto_clean_data(self, dataset_id: uuid.UUID, workbook_context: dict, user: User) -> dict:
        """
        Returns clean instructions for:
        1. Null/empty cell fills (per column, using mean/mode/forward_fill strategy)
        2. Duplicate row Excel indices to delete
        3. Text cells with leading/trailing whitespace to trim
        """
        NUMERIC_DTYPES = {'Int8','Int16','Int32','Int64','UInt8','UInt16','UInt32','UInt64','Float32','Float64'}
        DATE_DTYPES = {'Date','Datetime','Time','Duration'}

        dataset, df = await self._get_dataset_and_df(dataset_id, user)
        profile = self._build_smart_profile(df, workbook_context)
        total_rows = len(df)

        fill_instructions = []    # Which cells to fill and with what value
        trim_columns = []         # Which columns have whitespace to trim
        duplicate_excel_rows = [] # Excel row indices of duplicates (1-based + 1 for header)

        # ── Step 1: Null fill instructions (reuse DQ logic) ──────────────────
        for col_info in profile["all_columns"]:
            col = col_info["name"]
            excel_col = col_info["excel_col"]
            dtype_str = col_info.get("dtype", "")

            if col_info.get("is_id"):
                continue  # Never touch ID columns

            # Count nulls/empties
            try:
                null_r = DuckDBEngine.execute_query(df, f'SELECT COUNT(*) - COUNT("{col}") FROM dataset', "dataset", 1)
                null_count = int(null_r["rows"][0][0]) if null_r["rows"] else 0
            except Exception:
                null_count = 0

            empty_count = 0
            if dtype_str not in NUMERIC_DTYPES and "Date" not in dtype_str:
                try:
                    er = DuckDBEngine.execute_query(df, f'SELECT COUNT(*) FROM dataset WHERE TRIM(CAST("{col}" AS VARCHAR)) = \'\' AND "{col}" IS NOT NULL', "dataset", 1)
                    empty_count = int(er["rows"][0][0]) if er["rows"] else 0
                except Exception:
                    pass

            total_missing = null_count + empty_count
            if total_missing == 0:
                continue

            # Determine fill value
            if dtype_str in NUMERIC_DTYPES:
                try:
                    r = DuckDBEngine.execute_query(df, f'SELECT ROUND(AVG("{col}"), 4) FROM dataset', "dataset", 1)
                    fill_value = r["rows"][0][0] if r["rows"] else None
                    fill_strategy = "mean"
                except Exception:
                    fill_value = None; fill_strategy = "mean"
            elif "Date" in dtype_str or "Datetime" in dtype_str:
                # Forward fill: get previous non-null value per row — just mark as skip for now
                fill_value = None; fill_strategy = "forward_fill"
            else:
                try:
                    r = DuckDBEngine.execute_query(df, f'SELECT "{col}", COUNT(*) FROM dataset WHERE "{col}" IS NOT NULL AND TRIM(CAST("{col}" AS VARCHAR)) != \'\' GROUP BY "{col}" ORDER BY COUNT(*) DESC LIMIT 1', "dataset", 1)
                    fill_value = r["rows"][0][0] if r["rows"] else None
                    fill_strategy = "mode"
                except Exception:
                    fill_value = None; fill_strategy = "mode"

            # Get exact Excel row numbers for null cells
            null_excel_rows = []
            try:
                rr = DuckDBEngine.execute_query(
                    df,
                    f'SELECT ROW_NUMBER() OVER () as rn FROM dataset WHERE "{col}" IS NULL OR TRIM(CAST("{col}" AS VARCHAR)) = \'\' LIMIT 2000',
                    "dataset", 2000
                )
                null_excel_rows = [int(r[0]) + 1 for r in rr.get("rows", [])]  # +1 for header
            except Exception:
                pass

            if fill_value is not None or fill_strategy == "forward_fill":
                fill_instructions.append({
                    "column": col,
                    "excel_col": excel_col,
                    "fill_strategy": fill_strategy,
                    "fill_value": fill_value,
                    "null_excel_rows": null_excel_rows,
                    "count": total_missing,
                })

        # ── Step 2: Detect duplicate rows ─────────────────────────────────────
        try:
            # Find row numbers that are duplicates (keep first occurrence, mark rest)
            all_cols_quoted = ", ".join(f'"{c}"' for c in df.columns)
            dup_r = DuckDBEngine.execute_query(
                df,
                f'''SELECT rn FROM (
                    SELECT ROW_NUMBER() OVER () as rn,
                           ROW_NUMBER() OVER (PARTITION BY {all_cols_quoted} ORDER BY ROW_NUMBER() OVER ()) as dup_rank
                    FROM dataset
                ) t WHERE dup_rank > 1 LIMIT 1000''',
                "dataset", 1000
            )
            # +1 for header row offset in Excel
            duplicate_excel_rows = [int(r[0]) + 1 for r in dup_r.get("rows", [])]
        except Exception:
            duplicate_excel_rows = []

        # ── Step 3: Detect whitespace in text columns ──────────────────────────
        for col_info in profile["all_columns"]:
            col = col_info["name"]
            dtype_str = col_info.get("dtype", "")
            if dtype_str in NUMERIC_DTYPES or "Date" in dtype_str:
                continue
            try:
                ws_r = DuckDBEngine.execute_query(
                    df,
                    f'SELECT COUNT(*) FROM dataset WHERE "{col}" IS NOT NULL AND CAST("{col}" AS VARCHAR) != TRIM(CAST("{col}" AS VARCHAR))',
                    "dataset", 1
                )
                ws_count = int(ws_r["rows"][0][0]) if ws_r["rows"] else 0
                if ws_count > 0:
                    # Get row positions for trimming
                    pos_r = DuckDBEngine.execute_query(
                        df,
                        f'SELECT ROW_NUMBER() OVER () as rn, TRIM(CAST("{col}" AS VARCHAR)) as trimmed FROM dataset WHERE "{col}" IS NOT NULL AND CAST("{col}" AS VARCHAR) != TRIM(CAST("{col}" AS VARCHAR)) LIMIT 2000',
                        "dataset", 2000
                    )
                    trim_columns.append({
                        "column": col,
                        "excel_col": col_info["excel_col"],
                        "count": ws_count,
                        "cells": [{"excel_row": int(r[0]) + 1, "trimmed_value": str(r[1])} for r in pos_r.get("rows", [])],
                    })
            except Exception:
                pass

        # Build summary
        nulls_to_fill = sum(len(fi["null_excel_rows"]) for fi in fill_instructions)
        spaces_to_trim = sum(len(tc["cells"]) for tc in trim_columns)
        changelog_preview = []
        if len(duplicate_excel_rows) > 0:
            changelog_preview.append(f"Remove {len(duplicate_excel_rows)} duplicate row(s)")
        if nulls_to_fill > 0:
            changelog_preview.append(f"Fill {nulls_to_fill} empty cell(s) with smart values")
        if spaces_to_trim > 0:
            changelog_preview.append(f"Trim whitespace in {spaces_to_trim} cell(s)")

        return {
            "dataset_name": dataset.name,
            "fill_instructions": fill_instructions,
            "duplicate_excel_rows": duplicate_excel_rows,
            "trim_columns": trim_columns,
            "summary": {
                "nulls_to_fill": nulls_to_fill,
                "duplicates_to_remove": len(duplicate_excel_rows),
                "spaces_to_trim": spaces_to_trim,
                "changelog_preview": changelog_preview,
                "has_changes": len(changelog_preview) > 0,
            }
        }

    # ── Smart Categorization & Sentiment ──────────────────────────────────────
    async def categorize_column(
        self,
        dataset_id: uuid.UUID,
        column_name: str,
        mode: str,          # "sentiment" | "categorize"
        workbook_context: dict,
        batch_start: int,
        batch_size: int,
        defined_categories: list,
        user: User
    ) -> dict:
        """
        Classifies text values in a column in batches.
        mode='sentiment'   → Positive / Neutral / Negative
        mode='categorize'  → AI-defined categories from the data itself
        batch_start=0, defined_categories=[] → first call, AI defines categories from sample
        batch_start>0 → subsequent calls, use defined_categories from first response
        """
        dataset, df = await self._get_dataset_and_df(dataset_id, user)

        # Validate column exists
        if column_name not in df.columns:
            raise ValueError(f"Column '{column_name}' not found. Available columns: {', '.join(df.columns)}")

        total_rows = len(df)
        profile = self._build_smart_profile(df, workbook_context)
        excel_col = profile["excel_col_map"].get(column_name, "A")

        # Get the batch of values
        batch_r = DuckDBEngine.execute_query(
            df,
            f'SELECT CAST("{column_name}" AS VARCHAR) FROM dataset LIMIT {batch_size} OFFSET {batch_start}',
            "dataset", batch_size
        )
        batch_values = [r[0] if r[0] is not None else "" for r in batch_r.get("rows", [])]
        actual_batch_size = len(batch_values)

        if actual_batch_size == 0:
            return {
                "labels": [],
                "defined_categories": defined_categories,
                "batch_start": batch_start,
                "batch_size": 0,
                "total_rows": total_rows,
                "has_more": False,
                "excel_col": excel_col,
                "column_name": column_name,
            }

        labels = []

        if mode == "sentiment":
            prompt = f"""You are a sentiment classifier. Classify each of the following texts as exactly one of: Positive, Neutral, or Negative.

Return ONLY a JSON array of strings with exactly {actual_batch_size} elements matching the order of input.
Do not include any explanation or extra text.

Texts to classify:
{json.dumps(batch_values, ensure_ascii=False)}

Return format example for 3 items: ["Positive", "Neutral", "Negative"]"""

            raw = await self.ai_service.copilot_chat(prompt, workbook_context={})
            try:
                # Extract JSON array from response
                import re
                match = re.search(r'\[.*?\]', raw, re.DOTALL)
                labels = json.loads(match.group(0)) if match else []
                # Normalize labels
                valid = {"Positive", "Neutral", "Negative"}
                labels = [l if l in valid else "Neutral" for l in labels]
            except Exception:
                labels = ["Neutral"] * actual_batch_size

        else:  # categorize
            # First batch: define categories from sample
            if not defined_categories:
                sample_r = DuckDBEngine.execute_query(
                    df,
                    f'SELECT DISTINCT CAST("{column_name}" AS VARCHAR) FROM dataset WHERE "{column_name}" IS NOT NULL LIMIT 50',
                    "dataset", 50
                )
                sample_values = [r[0] for r in sample_r.get("rows", [])]

                cat_prompt = f"""Analyze these sample text values from a column called "{column_name}".
Define 3 to 6 clear, mutually-exclusive category labels that best describe this data.

Sample values:
{json.dumps(sample_values, ensure_ascii=False)}

Return ONLY a JSON array of category label strings, e.g. ["Billing", "Technical Support", "Delivery", "Other"]
No explanation, just the JSON array."""

                raw_cats = await self.ai_service.copilot_chat(cat_prompt, workbook_context={})
                try:
                    import re
                    match = re.search(r'\[.*?\]', raw_cats, re.DOTALL)
                    defined_categories = json.loads(match.group(0)) if match else ["Category A", "Category B", "Other"]
                except Exception:
                    defined_categories = ["Category A", "Category B", "Other"]

            # Classify the batch using defined categories
            classify_prompt = f"""Classify each of the following texts into exactly one of these categories:
{json.dumps(defined_categories)}

Return ONLY a JSON array of strings with exactly {actual_batch_size} elements matching the input order.
Each element must be one of the categories listed above. No explanation.

Texts:
{json.dumps(batch_values, ensure_ascii=False)}"""

            raw = await self.ai_service.copilot_chat(classify_prompt, workbook_context={})
            try:
                import re
                match = re.search(r'\[.*?\]', raw, re.DOTALL)
                labels = json.loads(match.group(0)) if match else []
                # Normalize: ensure each label is one of defined_categories
                labels = [l if l in defined_categories else defined_categories[-1] for l in labels]
            except Exception:
                labels = [defined_categories[-1]] * actual_batch_size

        # Pad/trim to batch size in case AI returned wrong count
        if len(labels) < actual_batch_size:
            default = "Neutral" if mode == "sentiment" else (defined_categories[-1] if defined_categories else "Other")
            labels += [default] * (actual_batch_size - len(labels))
        labels = labels[:actual_batch_size]

        has_more = (batch_start + actual_batch_size) < total_rows

        return {
            "labels": labels,
            "defined_categories": defined_categories,
            "batch_start": batch_start,
            "batch_size": actual_batch_size,
            "total_rows": total_rows,
            "has_more": has_more,
            "excel_col": excel_col,
            "column_name": column_name,
        }
