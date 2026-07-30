from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, func
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.user_activity import UserActivity
from app.models.user_session import UserSession
from app.models.audit_log import AuditLog
from app.models.report import Report
from app.models.dataset import Dataset
from app.models.ai_token_usage import AITokenUsage
from app.models.api_key import ApiKey

from app.schemas.profile import (
    UserProfileUpdate, 
    UserProfileResponse, 
    UserActivityResponse, 
    UserSessionResponse,
    FullProfileResponse,
    ProfileStatsResponse
)
from app.schemas.user import UserResponse
from app.schemas.audit_log import AuditLogResponse
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/profile", tags=["Executive Profile"])

@router.get("/me", response_model=FullProfileResponse, summary="Get Full Profile & Stats")
async def get_full_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch profile
    stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    tenant_id = current_user.tenant_id
    users_managed = 0
    reports_generated = 0
    datasets_uploaded = 0
    ai_requests = 0
    api_calls = 0
    storage_used_bytes = 0
    
    if tenant_id:
        users_managed = await db.scalar(select(func.count()).where(User.tenant_id == tenant_id)) or 0
        reports_generated = await db.scalar(select(func.count()).where(Report.tenant_id == tenant_id)) or 0
        datasets_uploaded = await db.scalar(select(func.count()).where(Dataset.tenant_id == tenant_id)) or 0
        ai_requests = await db.scalar(select(func.count()).where(AITokenUsage.tenant_id == tenant_id)) or 0
        api_calls = await db.scalar(select(func.sum(ApiKey.usage_count)).where(ApiKey.user_id == current_user.id)) or 0
        storage_used_bytes = await db.scalar(select(func.sum(Dataset.file_size_bytes)).where(Dataset.tenant_id == tenant_id)) or 0
    
    # Calculate Profile Completion
    completion_score = 0
    if current_user.full_name: completion_score += 20
    if current_user.avatar_url: completion_score += 10
    if profile:
        if profile.company_name: completion_score += 20
        if profile.job_title: completion_score += 20
        if profile.department: completion_score += 20
        if profile.linkedin_url: completion_score += 10
        
    # Calculate Security Score
    sec_score = 30 # Base
    if current_user.is_email_verified: sec_score += 20
    if profile: sec_score += 10
    
    # Check active sessions count
    active_sessions_count = await db.scalar(select(func.count()).where(UserSession.user_id == current_user.id, UserSession.is_active == True)) or 0
    if active_sessions_count < 5: sec_score += 20
    
    # Assume passwords are strong for demo (+20)
    sec_score += 20
    
    sec_score = min(sec_score, 100)

    stats = ProfileStatsResponse(
        organizations_created=1 if tenant_id else 0,
        users_managed=users_managed,
        reports_generated=reports_generated,
        datasets_uploaded=datasets_uploaded,
        ai_requests=ai_requests,
        api_calls=int(api_calls),
        storage_used_mb=int(storage_used_bytes / (1024 * 1024)) if storage_used_bytes else 0,
        profile_completion_percentage=completion_score,
        security_score=sec_score
    )
    
    return {
        "user": UserResponse.model_validate(current_user),
        "profile": profile,
        "stats": stats
    }

@router.patch("/me", response_model=UserProfileResponse, summary="Update Profile")
async def update_profile(
    updates: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalars().first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
        
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/sessions", response_model=list[UserSessionResponse], summary="List Active Sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSession).where(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).order_by(desc(UserSession.last_active_at))
    
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    # In a real app, we'd compare the token hash to the current request's token
    # For now, mark the most recently active one as "current"
    res = []
    for i, s in enumerate(sessions):
        # Using model_validate to convert ORM to Pydantic, then dump to dict to add is_current
        s_dict = UserSessionResponse.model_validate(s).model_dump()
        s_dict["is_current"] = (i == 0)
        res.append(s_dict)
        
    return res

@router.delete("/sessions/{session_id}", summary="Terminate a specific session")
async def terminate_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSession).where(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    )
    result = await db.execute(stmt)
    session = result.scalars().first()
    
    if not session:
        raise ResourceNotFoundException("Session not found")
        
    session.is_active = False
    await db.commit()
    return {"message": "Session terminated"}

@router.delete("/sessions", summary="Terminate all other sessions")
async def terminate_all_other_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # In a real app, keep the current token active. Here we just mock revoking older ones.
    stmt = select(UserSession).where(UserSession.user_id == current_user.id).order_by(desc(UserSession.last_active_at))
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    for i, s in enumerate(sessions):
        if i != 0: # keep the most recent one alive
            s.is_active = False
            
    await db.commit()
    return {"message": "All other sessions terminated"}

@router.get("/activity", response_model=list[UserActivityResponse], summary="Get recent activity")
async def get_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserActivity).where(UserActivity.user_id == current_user.id).order_by(desc(UserActivity.created_at)).limit(50)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/audit", response_model=list[AuditLogResponse], summary="Get personal audit logs")
async def get_audit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).where(AuditLog.user_id == current_user.id).order_by(desc(AuditLog.created_at)).limit(100)
    result = await db.execute(stmt)
    return result.scalars().all()
