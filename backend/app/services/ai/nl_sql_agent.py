"""Data-Grounded Natural Language to DuckDB SQL Agent."""

from __future__ import annotations

import json
import logging
import re
from typing import Dict, Any, Optional, List
import polars as pl

from app.core.exceptions import (
    AIServiceException,
    ValidationException,
    ForbiddenException,
)
from app.services.ai.router import LLMRouter
from app.services.ingestion.duckdb_engine import DuckDBEngine

logger = logging.getLogger(__name__)


class NLSQLAgent:
    """Agent that translates natural language questions into safe DuckDB SQL queries, executes them, and synthesizes answers."""

    SQL_GENERATION_SYSTEM_PROMPT = """You are an expert Data Engineer and Business Intelligence SQL specialist.
Your job is to translate natural language user questions into accurate, high-performance, read-only DuckDB SQL queries.

CRITICAL RULES:
1. The table name in your query is always `data`.
2. Generate ONLY read-only SELECT queries. NEVER generate DROP, DELETE, INSERT, UPDATE, ALTER, COPY, or ATTACH statements.
3. DuckDB SQL syntax:
   - Use double quotes for column names with spaces or special characters, e.g. "Revenue (USD)".
   - Use standard aggregations: SUM(), AVG(), COUNT(), MIN(), MAX(), MEDIAN(), STDDEV_SAMP().
   - Use standard GROUP BY, ORDER BY, LIMIT clauses.
   - For string operations, use LOWER(), UPPER(), LIKE, ILIKE.
   - For date operations, use DATE_TRUNC('month', col), EXTRACT(year FROM col), STRFTIME().
4. Output your response as valid JSON with the following exact structure:
{
  "sql": "SELECT category, SUM(revenue) AS total_revenue FROM data GROUP BY category ORDER BY total_revenue DESC LIMIT 5",
  "explanation": "Summarizes total revenue for the top 5 product categories."
}
5. Do not include markdown code blocks around the JSON (no ```json). Output pure JSON only.
"""

    SYNTHESIS_SYSTEM_PROMPT = """You are a Senior Data Analyst and Executive BI Consultant.
You will be provided with:
1. The user's original question.
2. The DuckDB SQL query executed against the dataset.
3. The exact tabular data returned by the query.

Provide a clear, direct, and actionable executive answer based STRICTLY on the query result data.
Rules:
- State the direct answer in the first sentence.
- Highlight key numbers, percentages, differences, or leaders.
- Mention any business implications or strategic context.
- Never hallucinate data that is not present in the query result.
- Format with professional markdown (bold key metrics, bullet points if listing multiple items).
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    def _build_schema_context(
        self,
        schema_info: Dict[str, Any],
        preview_rows: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Format column types and sample rows into a clear context prompt."""
        context_lines = ["Table Name: `data`\nColumns & Types:"]
        for col_name, col_type in schema_info.items():
            context_lines.append(f"  - `{col_name}` ({col_type})")

        if preview_rows:
            context_lines.append("\nSample Data (First 3 rows):")
            for i, row in enumerate(preview_rows[:3]):
                context_lines.append(f"  Row {i+1}: {json.dumps(row, default=str)}")

        return "\n".join(context_lines)

    async def answer_question(
        self,
        question: str,
        df: pl.DataFrame,
        schema_info: Dict[str, Any],
        preview_rows: Optional[List[Dict[str, Any]]] = None,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Translate question to SQL, execute on DuckDB, and return grounded analytical answer."""
        schema_context = self._build_schema_context(schema_info, preview_rows)

        prompt = f"""Dataset Schema:
{schema_context}

User Question:
"{question}"

Generate the DuckDB SQL query to answer this question."""

        # 1. Generate SQL using Groq/Gemini via Router
        sql_response = await self.router.generate(
            prompt=prompt,
            task_type="sql",
            preferred_provider=preferred_provider,
            system_instruction=self.SQL_GENERATION_SYSTEM_PROMPT,
            temperature=0.0,
            json_mode=True,
        )

        raw_sql_json = sql_response.content.strip()
        # Clean potential markdown wrapping
        if raw_sql_json.startswith("```"):
            raw_sql_json = re.sub(r"^```(?:json)?\s*", "", raw_sql_json)
            raw_sql_json = re.sub(r"\s*```$", "", raw_sql_json)

        try:
            parsed_sql_data = json.loads(raw_sql_json)
            generated_sql = parsed_sql_data.get("sql", "")
        except Exception:
            # Fallback if model returned raw SQL string
            match = re.search(r"SELECT\s+.+;", raw_sql_json, re.DOTALL | re.IGNORECASE)
            generated_sql = match.group(0) if match else raw_sql_json

        if not generated_sql:
            raise AIServiceException("AI failed to generate a valid SQL query.")

        # 2. Execute SQL safely using DuckDBEngine
        try:
            query_result = DuckDBEngine.execute_query(
                df=df, sql=generated_sql, table_name="data", limit=100
            )
        except Exception as e:
            logger.warning(
                f"[NLSQLAgent] SQL execution failed: {e}. Retrying with error feedback..."
            )
            # Self-healing retry
            fix_prompt = f"""The previous SQL query failed with error: {str(e)}
Schema:
{schema_context}
Question: "{question}"
Original SQL: {generated_sql}

Please provide the corrected DuckDB SQL in JSON format."""
            fix_response = await self.router.generate(
                prompt=fix_prompt,
                task_type="sql",
                preferred_provider=preferred_provider,
                system_instruction=self.SQL_GENERATION_SYSTEM_PROMPT,
                temperature=0.0,
                json_mode=True,
            )
            fix_json = fix_response.content.strip()
            if fix_json.startswith("```"):
                fix_json = re.sub(r"^```(?:json)?\s*", "", fix_json)
                fix_json = re.sub(r"\s*```$", "", fix_json)
            parsed_fix = json.loads(fix_json)
            generated_sql = parsed_fix.get("sql", generated_sql)
            query_result = DuckDBEngine.execute_query(
                df=df, sql=generated_sql, table_name="data", limit=100
            )

        # 3. Synthesize the final grounded business answer
        cols = query_result.get("columns", [])
        raw_rows = query_result.get("rows", [])
        records = [dict(zip(cols, r)) for r in raw_rows]
        total_rows = query_result.get("total_rows", len(raw_rows))

        synthesis_prompt = f"""User Question:
"{question}"

Executed SQL:
{generated_sql}

Query Results (Top rows):
{json.dumps(records[:25], default=str, indent=2)}

Total Rows Returned: {total_rows}

Provide an executive answer based on these findings."""

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
        total_cost = round(sql_response.cost_usd + synthesis_response.cost_usd, 6)

        return {
            "question": question,
            "generated_sql": generated_sql,
            "query_result": query_result,
            "answer": synthesis_response.content,
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "total_tokens": total_prompt_tokens + total_completion_tokens,
            "cost_usd": total_cost,
            "latency_ms": round(
                sql_response.latency_ms + synthesis_response.latency_ms, 2
            ),
            "provider": synthesis_response.provider,
            "model": synthesis_response.model,
        }
