import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, ResourceNotFoundException
from app.models.user import User
from app.repositories.dataset import DatasetRepository
from app.services.dataset_query_service import DatasetQueryService


class ReportQueryService:
    """Service to handle dynamic reporting queries using DuckDB / Analytics Engine."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.dataset_repo = DatasetRepository(session)
        self.query_service = DatasetQueryService(session)

    async def execute_query(
        self, dataset_id: uuid.UUID, query_config: dict, actor: User,
    ) -> list[dict[str, Any]]:
        """Executes a structured query object against an authorized dataset via DuckDB.

        query_config = {
            "dimensions": ["region"],
            "metrics": [{"field": "revenue", "aggregation": "sum"}],
            "filters": [{"field": "year", "operator": "eq", "value": 2024}],
            "limit": 100,
            "order_by": "revenue",
            "order_dir": "desc"
        }
        """
        # 1. Authorize dataset belongs to actor's tenant
        if not actor.tenant_id:
            raise ForbiddenException("User must belong to a tenant to query datasets.")

        dataset = await self.dataset_repo.get_tenant_dataset(
            actor.tenant_id, dataset_id,
        )
        if not dataset:
            raise ResourceNotFoundException("Dataset", str(dataset_id))

        # 2. Delegate to DatasetQueryService which executes real DuckDB SQL
        results = await self.query_service.execute_structured_query(
            dataset_id=dataset_id,
            tenant_id=actor.tenant_id,
            query_config=query_config,
        )

        return results
