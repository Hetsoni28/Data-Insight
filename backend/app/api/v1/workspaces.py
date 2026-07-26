"""Workspace CRUD endpoints."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.services.workspace import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=201, summary="Create workspace")
async def create_workspace(
    body: WorkspaceCreate,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = WorkspaceService(db)
    return await svc.create_workspace(
        name=body.name,
        actor=current_user,
        description=body.description,
        icon=body.icon,
        color=body.color,
    )


@router.get("", response_model=list[WorkspaceResponse], summary="List workspaces")
async def list_workspaces(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = WorkspaceService(db)
    return await svc.list_workspaces(current_user)


@router.get("/{workspace_id}", response_model=WorkspaceResponse, summary="Get workspace")
async def get_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = WorkspaceService(db)
    return await svc.get_workspace(workspace_id, current_user)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse, summary="Update workspace")
async def update_workspace(
    workspace_id: uuid.UUID,
    body: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = WorkspaceService(db)
    return await svc.update_workspace(workspace_id, body.model_dump(exclude_none=True), current_user)


@router.delete("/{workspace_id}", status_code=204, summary="Delete workspace")
async def delete_workspace(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = WorkspaceService(db)
    await svc.delete_workspace(workspace_id, current_user)
