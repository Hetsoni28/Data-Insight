"""AI Data Cleaning Agent - analyzes sample data to suggest Polars-based cleaning operations."""

import json
import logging
from typing import Dict, Any, List, Optional
import polars as pl
from app.services.ai.router import LLMRouter

logger = logging.getLogger(__name__)

class CleaningAgent:
    SYSTEM_PROMPT = """You are an expert Data Engineer. 
Analyze the provided dataset schema and a random sample of rows.
Suggest strict data cleaning operations to improve data quality.
Valid operations are:
- 'fill_null' : Replace nulls with a reasonable default (requires 'value' field).
- 'drop_null_rows' : Drop entire rows if this column is null.
- 'drop_duplicates' : Drop duplicate rows across the whole dataset (column field can be '*').
- 'to_uppercase' : Convert string column to uppercase.
- 'trim_whitespace' : Trim whitespace from string column.

Output pure JSON only, as a list of operations:
[
  {
    "column": "status",
    "operation": "fill_null",
    "value": "Unknown",
    "reason": "Found nulls in status, filling with Unknown."
  },
  {
    "column": "*",
    "operation": "drop_duplicates",
    "reason": "Standard practice to remove duplicate rows."
  }
]
"""

    def __init__(self, router: LLMRouter):
        self.router = router

    async def suggest_cleaning(self, df: pl.DataFrame, schema_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Take a sample of rows
        sample_df = df.head(50)
        sample_rows = sample_df.to_dicts()
        
        schema_context = "Columns:\n"
        for col, dtype in schema_info.items():
            schema_context += f" - {col} ({dtype})\n"
            
        prompt = f"""Dataset Schema:
{schema_context}

Sample Data:
{json.dumps(sample_rows, default=str)}

Suggest 3 to 5 cleaning operations."""

        response = await self.router.generate(
            prompt=prompt,
            task_type="cleaning",
            system_instruction=self.SYSTEM_PROMPT,
            temperature=0.0,
            json_mode=True
        )
        
        raw_json = response.content.strip()
        import re
        if raw_json.startswith("``"):
            raw_json = re.sub(r"^`(?:json)?\s*", "", raw_json)
            raw_json = re.sub(r"\s*`$", "", raw_json)
            
        try:
            suggestions = json.loads(raw_json)
            if not isinstance(suggestions, list):
                suggestions = [suggestions]
            return suggestions
        except Exception as e:
            logger.error(f"Failed to parse cleaning suggestions: {e}")
            return []

    def apply_operations(self, df: pl.DataFrame, operations: List[Dict[str, Any]]) -> pl.DataFrame:
        df_cleaned = df.clone()
        for op in operations:
            col = op.get("column")
            operation = op.get("operation")
            val = op.get("value")
            
            if operation == "drop_duplicates":
                df_cleaned = df_cleaned.unique()
            elif operation == "drop_null_rows" and col in df_cleaned.columns:
                df_cleaned = df_cleaned.filter(pl.col(col).is_not_null())
            elif operation == "fill_null" and col in df_cleaned.columns:
                df_cleaned = df_cleaned.with_columns(pl.col(col).fill_null(val))
            elif operation == "to_uppercase" and col in df_cleaned.columns:
                df_cleaned = df_cleaned.with_columns(pl.col(col).str.to_uppercase())
            elif operation == "trim_whitespace" and col in df_cleaned.columns:
                df_cleaned = df_cleaned.with_columns(pl.col(col).str.strip_chars())
                
        return df_cleaned
