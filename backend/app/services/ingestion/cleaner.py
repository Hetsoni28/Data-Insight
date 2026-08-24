import polars as pl
from typing import Dict, Any, Tuple

class DatasetCleaner:
    @staticmethod
    def clean_dataframe(df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """
        Applies data quality cleaning via Polars.
        Returns the cleaned DataFrame and metrics on what was cleaned.
        """
        try:
            initial_rows = len(df)
            
            # 1. Drop complete duplicates
            df_cleaned = df.unique()
            after_dedup_rows = len(df_cleaned)
            duplicates_removed = initial_rows - after_dedup_rows
            
            # 2. Drop completely empty rows (structural misalignments)
            df_cleaned = df_cleaned.filter(~pl.all_horizontal(pl.all().is_null()))
            after_empty_rows = len(df_cleaned)
            empty_rows_removed = after_dedup_rows - after_empty_rows
            
            metrics = {
                "initial_rows": initial_rows,
                "final_rows": len(df_cleaned),
                "duplicates_removed": duplicates_removed,
                "empty_rows_removed": empty_rows_removed,
            }
            
            return df_cleaned, metrics
            
        except Exception as e:
            raise Exception(f"Failed to clean dataset: {str(e)}")
