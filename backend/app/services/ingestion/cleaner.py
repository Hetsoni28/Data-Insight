from typing import Any

import polars as pl


class DatasetCleaner:
    @staticmethod
    def clean_dataframe(df: pl.DataFrame) -> tuple[pl.DataFrame, dict[str, Any]]:
        """Cleans a DataFrame and returns the cleaned version plus full dynamic metrics.

        Cleaning steps:
          1. Drop complete duplicate rows
          2. Drop fully empty rows
          3. Fill null values (numeric → median, text/boolean → "Unknown")

        Returns:
          (df_cleaned, metrics) where metrics contains real counts for every operation.
        """
        try:
            initial_rows = len(df)

            # Count total nulls BEFORE cleaning (for the quality report)
            total_nulls_before = sum(int(df[col].null_count()) for col in df.columns)

            # ── Step 1: Drop complete duplicates ──────────────────────────────
            df_cleaned = df.unique()
            after_dedup_rows = len(df_cleaned)
            duplicates_removed = initial_rows - after_dedup_rows

            # ── Step 2: Drop fully empty rows ─────────────────────────────────
            df_cleaned = df_cleaned.filter(~pl.all_horizontal(pl.all().is_null()))
            after_empty_rows = len(df_cleaned)
            empty_rows_removed = after_dedup_rows - after_empty_rows

            # ── Step 3: Fill null values per column ───────────────────────────
            num_types = (
                pl.Float32, pl.Float64,
                pl.Int8, pl.Int16, pl.Int32, pl.Int64,
                pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64,
            )

            null_fill_map: dict[str, Any] = {}  # col_name → what it was filled with
            fill_expressions = []
            nulls_filled = 0

            for col in df_cleaned.columns:
                col_null_count = int(df_cleaned[col].null_count())
                if col_null_count == 0:
                    continue  # Nothing to fill — skip

                nulls_filled += col_null_count

                if df_cleaned[col].dtype in num_types:
                    # Numeric → fill with median of that column (ignores nulls)
                    non_null = df_cleaned[col].drop_nulls()
                    if len(non_null) > 0:
                        median_val = float(non_null.median() or 0)
                        fill_val = round(median_val, 4)
                    else:
                        fill_val = 0.0
                    fill_expressions.append(
                        pl.col(col).fill_null(fill_val)
                    )
                    null_fill_map[col] = f"median ({fill_val:,})"
                else:
                    # Text / boolean / date → fill with "Unknown"
                    fill_expressions.append(
                        pl.col(col).fill_null(pl.lit("Unknown").cast(df_cleaned[col].dtype))
                    )
                    null_fill_map[col] = '"Unknown"'

            if fill_expressions:
                df_cleaned = df_cleaned.with_columns(fill_expressions)

            # Count nulls AFTER all cleaning
            total_nulls_after = sum(int(df_cleaned[col].null_count()) for col in df_cleaned.columns)

            metrics = {
                "initial_rows":       initial_rows,
                "final_rows":         len(df_cleaned),
                "duplicates_removed": duplicates_removed,
                "empty_rows_removed": empty_rows_removed,
                "nulls_filled":       nulls_filled,
                "total_nulls_before": total_nulls_before,
                "total_nulls_after":  total_nulls_after,
                "null_fill_map":      null_fill_map,
            }

            return df_cleaned, metrics

        except Exception as e:
            raise Exception(f"Failed to clean dataset: {e!s}")
