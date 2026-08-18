"""Organization Dashboards API (Enterprise Builder)."""

import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_active_tenant_user, get_current_workspace
from app.models.user import User
from app.models.workspace import Workspace
from app.models.dashboard import Dashboard
from app.models.dataset import Dataset

router = APIRouter()


@router.get("", response_model=List[dict])
async def get_dashboards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """Retrieve all dashboards for the current user's organization."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    base_conditions = [Dashboard.tenant_id == current_user.tenant_id, Dashboard.is_deleted == False]
    if workspace:
        base_conditions.append(Dashboard.workspace_id == workspace.id)

    stmt = select(Dashboard, Dataset).outerjoin(
        Dataset, Dashboard.primary_dataset_id == Dataset.id
    ).where(*base_conditions).order_by(Dashboard.updated_at.desc())
    
    result = await db.execute(stmt)
    
    # Map backend widget type names to frontend-compatible types
    TYPE_MAP = {
        "chart_bar": "bar", "chart_line": "line", "chart_pie": "pie",
        "bar": "bar", "line": "line", "pie": "pie", "kpi": "kpi",
        "ai_insight": "text", "text": "text"
    }
    
    dashboards = []
    for d, ds in result:
        raw_widgets = d.layout_json.get("widgets", []) if d.layout_json else []
        hydrated_widgets = []
        
        for w in raw_widgets:
            w_type = TYPE_MAP.get(w.get("type", "bar"), "bar")
            config = w.get("config", {})
            x_axis = config.get("xAxis") or config.get("x_axis", "name")
            y_axis = config.get("yAxis") or config.get("y_axis", "value")
            
            # Build chart data from dataset profile if available
            chart_data = []
            
            # Fetch the widget's specific dataset if it differs from the primary
            widget_dataset = ds
            widget_ds_id = config.get("dataset_id")
            if widget_ds_id and (not ds or str(ds.id) != str(widget_ds_id)):
                widget_dataset = await db.get(Dataset, widget_ds_id)
                
            if widget_dataset and widget_dataset.profile and w_type != "kpi":
                col_profiles = widget_dataset.profile.get("columns", {})
                
                # Function to extract data from a column profile
                def extract_data(col_info):
                    # Try categorical top values first
                    top_vals = col_info.get("top_values", [])
                    if top_vals:
                        return [{"name": str(item.get("value", "")), "value": item.get("count", 0)} for item in top_vals[:10]]
                    # Fallback to numeric histogram
                    hist = col_info.get("histogram", [])
                    if hist:
                        return [{"name": f"{round(item.get('bin_start', 0),1)}-{round(item.get('bin_end', 0),1)}", "value": item.get("count", 0)} for item in hist[:10]]
                    return []

                # Try to get data for the requested x-axis column
                if x_axis in col_profiles:
                    chart_data = extract_data(col_profiles[x_axis])
                
                # Fallback: use any column that has valid top_values or histogram
                if not chart_data:
                    for col_name, col_info in col_profiles.items():
                        extracted = extract_data(col_info)
                        if extracted and len(extracted) > 1 and not all(e["value"] == 1 for e in extracted):
                            # Ensure we don't fall back to a primary key (where all counts are 1)
                            chart_data = extracted
                            break
            
            # KPI widget
            metrics = {}
            if w_type == "kpi" and widget_dataset and widget_dataset.profile:
                col_profiles = widget_dataset.profile.get("columns", {})
                y_col = col_profiles.get(y_axis, {})
                metrics = {
                    "value": y_col.get("mean") or widget_dataset.row_count or 0,
                    "label": w.get("title", "KPI"),
                    "unit": "",
                }
            elif w_type == "text":
                metrics = {
                    "text": config.get("text", "No insights available for this widget.")
                }
            
            hydrated_widgets.append({
                "id": w.get("id", str(uuid.uuid4())),
                "type": w_type,
                "title": w.get("title", "Chart"),
                "x_axis_key": x_axis,
                "y_axis_key": y_axis,
                "data": chart_data,
                "metrics": metrics,
            })
        
        dashboards.append({
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "dataset_id": str(d.primary_dataset_id) if d.primary_dataset_id else None,
            "dataset_name": ds.name if ds else "Unknown",
            "widgets": hydrated_widgets,
            "is_published": d.is_published,
            "updated_at": d.updated_at,
            "view_count": d.view_count,
        })
    
    return dashboards


@router.post("", response_model=dict)
async def create_dashboard(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """Create a new empty dashboard or with a layout."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    # Phase 5: Quota Enforcement
    from app.services.entitlements import check_quota, BillingResource, get_usage
    from app.models.tenant import Tenant
    from sqlalchemy import select
    
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    usage = await get_usage(tenant, db)
    quota = check_quota(tenant, usage, BillingResource.DASHBOARDS)
    if not quota.allowed:
        raise HTTPException(status_code=402, detail="Dashboards quota exceeded for your organization's plan.")

    name = data.get("name", "New Dashboard")
    description = data.get("description", "")
    layout_json = data.get("layout_json", {})

    dashboard = Dashboard(
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        name=name,
        description=description,
        layout_json=layout_json,
        workspace_id=workspace.id if workspace else None,
    )
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)

    return {
        "id": str(dashboard.id),
        "name": dashboard.name,
        "layout_json": dashboard.layout_json
    }


