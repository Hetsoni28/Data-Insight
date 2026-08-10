"""Organization Dashboards API (Enterprise Builder)."""

import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
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

    stmt = select(Dashboard).where(*base_conditions).order_by(Dashboard.updated_at.desc())
    
    result = await db.execute(stmt)
    dashboards = result.scalars().all()
    
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "is_published": d.is_published,
            "updated_at": d.updated_at,
            "view_count": d.view_count,
        }
        for d in dashboards
    ]


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
        dashboard.is_published = data["is_published"]

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


@router.post("/ai-generate", response_model=dict)
async def ai_generate_dashboard(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
    workspace: Workspace | None = Depends(get_current_workspace),
) -> Any:
    """
    Generate a full dashboard layout using AI based on a dataset and a prompt.
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

    from app.core.config import settings
    import json
    from groq import AsyncGroq
    
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API Key is not configured")

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    # Extract schema info
    schema_info = "No detailed schema available."
    if dataset.profile:
        # Pass a summarized profile to avoid exceeding context limits
        if isinstance(dataset.profile, dict):
            cols = dataset.profile.get("columns", {})
            col_summary = {k: v.get("type", "Unknown") for k, v in cols.items()}
            schema_info = json.dumps(col_summary)
        else:
            schema_info = str(dataset.profile)

    system_prompt = f"""You are an expert dashboard designer AI.
Your goal is to generate a structured JSON layout for a dashboard based on the user's prompt and the provided dataset schema.

Dataset Name: {dataset.name}
Row Count: {dataset.row_count}
Schema (Column Types): {schema_info}
User Request: {prompt}

Generate a JSON object with exactly this structure:
{{
  "widgets": [
    {{
      "id": "uuid-string-here",
      "type": "widget_type",
      "title": "Widget Title",
      "x": 0, "y": 0, "w": 4, "h": 4,
      "config": {{ ... }}
    }}
  ]
}}

Widget types allowed:
- "kpi": config must have {{"yAxis": "column_name"}} or just {{"yAxis": "Metric"}}
- "chart_bar": config must have {{"xAxis": "category_col", "yAxis": "numeric_col"}}
- "chart_line": config must have {{"xAxis": "time_col", "yAxis": "numeric_col"}}
- "chart_pie": config must have {{"xAxis": "category_col", "yAxis": "numeric_col"}}
- "chart_scatter": config must have {{"xAxis": "numeric_col", "yAxis": "numeric_col"}}
- "ai_insight": config must have {{"text": "Detailed Markdown text analyzing the dataset"}}
- "data_table": config must have {{"xAxis": "col1", "yAxis": "col2"}}

Rules:
1. Always set dataset_id in the config of EVERY widget to exactly "{dataset_id}".
2. Make sure x, y, w, h are integers. Grid is 12 columns wide.
3. Provide 3 to 6 widgets that best answer the user's request.
4. If you use "ai_insight", YOU MUST WRITE A REAL, DETAILED 2-PARAGRAPH ANALYSIS inside `config.text`. Do not leave it empty.
5. Output ONLY raw, valid JSON. No markdown backticks, no explanations.
"""

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_DEFAULT_MODEL,
            messages=[{"role": "user", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        
        response_text = response.choices[0].message.content
        generated_layout = json.loads(response_text)
        
        # Ensure all widgets have valid IDs and the correct dataset_id
        for widget in generated_layout.get("widgets", []):
            if not widget.get("id"):
                widget["id"] = str(uuid.uuid4())
            if "config" not in widget:
                widget["config"] = {}
            widget["config"]["dataset_id"] = str(dataset_id)
            
    except Exception as e:
        print(f"LLM Generation Failed: {e}")
        # Fallback layout
        generated_layout = {
            "widgets": [
                {
                    "id": str(uuid.uuid4()),
                    "type": "ai_insight",
                    "title": "Generation Failed",
                    "x": 0, "y": 0, "w": 12, "h": 4,
                    "config": {
                        "text": f"The AI failed to generate the layout: {str(e)}",
                        "dataset_id": str(dataset_id)
                    }
                }
            ]
        }
    
    dashboard = Dashboard(
        tenant_id=current_user.tenant_id,
        created_by_id=current_user.id,
        primary_dataset_id=dataset.id,
        name=f"AI Generated Dashboard",
        description=f"Generated via AI Copilot. Prompt: '{prompt}'",
        layout_json=generated_layout,
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
