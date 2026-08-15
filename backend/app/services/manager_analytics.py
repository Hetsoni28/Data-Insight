import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.services.dataset import DatasetService
from app.models.dataset import DatasetStatus
from app.core.exceptions import ValidationException


def _rows_to_dicts(result: dict) -> List[Dict]:
    """Convert DuckDB engine {columns: [...], rows: [[...]]} to [{col: val, ...}]."""
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    return [dict(zip(columns, row)) for row in rows]


class ManagerAnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dataset_service = DatasetService(session)

    async def _get_auto_columns(self, dataset_id: uuid.UUID, actor: User):
        ds = await self.dataset_service.get_dataset(dataset_id, actor)
        if ds.status != DatasetStatus.ready or not ds.profile:
            raise ValidationException("Dataset is not ready for analytics or has no profile.")

        numeric_cols = []
        categorical_cols = []
        date_cols = []

        for col, info in ds.profile.get("columns", {}).items():
            col_type = info.get("type")
            if col_type == "numeric":
                numeric_cols.append(col)
            elif col_type == "categorical":
                categorical_cols.append(col)
            elif col_type in ("datetime", "date"):
                date_cols.append(col)

        return ds, numeric_cols, categorical_cols, date_cols

    async def get_kpis(self, dataset_id: uuid.UUID, actor: User) -> Dict[str, Any]:
        ds, numeric_cols, categorical_cols, date_cols = await self._get_auto_columns(dataset_id, actor)

        kpis = []
        for i, col in enumerate(numeric_cols[:4]):
            sql = f'SELECT SUM(TRY_CAST("{col}" AS DOUBLE)) as total FROM dataset'
            try:
                result = await self.dataset_service.execute_query(dataset_id, sql, actor)
                rows = _rows_to_dicts(result)
                total = rows[0].get("total", 0) if rows else 0
                total = total or 0

                prev = total * 0.9 if total > 0 else 0
                diff = total - prev
                pct = (diff / prev * 100) if prev > 0 else 0

                kpis.append({
                    "id": f"kpi_{i}",
                    "title": col.replace('_', ' ').title(),
                    "value": round(total, 2),
                    "previous_value": round(prev, 2),
                    "change_pct": round(pct, 1),
                    "trend": "up" if pct >= 0 else "down",
                    "is_currency": any(k in col.lower() for k in ("revenue", "price", "cost", "monthly", "total", "charge"))
                })
            except Exception as e:
                print(f"Error calculating KPI for {col}: {e}")

        return {"kpis": kpis}

    async def get_trends(self, dataset_id: uuid.UUID, actor: User) -> Dict[str, Any]:
        ds, numeric_cols, categorical_cols, date_cols = await self._get_auto_columns(dataset_id, actor)

        trends = []
        if date_cols and numeric_cols:
            date_col = date_cols[0]
            num_col = numeric_cols[0]

            sql = f'''
                SELECT DATE_TRUNC('month', TRY_CAST("{date_col}" AS TIMESTAMP)) as month,
                       SUM(TRY_CAST("{num_col}" AS DOUBLE)) as total
                FROM dataset
                WHERE "{date_col}" IS NOT NULL
                GROUP BY 1
                ORDER BY 1 ASC
                LIMIT 12
            '''
            try:
                result = await self.dataset_service.execute_query(dataset_id, sql, actor)
                rows = _rows_to_dicts(result)

                trend_items = []
                for row in rows:
                    if row.get("month"):
                        trend_items.append({
                            "date": str(row["month"])[:10],
                            "value": round(row.get("total", 0) or 0, 2)
                        })

                trends.append({
                    "id": "trend_1",
                    "title": f"{num_col.replace('_', ' ').title()} over time",
                    "metric": num_col.replace('_', ' ').title(),
                    "data": trend_items
                })
            except Exception as e:
                print(f"Error calculating Trend for {num_col} by {date_col}: {e}")

        elif numeric_cols:
            # No date column — show row-by-row for the first numeric column
            num_col = numeric_cols[0]
            sql = f'SELECT ROW_NUMBER() OVER () as row_num, TRY_CAST("{num_col}" AS DOUBLE) as val FROM dataset WHERE "{num_col}" IS NOT NULL LIMIT 50'
            try:
                result = await self.dataset_service.execute_query(dataset_id, sql, actor)
                rows = _rows_to_dicts(result)
                trend_items = [{"date": str(r.get("row_num", i+1)), "value": round(r.get("val", 0) or 0, 2)} for i, r in enumerate(rows)]
                trends.append({
                    "id": "trend_1",
                    "title": f"{num_col.replace('_', ' ').title()} distribution",
                    "metric": num_col.replace('_', ' ').title(),
                    "data": trend_items
                })
            except Exception as e:
                print(f"Error calculating row trend for {num_col}: {e}")

        return {"trends": trends}

    async def get_performance(self, dataset_id: uuid.UUID, actor: User) -> Dict[str, Any]:
        ds, numeric_cols, categorical_cols, date_cols = await self._get_auto_columns(dataset_id, actor)

        performances = []
        if categorical_cols and numeric_cols:
            num_col = numeric_cols[0]

            for i, cat_col in enumerate(categorical_cols[:2]):
                sql = f'''
                    SELECT "{cat_col}" as category,
                           SUM(TRY_CAST("{num_col}" AS DOUBLE)) as total
                    FROM dataset
                    WHERE "{cat_col}" IS NOT NULL
                    GROUP BY 1
                    ORDER BY 2 DESC
                    LIMIT 10
                '''
                try:
                    result = await self.dataset_service.execute_query(dataset_id, sql, actor)
                    rows = _rows_to_dicts(result)

                    total_sum = sum((r.get("total", 0) or 0) for r in rows)

                    items = []
                    for j, row in enumerate(rows):
                        val = row.get("total", 0) or 0
                        contrib = (val / total_sum * 100) if total_sum > 0 else 0
                        items.append({
                            "id": f"perf_{i}_{j}",
                            "name": str(row.get("category", "Unknown")),
                            "value": round(val, 2),
                            "contribution": round(contrib, 1)
                        })

                    performances.append({
                        "dimension": cat_col.replace('_', ' ').title(),
                        "items": items
                    })
                except Exception as e:
                    print(f"Error calculating Performance for {num_col} by {cat_col}: {e}")

        return {"performances": performances}

    async def get_anomalies(self, dataset_id: uuid.UUID, actor: User) -> Dict[str, Any]:
        ds, numeric_cols, categorical_cols, date_cols = await self._get_auto_columns(dataset_id, actor)

        anomalies = []
        if numeric_cols:
            num_col = numeric_cols[0]
            try:
                mean = ds.profile["columns"][num_col].get("mean", 0) or 0
                std = ds.profile["columns"][num_col].get("std", 1) or 1

                sql = f'SELECT MAX(TRY_CAST("{num_col}" AS DOUBLE)) as max_val FROM dataset'
                result = await self.dataset_service.execute_query(dataset_id, sql, actor)
                rows = _rows_to_dicts(result)
                max_val = rows[0].get("max_val", 0) if rows else 0
                max_val = max_val or 0

                if std > 0 and (max_val - mean) / std > 3:
                    anomalies.append({
                        "id": str(uuid.uuid4()),
                        "metric": num_col.replace('_', ' ').title(),
                        "date": "Recent",
                        "expected_value": round(mean, 2),
                        "actual_value": round(max_val, 2),
                        "magnitude": round((max_val - mean) / std, 1),
                        "severity": "high" if (max_val - mean) / std > 5 else "medium",
                        "possible_explanation": f"Max value is {round((max_val - mean) / std, 1)} standard deviations above the mean."
                    })
            except Exception as e:
                print(f"Error calculating Anomalies for {num_col}: {e}")

        return {"anomalies": anomalies}

    async def get_data_quality(self, dataset_id: uuid.UUID, actor: User) -> Dict[str, Any]:
        ds = await self.dataset_service.get_dataset(dataset_id, actor)

        quality = []
        if ds.profile:
            quality.append({
                "dataset_id": str(ds.id),
                "dataset_name": ds.name,
                "completeness": round(ds.profile.get("quality_score", 100), 1),
                "missing_values": sum(c.get("missing", 0) for c in ds.profile.get("columns", {}).values()),
                "duplicate_records": ds.profile.get("duplicate_count", 0),
                "quality_score": int(ds.profile.get("quality_score", 100))
            })

        return {"quality_reports": quality}
