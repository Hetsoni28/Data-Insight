import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.feature_flag import FeatureExperiment, FeatureFlag, FeatureRollout
from app.models.user import User

router = APIRouter()


async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, "role", "") != "owner" and not getattr(
        current_user, "is_owner", False,
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    total_flags = await db.scalar(select(func.count(FeatureFlag.id)))
    enabled_flags = await db.scalar(
        select(func.count(FeatureFlag.id)).where(FeatureFlag.is_enabled == True),
    )
    disabled_flags = total_flags - enabled_flags if total_flags else 0
    active_rollouts = await db.scalar(
        select(func.count(FeatureRollout.id)).where(
            FeatureRollout.rollout_percentage > 0,
        ),
    )
    active_experiments = await db.scalar(
        select(func.count(FeatureExperiment.id)).where(
            FeatureExperiment.status == "running",
        ),
    )

    return {
        "kpis": {
            "total_flags": total_flags or 0,
            "enabled_flags": enabled_flags or 0,
            "disabled_flags": disabled_flags,
            "active_rollouts": active_rollouts or 0,
            "active_experiments": active_experiments or 0,
        },
    }


@router.get("")
async def get_features(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(FeatureFlag).order_by(desc(FeatureFlag.created_at)),
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
                "updated_at": f.updated_at.isoformat(),
            }
            for f in flags
        ],
    }


class ToggleFeatureRequest(BaseModel):
    is_enabled: bool


@router.patch("/{key}/toggle")
async def toggle_feature(
    key: str,
    payload: ToggleFeatureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
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
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(FeatureRollout, FeatureFlag)
        .join(FeatureFlag)
        .order_by(desc(FeatureRollout.rollout_percentage)),
    )

    rollouts = []
    for rollout, flag in result.all():
        rollouts.append(
            {
                "id": str(rollout.id),
                "flag_key": flag.key,
                "flag_name": flag.name,
                "percentage": rollout.rollout_percentage,
                "target_roles": rollout.target_roles,
                "target_organizations": rollout.target_organizations,
            },
        )

    return {"rollouts": rollouts}


@router.get("/experiments")
async def get_experiments(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(FeatureExperiment, FeatureFlag)
        .join(FeatureFlag)
        .order_by(desc(FeatureExperiment.id)),
    )

    experiments = []
    for exp, flag in result.all():
        total_success = exp.variation_a_success + exp.variation_b_success
        # Calculate statistical confidence using a z-test for two proportions/Poisson rates
        confidence = 0
        if total_success > 0:
            # Z = (A - B) / sqrt(A + B)
            z_score = abs(
                exp.variation_a_success - exp.variation_b_success,
            ) / math.sqrt(total_success)
            # erf(Z / sqrt(2)) gives the confidence level
            confidence = math.erf(z_score / math.sqrt(2)) * 100

        experiments.append(
            {
                "id": str(exp.id),
                "flag_key": flag.key,
                "flag_name": flag.name,
                "name": exp.name,
                "traffic_allocation": exp.traffic_allocation,
                "status": exp.status,
                "confidence_score": round(confidence, 1),
                "winner": (
                    "variation_a"
                    if exp.variation_a_success > exp.variation_b_success
                    else (
                        "variation_b"
                        if exp.variation_b_success > exp.variation_a_success
                        else None
                    )
                ),
            },
        )

    return {"experiments": experiments}


class FeatureFlagCreate(BaseModel):
    key: str
    name: str
    description: str | None = None
    environment: str = "production"


@router.post("")
async def create_feature_flag(
    payload: FeatureFlagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
) -> Any:
    # Check if key exists
    existing = await db.execute(
        select(FeatureFlag).where(FeatureFlag.key == payload.key),
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400, detail="Feature flag with this key already exists",
        )

    new_flag = FeatureFlag(
        key=payload.key,
        name=payload.name,
        description=payload.description,
        is_enabled=False,
        environment=payload.environment,
    )
    db.add(new_flag)

    # Audit log
    from app.services.audit_service import AuditService

    await AuditService.log(
        db=db,
        action="feature.create",
        resource_type="feature_flag",
        resource_id=payload.key,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
    )

    await db.commit()
    await db.refresh(new_flag)

    return {
        "id": str(new_flag.id),
        "key": new_flag.key,
        "name": new_flag.name,
        "description": new_flag.description,
        "is_enabled": new_flag.is_enabled,
        "environment": new_flag.environment,
        "tags": new_flag.tags,
        "updated_at": new_flag.updated_at.isoformat(),
    }


@router.post("/kill-switch")
async def trigger_kill_switch(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    # Disable all active feature flags
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.is_enabled == True))
    flags = result.scalars().all()
    count = 0
    for flag in flags:
        flag.is_enabled = False
        flag.updated_at = datetime.now(timezone.utc)
        count += 1

    # Audit log
    from app.services.audit_service import AuditService

    await AuditService.log(
        db=db,
        action="feature.kill_switch",
        resource_type="feature_flag",
        resource_id="all",
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        extra_metadata={"disabled_count": count},
    )

    await db.commit()
    return {"status": "success", "disabled_count": count}