@router.get("/{id}", response_model=dict)
async def get_dashboard(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """Get a specific dashboard by ID with its layout."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    base_conditions = [Dashboard.id == id, Dashboard.tenant_id == current_user.tenant_id, Dashboard.is_deleted == False]
    if workspace:
        base_conditions.append(Dashboard.workspace_id == workspace.id)

    result = await db.execute(select(Dashboard).where(*base_conditions))
    dashboard = result.scalar_one_or_none()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    # Increment view count when loaded
    dashboard.view_count += 1
    await db.commit()

    return {
        "id": str(dashboard.id),
        "name": dashboard.name,
        "description": dashboard.description,
        "layout_json": dashboard.layout_json,
        "is_published": dashboard.is_published,
    }


@router.patch("/{id}", response_model=dict)
async def update_dashboard(
    id: uuid.UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """Update a dashboard's name, description, or layout_json."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    base_conditions = [Dashboard.id == id, Dashboard.tenant_id == current_user.tenant_id, Dashboard.is_deleted == False]
    if workspace:
        base_conditions.append(Dashboard.workspace_id == workspace.id)

    result = await db.execute(select(Dashboard).where(*base_conditions))
    dashboard = result.scalar_one_or_none()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if "name" in data:
        dashboard.name = data["name"]
    if "description" in data:
        dashboard.description = data["description"]
    if "layout_json" in data:
        dashboard.layout_json = data["layout_json"]
    if "is_published" in data:
        # Permission check for publishing
        publishing = data["is_published"]
        if publishing and current_user.role not in ["owner", "org_admin", "manager"]:
            # In a full RBAC system, we'd check `current_user.has_permission('DASHBOARD_PUBLISH')`
            # For now, restrict analysts/viewers from publishing without explicit permission.
            raise HTTPException(status_code=403, detail="You do not have the DASHBOARD_PUBLISH permission.")
        dashboard.is_published = publishing

    await db.commit()
    await db.refresh(dashboard)

    return {
        "id": str(dashboard.id),
        "name": dashboard.name,
        "layout_json": dashboard.layout_json
    }


@router.delete("/{id}")
async def delete_dashboard(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """Soft delete a dashboard."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    base_conditions = [Dashboard.id == id, Dashboard.tenant_id == current_user.tenant_id, Dashboard.is_deleted == False]
    if workspace:
        base_conditions.append(Dashboard.workspace_id == workspace.id)

    result = await db.execute(select(Dashboard).where(*base_conditions))
    dashboard = result.scalar_one_or_none()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    dashboard.is_deleted = True
    await db.commit()

    return {"status": "success"}


async def generate_dashboard_background_task(
    dashboard_id: uuid.UUID,
    dataset_id: uuid.UUID,
    prompt: str,
    tenant_id: uuid.UUID
):
    from app.db.session import AsyncSessionLocal
    from app.core.config import settings
    import json
    from groq import AsyncGroq
    
    if not settings.GROQ_API_KEY:
        print("Groq API Key is not configured for background task")
        return
        
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    async with AsyncSessionLocal() as db:
        # Fetch dataset for schema
        dataset = await db.scalar(select(Dataset).where(Dataset.id == dataset_id, Dataset.tenant_id == tenant_id))
        if not dataset:
            return
            
        # ── Build rich schema: separate numeric from categorical, include sample values ──
        numeric_cols: list[str] = []
        categorical_cols: list[str] = []
        schema_lines: list[str] = []

        if dataset.profile and isinstance(dataset.profile, dict):
            cols: dict = dataset.profile.get("columns", {})
            for col_name, col_info in cols.items():
                dtype = str(col_info.get("dtype", "")).lower()
                numeric_keywords = ("int", "float", "double", "decimal", "numeric",
                                    "number", "real", "bigint", "smallint")
                is_numeric = any(k in dtype for k in numeric_keywords)
                if is_numeric:
                    numeric_cols.append(col_name)
                else:
                    categorical_cols.append(col_name)

                top_vals = col_info.get("top_values", [])
                sample_str = ""
                if top_vals:
                    samples = [str(v.get("value", "")) for v in top_vals[:3] if v.get("value") is not None]
                    sample_str = f" (samples: {', '.join(samples)})" if samples else ""
                schema_lines.append(f"  - \"{col_name}\" [{dtype}]{sample_str}")

        schema_block = "\n".join(schema_lines) if schema_lines else "  No schema available."
        numeric_list = json.dumps(numeric_cols)
        categorical_list = json.dumps(categorical_cols)

        prompt_words = prompt.strip().split()
        dashboard_title = " ".join(prompt_words[:6]) if len(prompt_words) > 3 else (prompt[:50] or "AI Dashboard")

        system_prompt = f"""You are an expert data visualization and dashboard design AI.

DATASET: "{dataset.name}" ({dataset.row_count:,} rows)

COLUMNS (with data type and sample values):
{schema_block}

NUMERIC columns (use these for metric/aggregation): {numeric_list}
CATEGORICAL columns (use these for dimension/grouping): {categorical_list}

USER GOAL: {prompt}

---
OUTPUT a single valid JSON object with this exact structure:
{{
  "widgets": [
    {{
      "id": "w1",
      "type": "<widget_type>",
      "title": "<descriptive title>",
      "x": 0, "y": 0, "w": 6, "h": 4,
      "config": {{
        "dataset_id": "{dataset_id}",
        ... (widget-specific config below)
      }}
    }}
  ]
}}

WIDGET TYPES AND CONFIG RULES:

1. "kpi" — Single big number. config:
   {{ "dataset_id": "...", "metric": "<NUMERIC_COL>", "aggregation": "SUM" }}
   → Use only a NUMERIC column for "metric". Do NOT use a categorical column here.
   → Choose the most meaningful numeric column (e.g., Revenue, Sales, Amount, not just any number).

2. "chart_bar" — Bar chart grouped by a category. config:
   {{ "dataset_id": "...", "dimension": "<CATEGORICAL_COL>", "metric": "<NUMERIC_COL>", "aggregation": "SUM" }}
   → "dimension" MUST be a categorical column. "metric" MUST be a numeric column.

3. "chart_line" — Line/trend chart. config:
   {{ "dataset_id": "...", "dimension": "<DATE_OR_CATEGORICAL_COL>", "metric": "<NUMERIC_COL>", "aggregation": "SUM" }}
   → Prefer a date/time column for dimension if one exists.

4. "chart_pie" — Pie/donut breakdown. config:
   {{ "dataset_id": "...", "dimension": "<CATEGORICAL_COL>", "metric": "<NUMERIC_COL>", "aggregation": "SUM" }}
   → "dimension" MUST be a categorical column with low cardinality (e.g., Region, Category, Status).

5. "data_table" — Tabular listing. config:
   {{ "dataset_id": "...", "dimension": "<CATEGORICAL_COL>", "metric": "<NUMERIC_COL>", "aggregation": "SUM" }}
   → Shows top rows sorted by the metric descending.

6. "ai_insight" — Markdown text widget. config:
   {{ "dataset_id": "...", "text": "<2-3 paragraph markdown analysis>" }}
   → Write a real, data-informed analysis based on the schema and user goal.
   → Use **bold**, bullet points, and mention specific column names.

LAYOUT RULES:
- Grid is 12 columns wide.
- Use w=4, h=4 for KPI cards (up to 3 per row).
- Use w=6, h=5 for charts (2 per row).
- Use w=12, h=6 for data_table.
- Use w=12, h=4 for ai_insight.
- Arrange widgets so they tile neatly without gaps (use x, y, w, h thoughtfully).
- Generate 4 to 6 widgets that directly answer the user's goal.
- Always include at least one KPI and one chart.

CRITICAL RULES:
- ONLY use column names that appear EXACTLY in the schema above.
- NEVER use a categorical column as a "metric". NEVER use a numeric column as a "dimension".
- Set "dataset_id" to exactly "{dataset_id}" in EVERY widget config.
- Output ONLY the JSON object. No explanation, no markdown code fences.
"""
        generated_layout = {}
        try:
            response = await client.chat.completions.create(
                model=settings.GROQ_DEFAULT_MODEL,
                messages=[{"role": "user", "content": system_prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            
            response_text = response.choices[0].message.content
            generated_layout = json.loads(response_text)
            
            for widget in generated_layout.get("widgets", []):
                if not widget.get("id"):
                    widget["id"] = str(uuid.uuid4())
                if "config" not in widget:
                    widget["config"] = {}
                cfg = widget["config"]
                cfg["dataset_id"] = str(dataset_id)
                if "xAxis" in cfg and "dimension" not in cfg:
                    cfg["dimension"] = cfg.pop("xAxis")
                if "yAxis" in cfg and "metric" not in cfg:
                    cfg["metric"] = cfg.pop("yAxis")
                if widget["type"] in ("kpi", "chart_bar", "chart_line", "chart_pie", "data_table"):
                    if "metric" in cfg and "aggregation" not in cfg:
                        cfg["aggregation"] = "SUM"

        except Exception as e:
            print(f"LLM Generation Failed: {e}")
            fallback_metric = numeric_cols[0] if numeric_cols else None
            fallback_dim = categorical_cols[0] if categorical_cols else None
            fallback_widgets = []

            if fallback_metric:
                fallback_widgets.append({
                    "id": str(uuid.uuid4()),
                    "type": "kpi",
                    "title": f"Total {fallback_metric}",
                    "x": 0, "y": 0, "w": 4, "h": 4,
                    "config": {"dataset_id": str(dataset_id), "metric": fallback_metric, "aggregation": "SUM"}
                })
            if fallback_dim and fallback_metric:
                fallback_widgets.append({
                    "id": str(uuid.uuid4()),
                    "type": "chart_bar",
                    "title": f"{fallback_metric} by {fallback_dim}",
                    "x": 4, "y": 0, "w": 8, "h": 4,
                    "config": {"dataset_id": str(dataset_id), "dimension": fallback_dim, "metric": fallback_metric, "aggregation": "SUM"}
                })
            if fallback_dim and fallback_metric:
                fallback_widgets.append({
                    "id": str(uuid.uuid4()),
                    "type": "data_table",
                    "title": f"Data Overview",
                    "x": 0, "y": 4, "w": 12, "h": 6,
                    "config": {"dataset_id": str(dataset_id), "dimension": fallback_dim, "metric": fallback_metric, "aggregation": "SUM"}
                })

            if not fallback_widgets:
                fallback_widgets.append({
                    "id": str(uuid.uuid4()),
                    "type": "ai_insight",
                    "title": "Generation Note",
                    "x": 0, "y": 0, "w": 12, "h": 4,
                    "config": {"text": f"Dashboard generation encountered an issue: {str(e)}\n\nDataset **{dataset.name}** has been connected. Please configure widgets manually.", "dataset_id": str(dataset_id)}
                })

            generated_layout = {"widgets": fallback_widgets}

        # Update dashboard
        dashboard = await db.scalar(select(Dashboard).where(Dashboard.id == dashboard_id))
        if dashboard:
            dashboard.layout_json = generated_layout
            dashboard.name = dashboard_title
            await db.commit()


@router.post("/ai-generate", response_model=dict)
async def ai_generate_dashboard(
    data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """
    Generate a full dashboard layout using AI based on a dataset and a prompt.
    Offloads LLM work to BackgroundTasks.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User not assigned to a tenant")

    dataset_id = data.get("dataset_id")
    prompt = data.get("prompt", "Create a comprehensive dashboard")
    
    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is required")
        
    ds_conditions = [Dataset.id == dataset_id, Dataset.tenant_id == current_user.tenant_id]
    if workspace:
        ds_conditions.append(Dataset.workspace_id == workspace.id)

    result = await db.execute(select(Dataset).where(*ds_conditions))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Generate title immediately so the placeholder looks good
    prompt_words = prompt.strip().split()
    dashboard_title = " ".join(prompt_words[:6]) if len(prompt_words) > 3 else (prompt[:50] or "AI Dashboard")

    # Create empty dashboard
    dashboard = Dashboard(
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        primary_dataset_id=dataset.id,
        name=dashboard_title,
        description=f"AI-generated dashboard for: {prompt}",
        layout_json={"widgets": []}, # Empty initially
        workspace_id=workspace.id if workspace else None,
    )
    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)

    # Spawn background task
    background_tasks.add_task(
        generate_dashboard_background_task,
        dashboard.id,
        dataset.id,
        prompt,
        current_user.tenant_id
    )

    return {
        "id": str(dashboard.id),
        "name": dashboard.name,
        "layout_json": dashboard.layout_json
    }
