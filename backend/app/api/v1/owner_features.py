from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from datetime import datetime, timezone
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.feature_flag import FeatureFlag, FeatureRollout, FeatureExperiment

router = APIRouter()

async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, 'role', '') != 'owner' and not getattr(current_user, 'is_owner', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    total_flags = await db.scalar(select(func.count(FeatureFlag.id)))
    enabled_flags = await db.scalar(select(func.count(FeatureFlag.id)).where(FeatureFlag.is_enabled == True))
    disabled_flags = total_flags - enabled_flags if total_flags else 0
    active_rollouts = await db.scalar(select(func.count(FeatureRollout.id)).where(FeatureRollout.rollout_percentage > 0))
    active_experiments = await db.scalar(select(func.count(FeatureExperiment.id)).where(FeatureExperiment.status == 'running'))

    return {
        "kpis": {
            "total_flags": total_flags or 0,
            "enabled_flags": enabled_flags or 0,
            "disabled_flags": disabled_flags,
            "active_rollouts": active_rollouts or 0,
            "active_experiments": active_experiments or 0
        }
    }

@router.get("")
async def get_features(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(
        select(FeatureFlag).order_by(desc(FeatureFlag.created_at))
    )
    flags = result.scalars().all()
    
    return {
        "features": [
            {
                "id": str(f.id),
                "key": f.key,
                "name": f.name,
                "description": f.description,
                "is_enabled": f.is_enabled,
                "environment": f.environment,
                "tags": f.tags,
                "updated_at": f.updated_at.isoformat()
            } for f in flags
        ]
    }

class ToggleFeatureRequest(BaseModel):
    is_enabled: bool

@router.patch("/{key}/toggle")
async def toggle_feature(
    key: str,
    payload: ToggleFeatureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalars().first()
    
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
        
    flag.is_enabled = payload.is_enabled
    flag.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(flag)
    
    return {"status": "success", "is_enabled": flag.is_enabled, "key": flag.key}

@router.get("/rollouts")
async def get_rollouts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(
        select(FeatureRollout, FeatureFlag)
        .join(FeatureFlag)
        .order_by(desc(FeatureRollout.rollout_percentage))
    )
    
    rollouts = []
    for rollout, flag in result.all():
        rollouts.append({
            "id": str(rollout.id),
            "flag_key": flag.key,
            "flag_name": flag.name,
            "percentage": rollout.rollout_percentage,
            "target_roles": rollout.target_roles,
            "target_organizations": rollout.target_organizations,
        })
        
    return {"rollouts": rollouts}

@router.get("/experiments")
async def get_experiments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(
        select(FeatureExperiment, FeatureFlag)
        .join(FeatureFlag)
        .order_by(desc(FeatureExperiment.id))
    )
    
    experiments = []
    for exp, flag in result.all():
        total_success = exp.variation_a_success + exp.variation_b_success
        experiments.append({
            "id": str(exp.id),
            "flag_key": flag.key,
            "flag_name": flag.name,
            "name": exp.name,
            "traffic_allocation": exp.traffic_allocation,
            "status": exp.status,
            "confidence_score": 95 if total_success > 100 else 45, # Mock confidence
            "winner": "variation_a" if exp.variation_a_success > exp.variation_b_success else ("variation_b" if exp.variation_b_success > exp.variation_a_success else None)
        })
        
    return {"experiments": experiments}
