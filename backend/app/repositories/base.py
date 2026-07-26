"""Generic async base repository — reusable CRUD for all entities."""
import uuid
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import Base

ModelType = TypeVar("ModelType", bound=Base)  # type: ignore[type-arg]


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: uuid.UUID | str) -> Optional[ModelType]:
        if isinstance(id, str):
            id = uuid.UUID(id)
        stmt = select(self.model).where(self.model.id == id)  # type: ignore[attr-defined]
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_all(self, limit: int = 100, offset: int = 0) -> List[ModelType]:
        stmt = select(self.model).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def save(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.session.delete(obj)
        await self.session.flush()
