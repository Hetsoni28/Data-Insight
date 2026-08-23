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
  "customerBehavior": "Analysis of customer behavior, segments, or cohort patterns based on the dataset.",
  "businessTrends": "A high-level overview of overarching business trends over time.",
  "revenueDrivers": "Analysis of primary revenue or conversion drivers.",
  "profitability": "Analysis of profitability, margins, cost efficiency, or unit economics.",
  "salesPerformance": "Analysis of sales velocity, win rates, or performance metrics.",
  "dataDistribution": "Analysis of how key numeric or categorical data is distributed.",
  "correlations": "Identification of any highly correlated variables and their business impact.",
  "seasonality": "Analysis of temporal seasonality, cyclic patterns, or time-based trends.",
  "aiInsights": [
    "Insight 1 (string)",
    "Insight 2 (string)"
  ],
  "businessRisks": [
    "Risk 1 (string)",
    "Risk 2 (string)"
  ],
  "businessRecommendations": [
    "Recommendation 1 (string)",
    "Recommendation 2 (string)"
  ],
  "forecastOpportunities": [
    "Opportunity 1 (string)"
  ],
  "departmentPerformance": "Brief summary of performance across different departments if applicable."
}

CRITICAL RULES:
- Output valid JSON only. Do not wrap in markdown ```json blocks.
- Use actual numbers, column names, and metrics provided in the dataset profile. Never invent dummy columns or fake figures.
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    def _prepare_profile_summary(self, profile: Dict[str, Any], correlations: Optional[Dict[str, Any]] = None) -> str:
        """Create a compact, highly informative summary of the dataset profile for the prompt."""
        overview = profile.get("overview", {}) # Note: profiler.py returns top-level row_count etc., let's handle both
        
        # In the new DataProfiler, these are top-level keys. Fallback to overview dict if not found.
        row_count = profile.get("row_count", overview.get("row_count"))
        column_count = profile.get("column_count", overview.get("column_count"))
        memory_size_mb = profile.get("memory_usage_mb", overview.get("memory_size_mb"))
        duplicate_rows = profile.get("duplicate_rows", overview.get("duplicate_rows"))

        # In DataProfiler, quality metrics are top-level
        overall_score = profile.get("quality_score")
        grade = profile.get("quality_grade")
        
        quality_breakdown = profile.get("quality_breakdown", {})
        completeness = quality_breakdown.get("completeness")
        uniqueness = quality_breakdown.get("uniqueness")
        
        columns_profile = profile.get("columns", {})

        summary_dict = {
            "dataset_overview": {
                "total_rows": row_count,
                "total_columns": column_count,
                "memory_size_mb": memory_size_mb,
                "duplicate_rows": duplicate_rows,
            },
            "quality_grade": {
                "overall_score": overall_score,
                "grade": grade,
                "completeness": completeness,
                "uniqueness": uniqueness,
            },
            "column_metrics": {},
        }

        # Include summary stats for top columns
        for col_name, col_data in list(columns_profile.items())[:30]:
            col_type = col_data.get("inferred_type") or col_data.get("type") or col_data.get("dtype")
            stats = col_data.get("statistics", {})
            summary_dict["column_metrics"][col_name] = {
                "type": col_type,
                "null_percentage": col_data.get("null_percentage") or col_data.get("null_pct"),
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
                "datasetSummary": response.content,
                "companyOverview": "",
                "businessHighlights": [],
                "executiveKPIs": [],
                "revenueOverview": "",
                "profitAnalysis": "",
                "growthAnalysis": "",
                "topInsights": [],
                "potentialRisks": [],
                "executiveConclusion": "",
                "keyRecommendations": [],
                "managementActionPlan": []
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
