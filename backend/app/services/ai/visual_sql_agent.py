"""VisualSQLAgent — Data-Grounded Natural Language to DuckDB SQL with interactive visual synthesis."""

from __future__ import annotations

import json
import logging
import re
from typing import Dict, Any, Optional, List
import polars as pl

from app.core.exceptions import AIServiceException
from app.services.ai.router import LLMRouter
from app.services.ingestion.duckdb_engine import DuckDBEngine

logger = logging.getLogger(__name__)


class VisualSQLAgent:
    """Agent that translates natural language into verified DuckDB SQL queries,

    executes them, synthesizes executive answers, and constructs rich interactive visual artifacts.
    """

    SQL_SYSTEM_PROMPT = """You are an elite Data Architect and DuckDB Business Intelligence Specialist.
Your mission is to translate natural language user questions into exact, high-performance, read-only DuckDB SQL queries.

CRITICAL RULES:
1. The table name in your query is ALWAYS `data`.
2. Generate ONLY read-only SELECT queries. NEVER generate DROP, DELETE, INSERT, UPDATE, ALTER, COPY, or ATTACH.
3. DuckDB SQL syntax rules:
   - Wrap column names containing spaces or special characters in double quotes, e.g. "Revenue (USD)".
   - Use aggregations: SUM(), AVG(), COUNT(), MIN(), MAX(), MEDIAN().
   - Use standard GROUP BY, ORDER BY, LIMIT clauses (default LIMIT 25 unless user requests more).
   - For string operations: LOWER(), UPPER(), LIKE, ILIKE.
   - For date/time: DATE_TRUNC('month', col), STRFTIME(col, '%Y-%m'), EXTRACT(year FROM col).
4. Output your response as valid JSON with the exact structure:
{
  "sql": "SELECT category, SUM(revenue) AS total_revenue FROM data GROUP BY category ORDER BY total_revenue DESC LIMIT 10",
  "explanation": "Aggregates total revenue across categories sorted descending.",
  "recommended_chart": "bar" // "bar" | "line" | "area" | "pie" | "kpi" | "table"
}
5. Output pure JSON only. Do not add markdown formatting or backticks.
"""

    SYNTHESIS_SYSTEM_PROMPT = """You are a Senior Strategic BI Consultant and Principal Analyst.
You are provided with:
1. The user's question.
2. The DuckDB SQL executed.
3. The exact tabular result returned by the database.

Synthesize a clear, concise, and high-impact executive business answer.
Guidelines:
- Direct Answer First: State the exact key metric or leader in the very first sentence.
- Quantitative Rigor: Highlight exact numbers, percentages, differences, or variances from the data.
- Executive Context: Provide 1-2 bullet points with strategic takeaways or operational implications.
- Grounded: Never guess or invent numbers not present in the verified query result.
- Format: Professional clean markdown (bold numbers, bullet points).
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    def _build_schema_context(
        self,
        schema_info: Dict[str, Any],
        preview_rows: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Format column types and preview rows into schema context."""
        lines = ["Table Name: `data`\nColumns & Inferred Types:"]
        for col_name, col_type in schema_info.items():
            lines.append(f"  - `{col_name}` ({col_type})")

        if preview_rows:
            lines.append("\nSample Data (First 3 rows):")
            for i, row in enumerate(preview_rows[:3]):
                lines.append(f"  Row {i+1}: {json.dumps(row, default=str)}")

        return "\n".join(lines)

    def _detect_visual_artifact(
        self,
        query_result: Dict[str, Any],
        recommended_chart: str,
        sql: str,
    ) -> Dict[str, Any]:
        """Synthesize interactive visual artifact specs from DuckDB query results."""
        cols = query_result.get("columns", [])
        raw_rows = query_result.get("rows", [])
        total_rows = query_result.get("total_rows", len(raw_rows))

        if not cols or not raw_rows:
            return {
                "type": "empty",
                "sql": sql,
                "total_rows": 0,
                "columns": cols,
                "rows": [],
            }

        # Convert rows to list of dicts with formatted values
        records: List[Dict[str, Any]] = []
        for r in raw_rows:
            record = {}
            for col_idx, col_name in enumerate(cols):
                val = r[col_idx]
                if isinstance(val, float):
                    val = round(val, 2)
                record[col_name] = val
            records.append(record)

        # Single value / Single row -> KPI Metric Card
        if len(records) == 1 and len(cols) <= 2:
            num_val = None
            label = cols[-1]
            for c in cols:
                v = records[0][c]
                if isinstance(v, (int, float)):
                    num_val = v
                    label = c
                    break

            if num_val is not None:
                return {
                    "type": "kpi",
                    "title": label.replace("_", " ").title(),
                    "kpi_metrics": [
                        {
                            "label": label.replace("_", " ").title(),
                            "value": (
                                f"{num_val:,.2f}"
                                if isinstance(num_val, float)
                                else f"{num_val:,}"
                            ),
                            "raw_value": num_val,
                            "subtitle": "Direct DuckDB aggregation",
                        }
                    ],
                    "sql": sql,
                    "columns": cols,
                    "rows": records,
                    "total_rows": 1,
                }

        # Determine X and Y dimensions for Charts
        x_key = cols[0]
        y_key = cols[1] if len(cols) > 1 else cols[0]

        # Find first numeric column for Y axis
        for c in cols:
            if len(records) > 0 and isinstance(records[0][c], (int, float)):
                y_key = c
                break

        # Find first non-numeric or date column for X axis
        for c in cols:
            if (
                c != y_key
                and len(records) > 0
                and not isinstance(records[0][c], (int, float))
            ):
                x_key = c
                break

        chart_type = recommended_chart.lower() if recommended_chart else "bar"
        if chart_type not in ["bar", "line", "area", "pie", "kpi", "table"]:
            chart_type = "bar"

        # Auto-refine chart type based on column semantics
        if any(
            term in x_key.lower()
            for term in ["date", "time", "month", "year", "quarter", "day"]
        ):
            if chart_type == "bar":
                chart_type = "line"
        elif chart_type == "pie" and len(records) > 8:
            chart_type = "bar"

        # Calculate high-level summary KPIs
        kpi_metrics = []
        if len(records) > 0 and isinstance(records[0].get(y_key), (int, float)):
            numeric_vals = [
                r[y_key] for r in records if isinstance(r.get(y_key), (int, float))
            ]
            if numeric_vals:
                total_sum = sum(numeric_vals)
                avg_val = total_sum / len(numeric_vals)
                max_val = max(numeric_vals)
                kpi_metrics.append(
                    {
                        "label": f"Total {y_key.replace('_', ' ').title()}",
                        "value": (
                            f"{total_sum:,.2f}"
                            if isinstance(total_sum, float)
                            else f"{total_sum:,}"
                        ),
                        "raw_value": total_sum,
                    }
                )
                kpi_metrics.append(
                    {
                        "label": f"Average per {x_key.replace('_', ' ').title()}",
                        "value": (
                            f"{avg_val:,.2f}"
                            if isinstance(avg_val, float)
                            else f"{avg_val:,}"
                        ),
                        "raw_value": avg_val,
                    }
                )
                kpi_metrics.append(
                    {
                        "label": f"Peak {y_key.replace('_', ' ').title()}",
                        "value": (
                            f"{max_val:,.2f}"
                            if isinstance(max_val, float)
                            else f"{max_val:,}"
                        ),
                        "raw_value": max_val,
                    }
                )

        return {
            "type": "chart",
            "chart_type": chart_type,
            "title": f"{y_key.replace('_', ' ').title()} by {x_key.replace('_', ' ').title()}",
            "x_key": x_key,
            "y_key": y_key,
            "data": records,
            "columns": cols,
            "rows": records,
            "total_rows": total_rows,
            "sql": sql,
            "kpi_metrics": kpi_metrics,
        }

    async def execute_and_synthesize(
        self,
        question: str,
        df: pl.DataFrame,
        schema_info: Dict[str, Any],
        preview_rows: Optional[List[Dict[str, Any]]] = None,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute NL-to-SQL query on DuckDB and return grounded narrative + interactive visual artifact."""
        schema_context = self._build_schema_context(schema_info, preview_rows)

        sql_prompt = f"""Dataset Schema:
{schema_context}

User Question:
"{question}"

Generate the DuckDB SQL query and recommended visualization in JSON."""

        # 1. Generate SQL
        sql_response = await self.router.generate(
            prompt=sql_prompt,
            task_type="sql",
            preferred_provider=preferred_provider,
            system_instruction=self.SQL_SYSTEM_PROMPT,
            temperature=0.0,
            json_mode=True,
        )

        raw_sql_json = sql_response.content.strip()
        if raw_sql_json.startswith("```"):
            raw_sql_json = re.sub(r"^```(?:json)?\s*", "", raw_sql_json)
            raw_sql_json = re.sub(r"\s*```$", "", raw_sql_json)

        recommended_chart = "bar"
        try:
            parsed_data = json.loads(raw_sql_json)
            generated_sql = parsed_data.get("sql", "")
            recommended_chart = parsed_data.get("recommended_chart", "bar")
        except Exception:
            match = re.search(r"SELECT\s+.+;", raw_sql_json, re.DOTALL | re.IGNORECASE)
            generated_sql = match.group(0) if match else raw_sql_json

        if not generated_sql:
            raise AIServiceException("AI failed to generate a valid SQL query.")

        # 2. Execute on DuckDB with self-healing retry
        try:
            query_result = DuckDBEngine.execute_query(
                df=df, sql=generated_sql, table_name="data", limit=100
            )
        except Exception as e:
            logger.warning(
                f"[VisualSQLAgent] Query failed: {e}. Attempting self-healing query..."
            )
            fix_prompt = f"""SQL query failed with error: {str(e)}
Schema:
{schema_context}
Question: "{question}"
Broken SQL: {generated_sql}

Provide the corrected DuckDB SQL in JSON format."""
            fix_resp = await self.router.generate(
                prompt=fix_prompt,
                task_type="sql",
                preferred_provider=preferred_provider,
                system_instruction=self.SQL_SYSTEM_PROMPT,
                temperature=0.0,
                json_mode=True,
            )
            fix_json = fix_resp.content.strip()
            if fix_json.startswith("```"):
                fix_json = re.sub(r"^```(?:json)?\s*", "", fix_json)
                fix_json = re.sub(r"\s*```$", "", fix_json)

            try:
                parsed_fix = json.loads(fix_json)
                generated_sql = parsed_fix.get("sql", generated_sql)
                recommended_chart = parsed_fix.get(
                    "recommended_chart", recommended_chart
                )
            except Exception:
                match = re.search(r"SELECT\s+.+;", fix_json, re.DOTALL | re.IGNORECASE)
                generated_sql = match.group(0) if match else fix_json

            query_result = DuckDBEngine.execute_query(
                df=df, sql=generated_sql, table_name="data", limit=100
            )

        # 3. Construct In-Chat Visual Artifact Specification
        artifact_data = self._detect_visual_artifact(
            query_result=query_result,
            recommended_chart=recommended_chart,
            sql=generated_sql,
        )

        # 4. Synthesize Executive Narrative
        cols = query_result.get("columns", [])
        raw_rows = query_result.get("rows", [])
        records = [dict(zip(cols, r)) for r in raw_rows]
        total_rows = query_result.get("total_rows", len(raw_rows))

        synthesis_prompt = f"""User Question:
"{question}"

Executed SQL:
{generated_sql}

Query Results (Top {min(8, len(records))} rows):
{json.dumps(records[:8], default=str, indent=2)}

Total Rows: {total_rows}

Provide the executive business summary."""

        synthesis_response = await self.router.generate(
            prompt=synthesis_prompt,
            task_type="chat",
            preferred_provider=preferred_provider,
            system_instruction=self.SYNTHESIS_SYSTEM_PROMPT,
            temperature=0.2,
        )

        total_prompt_tokens = (
            sql_response.prompt_tokens + synthesis_response.prompt_tokens
        )
        total_completion_tokens = (
            sql_response.completion_tokens + synthesis_response.completion_tokens
        )

        return {
            "question": question,
            "answer": synthesis_response.content,
            "generated_sql": generated_sql,
            "artifact_data": artifact_data,
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "total_tokens": total_prompt_tokens + total_completion_tokens,
            "cost_usd": round(sql_response.cost_usd + synthesis_response.cost_usd, 6),
            "latency_ms": round(
                sql_response.latency_ms + synthesis_response.latency_ms, 2
            ),
            "provider": synthesis_response.provider,
            "model": synthesis_response.model,
        }
