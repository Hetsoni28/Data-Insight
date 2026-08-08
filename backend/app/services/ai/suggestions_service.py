"""SuggestionsService — Proactive contextual business question suggestions grounded in dataset profiling."""

from __future__ import annotations

import json
import logging
from typing import Dict, Any, List, Optional
import polars as pl

from app.services.ai.router import LLMRouter

logger = logging.getLogger(__name__)


class SuggestionsService:
    """Generates categorized, dataset-specific natural language business questions for AI Copilot."""

    SUGGESTIONS_SYSTEM_PROMPT = """You are a Principal Data Analyst and Business Intelligence Strategist.
Given a dataset schema and column summary, propose 4 to 6 smart, high-value business questions that an executive or analyst would ask.

Categorize each question into one of:
- "performance" (Top drivers, leaders, totals, margins)
- "anomaly" (Spikes, unusual variances, outliers, drops)
- "trend" (Time series, growth rates, month-over-month trajectory)
- "segmentation" (Breakdowns by category, customer tier, region, status)

Output pure JSON matching:
{
  "suggestions": [
    {
      "category": "performance",
      "icon": "TrendingUp",
      "title": "Top Performing Segments",
      "question": "What were our top 5 revenue-generating categories?"
    }
  ]
}
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    def generate_heuristic_suggestions(
        self,
        schema_info: Dict[str, Any],
        row_count: int = 0,
    ) -> List[Dict[str, Any]]:
        """Instant zero-latency heuristic suggestions generator based on column types."""
        numeric_cols = []
        categorical_cols = []
        date_cols = []

        for col, col_type in schema_info.items():
            t = str(col_type).lower()
            if any(k in t for k in ["int", "float", "double", "decimal", "numeric", "real"]):
                numeric_cols.append(col)
            elif any(k in t for k in ["date", "time", "timestamp"]):
                date_cols.append(col)
            else:
                categorical_cols.append(col)

        suggestions: List[Dict[str, Any]] = []

        # 1. Performance question (Top categories by primary metric)
        if numeric_cols and categorical_cols:
            n_col = numeric_cols[0]
            c_col = categorical_cols[0]
            suggestions.append({
                "category": "performance",
                "icon": "TrendingUp",
                "title": f"Top {c_col.replace('_', ' ').title()}",
                "question": f"What are the top 5 {c_col.replace('_', ' ')}s by total {n_col.replace('_', ' ')}?",
            })
        elif numeric_cols:
            suggestions.append({
                "category": "performance",
                "icon": "TrendingUp",
                "title": "Metric Summary",
                "question": f"What is the total and average {numeric_cols[0].replace('_', ' ')} across all records?",
            })

        # 2. Trend question (Time series / Temporal)
        if date_cols and numeric_cols:
            d_col = date_cols[0]
            n_col = numeric_cols[0]
            suggestions.append({
                "category": "trend",
                "icon": "Calendar",
                "title": f"{n_col.replace('_', ' ').title()} Over Time",
                "question": f"How has {n_col.replace('_', ' ')} trended over time grouped by {d_col.replace('_', ' ')}?",
            })
        elif len(numeric_cols) >= 2:
            suggestions.append({
                "category": "trend",
                "icon": "Sparkles",
                "title": "Metric Comparison",
                "question": f"Compare the total {numeric_cols[0].replace('_', ' ')} versus {numeric_cols[1].replace('_', ' ')}.",
            })

        # 3. Segmentation question (Category breakdown)
        if categorical_cols:
            cat = categorical_cols[1] if len(categorical_cols) > 1 else categorical_cols[0]
            suggestions.append({
                "category": "segmentation",
                "icon": "PieChart",
                "title": f"{cat.replace('_', ' ').title()} Distribution",
                "question": f"What is the percentage breakdown of records by {cat.replace('_', ' ')}?",
            })

        # 4. Anomaly / Outliers question
        if numeric_cols:
            n_col = numeric_cols[-1]
            suggestions.append({
                "category": "anomaly",
                "icon": "AlertTriangle",
                "title": "Outliers & Extremes",
                "question": f"Which records have the highest and lowest values for {n_col.replace('_', ' ')}?",
            })

        # 5. Additional categorical or distribution question
        if len(categorical_cols) >= 2:
            cat2 = categorical_cols[0]
            if not any(s["question"].endswith(f"by {cat2.replace('_', ' ')}?") for s in suggestions):
                suggestions.append({
                    "category": "segmentation",
                    "icon": "Layers",
                    "title": f"{cat2.replace('_', ' ').title()} Breakdown",
                    "question": f"Show the distribution of records grouped by {cat2.replace('_', ' ')}.",
                })

        # Ensure at least 4 suggestions are always provided
        if len(suggestions) < 4:
            fallbacks = [
                {
                    "category": "performance",
                    "icon": "TrendingUp",
                    "title": "Total Volume",
                    "question": "What is the total count of records and key metrics across the dataset?",
                },
                {
                    "category": "segmentation",
                    "icon": "PieChart",
                    "title": "Category Analysis",
                    "question": "What are the most frequent categories and distribution breakdown?",
                },
                {
                    "category": "anomaly",
                    "icon": "AlertTriangle",
                    "title": "Data Quality & Outliers",
                    "question": "Are there any anomalies, missing values, or unusual patterns in the dataset?",
                },
                {
                    "category": "trend",
                    "icon": "Sparkles",
                    "title": "Executive Overview",
                    "question": "Provide a high-level executive summary of this dataset.",
                },
            ]
            for fb in fallbacks:
                if len(suggestions) >= 4:
                    break
                if not any(s["question"] == fb["question"] for s in suggestions):
                    suggestions.append(fb)

        return suggestions[:6]

    async def generate_smart_suggestions(
        self,
        schema_info: Dict[str, Any],
        row_count: int = 0,
        preview_rows: Optional[List[Dict[str, Any]]] = None,
        preferred_provider: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Generate high-intelligence suggestions using LLM with instant heuristic fallback."""
        heuristic = self.generate_heuristic_suggestions(schema_info, row_count)

        # Build concise schema prompt
        prompt = f"""Dataset Profile:
Total Rows: {row_count}
Columns and Types: {json.dumps(schema_info, default=str)}
Sample Preview: {json.dumps(preview_rows[:2] if preview_rows else [], default=str)}

Generate 4 to 6 proactive analytical business questions."""

        try:
            resp = await self.router.generate(
                prompt=prompt,
                task_type="chat",
                preferred_provider=preferred_provider,
                system_instruction=self.SUGGESTIONS_SYSTEM_PROMPT,
                temperature=0.3,
                json_mode=True,
            )
            raw = resp.content.strip()
            if raw.startswith("```"):
                import re
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)

            parsed = json.loads(raw)
            suggestions = parsed.get("suggestions", [])
            if isinstance(suggestions, list) and len(suggestions) >= 3:
                return suggestions
        except Exception as e:
            logger.warning(f"[SuggestionsService] LLM suggestions failed: {e}. Using heuristics.")

        return heuristic
