"""Automated AI Narrative & Executive Dataset Report Generator."""

from __future__ import annotations

import json
import logging
import re
from typing import Dict, Any, Optional

from app.core.exceptions import AIServiceException
from app.services.ai.router import LLMRouter

logger = logging.getLogger(__name__)


class NarrativeGenerator:
    """Generates structured, executive-grade business narratives from dataset profiling statistics."""

    NARRATIVE_SYSTEM_PROMPT = """You are a Principal Business Intelligence Strategist and Chief Analytics Officer.
You analyze raw statistical profiles and correlation metrics of enterprise datasets to generate authoritative, publication-grade analytical reports.

Your report must strictly follow this JSON schema:
{
  "executive_summary": "A 2-paragraph C-level summary outlining the scope, primary drivers, and health of the dataset.",
  "key_drivers": [
    {
      "title": "Driver name or key metric",
      "description": "Detailed explanation of statistical distribution, mean, variance, and significance."
    }
  ],
  "correlation_insights": [
    {
      "variables": ["var1", "var2"],
      "correlation": 0.85,
      "interpretation": "Business interpretation of the relationship between these variables."
    }
  ],
  "anomalies_and_risks": [
    {
      "column": "Column name",
      "risk_level": "HIGH | MEDIUM | LOW",
      "description": "Details regarding missing values, extreme outliers, or skewness."
    }
  ],
  "growth_opportunities": [
    {
      "title": "Opportunity title",
      "impact": "HIGH | MEDIUM",
      "detail": "Actionable business growth or optimization angle."
    }
  ],
  "strategic_recommendations": [
    {
      "priority": 1,
      "action": "Clear, concise imperative action statement",
      "rationale": "Why this action is justified by the data."
    }
  ]
}

CRITICAL RULES:
- Output valid JSON only. Do not wrap in markdown ```json blocks.
- Use actual numbers, column names, and metrics provided in the dataset profile. Never invent dummy columns or fake figures.
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    def _prepare_profile_summary(self, profile: Dict[str, Any], correlations: Optional[Dict[str, Any]] = None) -> str:
        """Create a compact, highly informative summary of the dataset profile for the prompt."""
        overview = profile.get("overview", {})
        quality = profile.get("quality_score", {})
        columns_profile = profile.get("columns", {})

        summary_dict = {
            "dataset_overview": {
                "total_rows": overview.get("row_count"),
                "total_columns": overview.get("column_count"),
                "memory_size_mb": overview.get("memory_size_mb"),
                "duplicate_rows": overview.get("duplicate_rows"),
            },
            "quality_grade": {
                "overall_score": quality.get("overall_score"),
                "grade": quality.get("grade"),
                "completeness": quality.get("completeness_score"),
                "uniqueness": quality.get("uniqueness_score"),
            },
            "column_metrics": {},
        }

        # Include summary stats for top columns
        for col_name, col_data in list(columns_profile.items())[:30]:
            col_type = col_data.get("inferred_type")
            stats = col_data.get("statistics", {})
            summary_dict["column_metrics"][col_name] = {
                "type": col_type,
                "null_percentage": col_data.get("null_percentage"),
                "unique_count": col_data.get("unique_count"),
                "summary": stats,
            }

        if correlations:
            summary_dict["significant_correlations"] = correlations.get("significant_correlations", [])[:15]

        return json.dumps(summary_dict, indent=2, default=str)

    async def generate_narrative(
        self,
        dataset_name: str,
        profile: Dict[str, Any],
        correlations: Optional[Dict[str, Any]] = None,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate comprehensive 5-tier business report narrative."""
        profile_summary = self._prepare_profile_summary(profile, correlations)

        prompt = f"""Dataset Name: "{dataset_name}"

Dataset Statistical Profile & Metadata:
{profile_summary}

Generate the comprehensive executive narrative analysis."""

        response = await self.router.generate(
            prompt=prompt,
            task_type="deep_report",
            preferred_provider=preferred_provider,
            system_instruction=self.NARRATIVE_SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=4096,
            json_mode=True,
        )

        raw_json = response.content.strip()
        if raw_json.startswith("```"):
            raw_json = re.sub(r"^```(?:json)?\s*", "", raw_json)
            raw_json = re.sub(r"\s*```$", "", raw_json)

        try:
            report_data = json.loads(raw_json)
        except Exception as e:
            logger.warning(f"[NarrativeGenerator] JSON parsing failed: {e}. Fallback structure applied.")
            report_data = {
                "executive_summary": response.content,
                "key_drivers": [],
                "correlation_insights": [],
                "anomalies_and_risks": [],
                "growth_opportunities": [],
                "strategic_recommendations": [],
            }

        return {
            "dataset_name": dataset_name,
            "report": report_data,
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "total_tokens": response.total_tokens,
            "cost_usd": response.cost_usd,
            "latency_ms": response.latency_ms,
            "provider": response.provider,
            "model": response.model,
        }
