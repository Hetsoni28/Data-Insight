"""AITokenUsage repository."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_token_usage import AITokenUsage
from app.repositories.base import BaseRepository


class AITokenRepository(BaseRepository[AITokenUsage]):
    def __init__(self, session: AsyncSession):
        super().__init__(AITokenUsage, session)

    async def get_monthly_tokens(self, tenant_id: uuid.UUID) -> int:
        now = datetime.now(timezone.utc)
        stmt = select(func.coalesce(func.sum(AITokenUsage.total_tokens), 0)).where(
            and_(
                AITokenUsage.tenant_id == tenant_id,
                func.extract("month", AITokenUsage.created_at) == now.month,
                func.extract("year", AITokenUsage.created_at) == now.year,
            ),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
