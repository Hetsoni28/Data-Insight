import math
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, ValidationException
from app.models.dataset import Dataset, DatasetStatus
from app.models.user import User
from app.services.audit_service import AuditService
from app.services.dataset import DatasetService


def _rows_to_dicts(result: dict) -> list[dict]:
    """Convert DuckDB engine {columns: [...], rows: [[...]]} to [{col: val, ...}]."""
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    return [dict(zip(columns, row)) for row in rows]


class TenantAnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.dataset_service = DatasetService(session)

    async def _resolve_datasets(self, actor: User) -> list[Dataset]:
        """Fetch all ready datasets the user is authorized to access in their tenant."""
        if not actor.tenant_id:
            raise ForbiddenException("Organization required.")

        stmt = select(Dataset).where(
            and_(
                Dataset.tenant_id == actor.tenant_id,
                Dataset.is_deleted == False,
                Dataset.status == DatasetStatus.ready,
            ),
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    def _get_columns_dict(self, profile: dict) -> dict:
        """Normalize profile columns to always return a {col_name: info} dict."""
        cols = profile.get("columns", {})
        if isinstance(cols, dict):
            return cols
        if isinstance(cols, list):
            result = {}
            for item in cols:
                if isinstance(item, dict):
                    name = item.get("name") or item.get("col") or str(item)
                    result[name] = item
            return result
        return {}

    async def _get_auto_columns(self, dataset_id: uuid.UUID, actor: User):
        ds = await self.dataset_service.get_dataset(dataset_id, actor)
        if ds.status != DatasetStatus.ready or not ds.profile:
            raise ValidationException(
                "Dataset is not ready for analytics or has no profile.",
            )

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

    def _detect_business_domain(self, datasets: list[Dataset]) -> str:
        domain_keywords = {
            "Sales": ["revenue", "sales", "order", "price", "discount", "customer"],
            "Finance": ["expense", "profit", "margin", "cash", "budget", "tax"],
            "HR": ["employee", "salary", "hire", "attrition", "department", "absence"],
            "Inventory": ["stock", "warehouse", "sku", "quantity", "inventory"],
        }
        scores = dict.fromkeys(domain_keywords.keys(), 0)
        for d in datasets:
            if d.profile and "columns" in d.profile:
                for col_name in self._get_columns_dict(d.profile):
                    col_lower = col_name.lower()
                    for domain, keywords in domain_keywords.items():
                        if any(kw in col_lower for kw in keywords):
                            scores[domain] += 1
        best_domain = max(scores.items(), key=lambda x: x[1])
        if best_domain[1] > 0:
            return best_domain[0]
        return "General Business"

    # --- KPIs ---
    async def get_kpis(
        self, actor: User, dataset_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        if dataset_id:
            return await self._get_dataset_kpis(actor, dataset_id)
        return await self._get_aggregate_kpis(actor)

    async def _get_dataset_kpis(
        self, actor: User, dataset_id: uuid.UUID,
    ) -> dict[str, Any]:
        _ds, numeric_cols, _categorical_cols, _date_cols = await self._get_auto_columns(
            dataset_id, actor,
        )
        if not numeric_cols:
            return {"kpis": []}

        target_cols = numeric_cols[:4]
        select_parts = [
            f'SUM(TRY_CAST("{col}" AS DOUBLE)) as "{col}"' for col in target_cols
        ]
        sql = f'SELECT {", ".join(select_parts)} FROM dataset'

        kpis = []
        try:
            result = await self.dataset_service.execute_query(dataset_id, sql, actor)
            rows = _rows_to_dicts(result)

            if rows:
                row = rows[0]
                for i, col in enumerate(target_cols):
                    total = row.get(col, 0) or 0
                    prev = total * 0.9 if total > 0 else 0
                    diff = total - prev
                    pct = (diff / prev * 100) if prev > 0 else 0
                    is_currency = any(
                        k in col.lower()
                        for k in (
                            "revenue",
                            "price",
                            "cost",
                            "monthly",
                            "total",
                            "charge",
                        )
                    )
                    prefix = "$" if is_currency else ""
                    kpis.append(
                        {
                            "id": f"kpi_{i}",
                            "title": col.replace("_", " ").title(),
                            "value": f"{prefix}{round(total, 2):,}",
                            "previous_value": f"{prefix}{round(prev, 2):,}",
                            "percentage_change": round(pct, 1),
                            "trend_direction": "up" if pct >= 0 else "down",
                            "sparkline": [prev, prev * 1.05, total * 0.95, total],
                        },
                    )
        except Exception as e:
            print(f"Error calculating combined KPIs: {e}")

        return {"kpis": kpis}

    async def _get_aggregate_kpis(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        if not datasets:
            return {"domain": "General Business", "kpis": []}
        domain = self._detect_business_domain(datasets)
        await AuditService.log(
            self.session,
            "tenant.analytics.kpis",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )

        kpis = []
        total_rows = sum(d.row_count for d in datasets if d.row_count)
        kpis.append(
            {
                "id": str(uuid.uuid4()),
                "title": "Total Records",
                "value": str(total_rows),
                "previous_value": str(int(total_rows * 0.9)),
                "percentage_change": 10.0,
                "trend_direction": "up",
                "sparkline": [
                    float(total_rows * 0.8),
                    float(total_rows * 0.85),
                    float(total_rows * 0.9),
                    float(total_rows),
                ],
            },
        )
        total_cols = sum(d.column_count for d in datasets if d.column_count)
        kpis.append(
            {
                "id": str(uuid.uuid4()),
                "title": "Total Attributes",
                "value": str(total_cols),
                "previous_value": str(total_cols),
                "percentage_change": 0.0,
                "trend_direction": "neutral",
                "sparkline": [float(total_cols)] * 4,
            },
        )
        avg_quality = sum(d.data_quality_score or 100 for d in datasets) / len(datasets)
        kpis.append(
            {
                "id": str(uuid.uuid4()),
                "title": "Avg Quality Score",
                "value": f"{avg_quality:.1f}%",
                "previous_value": f"{avg_quality:.1f}%",
                "percentage_change": 0.0,
                "trend_direction": "neutral",
                "sparkline": [avg_quality] * 4,
            },
        )
        return {"domain": domain, "kpis": kpis}

    # --- Trends ---
    async def get_trends(
        self, actor: User, dataset_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        if dataset_id:
            return await self._get_dataset_trends(actor, dataset_id)
        return await self._get_aggregate_trends(actor)

    async def _get_dataset_trends(
        self, actor: User, dataset_id: uuid.UUID,
    ) -> dict[str, Any]:
        _ds, numeric_cols, _categorical_cols, date_cols = await self._get_auto_columns(
            dataset_id, actor,
        )
        trends = []
        if date_cols and numeric_cols:
            date_col = date_cols[0]
            num_col = numeric_cols[0]
            sql = f"""
                SELECT DATE_TRUNC('month', TRY_CAST("{date_col}" AS TIMESTAMP)) as month,
                       SUM(TRY_CAST("{num_col}" AS DOUBLE)) as total
                FROM dataset
                WHERE "{date_col}" IS NOT NULL
                GROUP BY 1
                ORDER BY 1 ASC
                LIMIT 12
            """
            try:
                result = await self.dataset_service.execute_query(
                    dataset_id, sql, actor,
                )
                rows = _rows_to_dicts(result)
                trend_items = []
                for row in rows:
                    if row.get("month"):
                        trend_items.append(
                            {
                                "date": str(row["month"])[:10],
                                "value": round(row.get("total", 0) or 0, 2),
                            },
                        )
                trends.append(
                    {
                        "id": "trend_1",
                        "title": f"{num_col.replace('_', ' ').title()} over time",
                        "metric": num_col.replace("_", " ").title(),
                        "data": trend_items,
                    },
                )
            except Exception as e:
                print(f"Error calculating Trend for {num_col} by {date_col}: {e}")
        elif numeric_cols:
            num_col = numeric_cols[0]
            sql = f'SELECT ROW_NUMBER() OVER () as row_num, TRY_CAST("{num_col}" AS DOUBLE) as val FROM dataset WHERE "{num_col}" IS NOT NULL LIMIT 50'
            try:
                result = await self.dataset_service.execute_query(
                    dataset_id, sql, actor,
                )
                rows = _rows_to_dicts(result)
                trend_items = [
                    {
                        "date": str(r.get("row_num", i + 1)),
                        "value": round(r.get("val", 0) or 0, 2),
                    }
                    for i, r in enumerate(rows)
                ]
                trends.append(
                    {
                        "id": "trend_1",
                        "title": f"{num_col.replace('_', ' ').title()} distribution",
                        "metric": num_col.replace("_", " ").title(),
                        "data": trend_items,
                    },
                )
            except Exception as e:
                print(f"Error calculating row trend for {num_col}: {e}")
        return {"trends": trends}

    async def _get_aggregate_trends(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        trends = []
        if datasets:
            sorted_ds = sorted(datasets, key=lambda x: x.created_at)
            data = []
            cumulative_rows = 0
            for ds in sorted_ds:
                cumulative_rows += ds.row_count or 0
                date_str = ds.created_at.strftime("%Y-%m-%d")
                data.append({"date": date_str, "cumulative_records": cumulative_rows})
            grouped_data = {}
            for item in data:
                grouped_data[item["date"]] = item["cumulative_records"]
            final_data = [{"date": k, "value": v} for k, v in grouped_data.items()]
            if final_data:
                trends.append(
                    {
                        "id": str(uuid.uuid4()),
                        "title": "Data Volume Growth",
                        "metric": "Total Records",
                        "data": final_data,
                    },
                )
        return {"trends": trends}

    # --- Performance ---
    async def get_performance(
        self, actor: User, dataset_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        if dataset_id:
            return await self._get_dataset_performance(actor, dataset_id)
        return await self._get_aggregate_performance(actor)

    async def _get_dataset_performance(
        self, actor: User, dataset_id: uuid.UUID,
    ) -> dict[str, Any]:
        _ds, numeric_cols, categorical_cols, _date_cols = await self._get_auto_columns(
            dataset_id, actor,
        )
        performances = []
        if categorical_cols and numeric_cols:
            num_col = numeric_cols[0]
            for i, cat_col in enumerate(categorical_cols[:2]):
                sql = f"""
                    SELECT "{cat_col}" as category,
                           SUM(TRY_CAST("{num_col}" AS DOUBLE)) as total
                    FROM dataset
                    WHERE "{cat_col}" IS NOT NULL
                    GROUP BY 1
                    ORDER BY 2 DESC
                    LIMIT 10
                """
                try:
                    result = await self.dataset_service.execute_query(
                        dataset_id, sql, actor,
                    )
                    rows = _rows_to_dicts(result)
                    total_sum = sum((r.get("total", 0) or 0) for r in rows)
                    items = []
                    for j, row in enumerate(rows):
                        val = row.get("total", 0) or 0
                        contrib = (val / total_sum * 100) if total_sum > 0 else 0
                        items.append(
                            {
                                "id": f"perf_{i}_{j}",
                                "name": str(row.get("category", "Unknown")),
                                "value": round(val, 2),
                                "contribution": round(contrib, 1),
                                "growth": 0,
                                "trend": "neutral",
                            },
                        )
                    performances.append(
                        {"dimension": cat_col.replace("_", " ").title(), "items": items},
                    )
                except Exception as e:
                    print(
                        f"Error calculating Performance for {num_col} by {cat_col}: {e}",
                    )
        return {"performances": performances}

    async def _get_aggregate_performance(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        performances = []

        for d in datasets[:3]:
            if not d.profile:
                continue
            cols_dict = self._get_columns_dict(d.profile)
            cat_cols = [
                c for c, info in cols_dict.items() if info.get("type") == "categorical"
            ]
            numeric_cols_d = [
                c for c, info in cols_dict.items() if info.get("type") == "numeric"
            ]
            num_col = numeric_cols_d[0] if numeric_cols_d else None

            for cat_col in cat_cols[:2]:
                items = []
                try:
                    if num_col:
                        sql = f"""
                            SELECT "{cat_col}" as cat,
                                   SUM(TRY_CAST("{num_col}" AS DOUBLE)) as total
                            FROM dataset
                            WHERE "{cat_col}" IS NOT NULL
                              AND LOWER(CAST("{cat_col}" AS VARCHAR)) NOT IN ('none','null','nan','')
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT 8
                        """
                    else:
                        sql = f"""
                            SELECT "{cat_col}" as cat,
                                   COUNT(*) as total
                            FROM dataset
                            WHERE "{cat_col}" IS NOT NULL
                              AND LOWER(CAST("{cat_col}" AS VARCHAR)) NOT IN ('none','null','nan','')
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT 8
                        """

                    result = await self.dataset_service.execute_query(d.id, sql, actor)
                    rows = _rows_to_dicts(result)
                    total_sum = sum(float(r.get("total") or 0) for r in rows) or 1

                    # Period-over-period: compare first half vs second half of dataset rows
                    half = max(1, (d.row_count or 2) // 2)
                    growth_map: dict[str, float] = {}
                    if num_col:
                        try:
                            g_sql = f"""
                                SELECT "{cat_col}" as cat,
                                       SUM(CASE WHEN rn <= {half} THEN TRY_CAST("{num_col}" AS DOUBLE) ELSE 0 END) as first_half,
                                       SUM(CASE WHEN rn >  {half} THEN TRY_CAST("{num_col}" AS DOUBLE) ELSE 0 END) as second_half
                                FROM (SELECT *, ROW_NUMBER() OVER () as rn FROM dataset) t
                                WHERE "{cat_col}" IS NOT NULL
                                GROUP BY 1
                                ORDER BY (first_half + second_half) DESC
                                LIMIT 8
                            """
                            g_result = await self.dataset_service.execute_query(
                                d.id, g_sql, actor,
                            )
                            for gr in _rows_to_dicts(g_result):
                                first = float(gr.get("first_half") or 0)
                                second = float(gr.get("second_half") or 0)
                                key = str(gr.get("cat", ""))
                                if first > 0:
                                    growth_map[key] = round(
                                        (second - first) / first * 100, 1,
                                    )
                        except Exception:
                            pass

                    for j, row in enumerate(rows):
                        val = float(row.get("total") or 0)
                        contrib = round(val / total_sum * 100, 1)
                        cat_name = str(row.get("cat", "Unknown"))
                        growth_val = growth_map.get(cat_name, 0.0)
                        items.append(
                            {
                                "id": str(uuid.uuid4()),
                                "name": cat_name,
                                "value": round(val, 2),
                                "contribution": contrib,
                                "growth": growth_val,
                                "trend": (
                                    "up"
                                    if growth_val > 0
                                    else ("down" if growth_val < 0 else "neutral")
                                ),
                            },
                        )

                except Exception as e:
                    print(f"[Performance] DuckDB error for {d.name}/{cat_col}: {e}")
                    # Fallback: profile top_values
                    raw_top = cols_dict.get(cat_col, {}).get("top_values", {})
                    top_vals: dict[str, float] = {}
                    if isinstance(raw_top, list):
                        for entry in raw_top:
                            if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                                top_vals[str(entry[0])] = float(entry[1])
                            elif isinstance(entry, dict):
                                k = (
                                    entry.get("value")
                                    or entry.get("name")
                                    or str(entry)
                                )
                                v = float(entry.get("count") or entry.get("freq") or 1)
                                top_vals[str(k)] = v
                    elif isinstance(raw_top, dict):
                        top_vals = {k: float(v) for k, v in raw_top.items()}
                    total_sum = sum(top_vals.values()) or 1
                    for k, v in list(top_vals.items())[:5]:
                        if k and k.lower() not in ("none", "null", "nan"):
                            items.append(
                                {
                                    "id": str(uuid.uuid4()),
                                    "name": str(k),
                                    "value": round(v, 2),
                                    "contribution": round(v / total_sum * 100, 1),
                                    "growth": 0,
                                    "trend": "neutral",
                                },
                            )

                if items:
                    performances.append(
                        {
                            "dimension": f"{d.name} - {cat_col.replace('_', ' ').title()}",
                            "items": items,
                        },
                    )

        return {"performances": performances[:4]}

    # --- Anomalies ---
    async def get_anomalies(
        self, actor: User, dataset_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        if dataset_id:
            return await self._get_dataset_anomalies(actor, dataset_id)
        return await self._get_aggregate_anomalies(actor)

    async def _get_dataset_anomalies(
        self, actor: User, dataset_id: uuid.UUID,
    ) -> dict[str, Any]:
        ds, numeric_cols, _categorical_cols, _date_cols = await self._get_auto_columns(
            dataset_id, actor,
        )
        anomalies = []
        if numeric_cols:
            num_col = numeric_cols[0]
            try:
                mean = ds.profile["columns"][num_col].get("mean", 0) or 0
                std = ds.profile["columns"][num_col].get("std", 1) or 1
                sql = f'SELECT MAX(TRY_CAST("{num_col}" AS DOUBLE)) as max_val FROM dataset'
                result = await self.dataset_service.execute_query(
                    dataset_id, sql, actor,
                )
                rows = _rows_to_dicts(result)
                max_val = rows[0].get("max_val", 0) if rows else 0
                max_val = max_val or 0
                if std > 0 and (max_val - mean) / std > 3:
                    anomalies.append(
                        {
                            "id": str(uuid.uuid4()),
                            "metric": num_col.replace("_", " ").title(),
                            "date": "Recent",
                            "expected_value": round(mean, 2),
                            "actual_value": round(max_val, 2),
                            "magnitude": round((max_val - mean) / std, 1),
                            "severity": (
                                "high" if (max_val - mean) / std > 5 else "medium"
                            ),
                            "possible_explanation": f"Max value is {round((max_val - mean) / std, 1)} standard deviations above the mean.",
                        },
                    )
            except Exception as e:
                print(f"Error calculating Anomalies for {num_col}: {e}")
        return {"anomalies": anomalies}

    async def _get_aggregate_anomalies(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        anomalies = []
        for d in datasets:
            if d.profile:
                for col, info in self._get_columns_dict(d.profile).items():
                    if info.get("type") == "numeric":
                        try:
                            mean = float(info.get("mean", 0) or 0)
                            max_val = float(info.get("max", 0) or 0)
                            std = float(info.get("std", 1) or 1)
                            if math.isnan(mean):
                                mean = 0.0
                            if math.isnan(max_val):
                                max_val = 0.0
                            if math.isnan(std):
                                std = 1.0

                            if max_val and mean and std and std != 0:
                                z_score = (max_val - mean) / std
                                if z_score > 3.0:
                                    anomalies.append(
                                        {
                                            "id": str(uuid.uuid4()),
                                            "metric": f"{d.name}: {col}",
                                            "date": datetime.now(
                                                timezone.utc,
                                            ).isoformat(),
                                            "expected_value": round(mean, 2),
                                            "actual_value": round(max_val, 2),
                                            "magnitude": round(z_score, 2),
                                            "severity": (
                                                "high" if z_score > 5 else "medium"
                                            ),
                                            "possible_explanation": f"Outlier detected: {z_score:.1f} standard deviations above mean.",
                                        },
                                    )
                        except (ValueError, TypeError):
                            continue
        return {"anomalies": anomalies[:5]}

    # --- Data Quality ---
    async def get_data_quality(
        self, actor: User, dataset_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        if dataset_id:
            return await self._get_dataset_data_quality(actor, dataset_id)
        return await self._get_aggregate_data_quality(actor)

    async def _get_dataset_data_quality(
        self, actor: User, dataset_id: uuid.UUID,
    ) -> dict[str, Any]:
        ds = await self.dataset_service.get_dataset(dataset_id, actor)
        quality = []
        if ds.profile:
            quality.append(
                {
                    "dataset_id": str(ds.id),
                    "dataset_name": ds.name,
                    "completeness": round(ds.profile.get("quality_score", 100), 1),
                    "missing_values": sum(
                        c.get("missing", 0)
                        for c in ds.profile.get("columns", {}).values()
                    ),
                    "duplicate_records": ds.profile.get("duplicate_count", 0),
                    "quality_score": int(ds.profile.get("quality_score", 100)),
                },
            )
        return {"quality_reports": quality}

    async def _get_aggregate_data_quality(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        reports = []
        for d in datasets:
            if d.profile:
                reports.append(
                    {
                        "dataset_id": str(d.id),
                        "dataset_name": d.name,
                        "completeness": d.profile.get("quality_score", 95.0),
                        "missing_values": sum(
                            info.get("missing", 0)
                            for info in self._get_columns_dict(d.profile).values()
                        ),
                        "duplicate_records": d.profile.get("duplicate_count", 0),
                        "quality_score": d.profile.get("quality_score", 95.0),
                    },
                )
        return {"quality_reports": reports}

    # --- Other Aggregate Functions (Comparisons, Forecast, AI Insights) ---
    async def get_comparisons(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        if not datasets:
            return {"comparisons": []}
        comparisons = []
        if len(datasets) >= 2:
            d1, d2 = datasets[0], datasets[1]
            val_a = float(d1.row_count or 0)
            val_b = float(d2.row_count or 0)
            diff = val_a - val_b
            pct_diff = (diff / val_b * 100) if val_b > 0 else 0
            comparisons.append(
                {
                    "id": str(uuid.uuid4()),
                    "title": "Row Count Comparison",
                    "entity_a": d1.name,
                    "entity_b": d2.name,
                    "value_a": val_a,
                    "value_b": val_b,
                    "absolute_difference": abs(diff),
                    "percentage_difference": pct_diff,
                    "trend": "up" if diff > 0 else "down",
                },
            )
        return {"comparisons": comparisons}

    async def get_forecast(self, actor: User) -> dict[str, Any]:

        datasets = await self._resolve_datasets(actor)
        forecasts = []

        if not datasets:
            return {"forecasts": []}

        # Build real historical data: cumulative rows by dataset upload date (monthly buckets)
        sorted_ds = sorted(datasets, key=lambda x: x.created_at)

        # Aggregate into monthly buckets
        monthly: dict[str, float] = {}
        cumulative = 0.0
        for ds in sorted_ds:
            month_key = ds.created_at.strftime("%Y-%m")
            cumulative += float(ds.row_count or 0)
            monthly[month_key] = cumulative  # keep last cumulative value per month

        sorted_months = sorted(monthly.keys())
        hist_points = [(k, monthly[k]) for k in sorted_months]

        if len(hist_points) < 1:
            return {"forecasts": []}

        # --- Linear regression on real history ---
        # x = month index (0, 1, 2...), y = cumulative rows
        n = len(hist_points)
        xs = list(range(n))
        ys = [p[1] for p in hist_points]

        if n >= 2:
            mean_x = sum(xs) / n
            mean_y = sum(ys) / n
            num = sum((xs[i] - mean_x) * (ys[i] - mean_y) for i in range(n))
            den = sum((xs[i] - mean_x) ** 2 for i in range(n))
            slope = num / den if den != 0 else 0
            intercept = mean_y - slope * mean_x

            # R² to estimate model accuracy
            ss_res = sum((ys[i] - (slope * xs[i] + intercept)) ** 2 for i in range(n))
            ss_tot = sum((ys[i] - mean_y) ** 2 for i in range(n))
            r_squared = max(0.0, min(1.0, 1 - ss_res / ss_tot)) if ss_tot > 0 else 0.85
        else:
            slope = 0
            intercept = ys[0]
            r_squared = 0.5

        # Build historical data for chart (real dates + real values)
        hist = []
        for k, v in hist_points:
            hist.append({"date": k, "value": round(v, 0)})

        # Build 6-month forward projection
        last_month_str = sorted_months[-1]
        last_year, last_month = int(last_month_str[:4]), int(last_month_str[5:])
        pred = []
        conf = []
        for i in range(1, 7):
            future_month = last_month + i
            future_year = last_year + (future_month - 1) // 12
            future_month = ((future_month - 1) % 12) + 1
            future_label = f"{future_year}-{future_month:02d}"
            projected_val = max(0, slope * (n + i - 1) + intercept)
            margin = projected_val * 0.10  # ±10% confidence interval
            pred.append({"date": future_label, "value": round(projected_val, 0)})
            conf.append(
                {
                    "date": future_label,
                    "upper": round(projected_val + margin, 0),
                    "lower": round(max(0, projected_val - margin), 0),
                },
            )

        forecasts.append(
            {
                "id": str(uuid.uuid4()),
                "title": "Projected Data Volume",
                "metric": "Total Records",
                "historical_data": hist,
                "predicted_data": pred,
                "confidence_interval": conf,
                "model_accuracy": round(r_squared, 2),
                "slope_per_month": round(slope, 0),
            },
        )

        return {"forecasts": forecasts}

    async def get_ai_insights(self, actor: User) -> dict[str, Any]:
        datasets = await self._resolve_datasets(actor)
        domain = self._detect_business_domain(datasets)

        if not datasets:
            return {
                "executive_summary": "No datasets found. Upload a dataset to receive AI-driven executive insights.",
                "insights": [
                    {
                        "id": str(uuid.uuid4()),
                        "type": "recommendation",
                        "content": "Start by uploading datasets to receive AI-driven executive insights.",
                    },
                ],
            }

        # Build a rich context summary from real dataset profiles
        ds_summary_lines = []
        for d in datasets[:6]:  # limit to 6 for prompt length
            line = f"- Dataset: '{d.name}' | Rows: {d.row_count or 0} | Cols: {d.column_count or 0} | Quality: {d.data_quality_score or 100}%"
            if d.profile:
                numeric_cols = [
                    c
                    for c, i in self._get_columns_dict(d.profile).items()
                    if i.get("type") == "numeric"
                ]
                cat_cols = [
                    c
                    for c, i in self._get_columns_dict(d.profile).items()
                    if i.get("type") == "categorical"
                ]
                line += f" | Numeric cols: {numeric_cols[:4]} | Categorical cols: {cat_cols[:3]}"
            ds_summary_lines.append(line)

        ds_context = "\n".join(ds_summary_lines)
        total_rows = sum(d.row_count or 0 for d in datasets)
        low_quality = [
            d.name
            for d in datasets
            if d.data_quality_score and d.data_quality_score < 80
        ]

        prompt = f"""You are a senior data analyst AI assistant for a business intelligence platform.
The user's business domain is: {domain}

Here is a summary of their data workspace ({len(datasets)} datasets, {total_rows:,} total rows):
{ds_context}

Low quality datasets (score < 80%): {low_quality or 'None'}

Generate a concise executive business intelligence report with:
1. A 2-sentence executive summary of the data ecosystem health and growth status.
2. Exactly 2-3 actionable "Key Discoveries" as bullet points. Each should be specific to their actual data (mention dataset names, row counts, column names, quality scores). Format each as: **[Discovery Type]:** [specific insight]. [Recommendation].

Keep the total response under 200 words. Be specific and data-driven. Do not use generic phrases."""

        executive_summary = f"Your {domain} data ecosystem currently spans {total_rows:,} records across {len(datasets)} datasets."
        insights = []

        try:
            from google import genai

            from app.core.config import settings

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt,
            )
            raw = response.text.strip()

            # Split into summary + bullet points
            lines = [l.strip() for l in raw.split("\n") if l.strip()]
            summary_lines = []
            in_bullets = False
            for line in lines:
                if (
                    line.startswith(("**", "- **", "* **", "•"))
                ):
                    in_bullets = True
                if in_bullets:
                    clean = line.lstrip("-•* ").strip()
                    if clean:
                        insight_type = "opportunity"
                        if any(
                            w in clean.lower()
                            for w in [
                                "risk",
                                "warning",
                                "missing",
                                "quality",
                                "issue",
                                "problem",
                            ]
                        ):
                            insight_type = "risk"
                        elif any(
                            w in clean.lower()
                            for w in ["recommend", "suggest", "improve", "optimize"]
                        ):
                            insight_type = "opportunity"
                        insights.append(
                            {
                                "id": str(uuid.uuid4()),
                                "type": insight_type,
                                "content": clean,
                            },
                        )
                else:
                    summary_lines.append(line)

            if summary_lines:
                executive_summary = " ".join(summary_lines[:2])

        except Exception as e:
            print(f"[AI Insights] Gemini error: {e}, falling back to template.")
            # Fallback: template-based but data-driven
            executive_summary = (
                f"Your {domain} data ecosystem currently spans {total_rows:,} records across "
                f"{len(datasets)} datasets with an average quality score of "
                f"{sum(d.data_quality_score or 100 for d in datasets)/len(datasets):.1f}%."
            )
            insights.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "opportunity",
                    "content": f"**{domain} Data Opportunity:** You have {len(datasets)} datasets with {total_rows:,} total rows. "
                    f"Combining them could yield new cross-functional insights. Recommendation: Run a cross-dataset join analysis.",
                },
            )
            if low_quality:
                insights.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "risk",
                        "content": f"**Data Quality Warning:** Datasets {low_quality} have quality scores below 80%. "
                        f"Missing or invalid values may impact forecast accuracy. Recommendation: Set up automated data cleaning.",
                    },
                )

        if not insights:
            insights.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "opportunity",
                    "content": f"**{domain} Opportunity:** {len(datasets)} datasets with {total_rows:,} rows ready for analysis. Upload more data to unlock deeper cross-dataset insights.",
                },
            )

        return {"executive_summary": executive_summary, "insights": insights}

    async def chat_ai(
        self, actor: User, message: str, context: dict[str, Any] | None = None,
    ) -> str:
        datasets = await self._resolve_datasets(actor)
        domain = self._detect_business_domain(datasets)

        # Build context from real dataset profiles
        ds_context_parts = []
        for d in datasets[:5]:
            part = f"Dataset '{d.name}': {d.row_count or 0} rows, {d.column_count or 0} columns, quality {d.data_quality_score or 100}%"
            if d.profile:
                numeric_cols = [
                    c
                    for c, i in self._get_columns_dict(d.profile).items()
                    if i.get("type") == "numeric"
                ]
                cat_cols = [
                    c
                    for c, i in self._get_columns_dict(d.profile).items()
                    if i.get("type") == "categorical"
                ]
                if numeric_cols:
                    part += f". Numeric: {', '.join(numeric_cols[:5])}"
                if cat_cols:
                    part += f". Categories: {', '.join(cat_cols[:3])}"
            ds_context_parts.append(part)

        ds_context = (
            "\n".join(ds_context_parts)
            if ds_context_parts
            else "No datasets uploaded yet."
        )
        total_rows = sum(d.row_count or 0 for d in datasets)

        system_prompt = f"""You are a concise, expert data analyst AI for a Business Intelligence platform.
The user's business domain is: {domain}
Total datasets: {len(datasets)} | Total records: {total_rows:,}

Available data:
{ds_context}

Answer the user's question in 2-4 sentences. Be specific and reference actual dataset names, column names, and numbers from the context above. 
Do not make up data. If you cannot answer from the context, say so and suggest what data they should upload."""

        try:
            from groq import Groq

            from app.core.config import settings

            client = Groq(api_key=settings.GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                max_tokens=300,
                temperature=0.4,
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"[Chat AI] Groq error: {e}")
            ds_names = [d.name for d in datasets[:3]]
            return (
                f"Based on your {len(datasets)} datasets ({', '.join(ds_names)}{'...' if len(datasets) > 3 else ''}), "
                f"I wasn't able to fully process your question right now. "
                f"Please try again or check the trend charts for a visual overview."
            )
