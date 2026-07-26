"""
Smoke test — verifies the API is reachable and the health endpoint works.
This is Phase 0's primary verification test.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Health endpoint returns 200 with correct payload."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Data Insight"
    assert "version" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client: AsyncClient):
    """Unknown routes return 404, not 500."""
    response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_response_has_request_id_header(client: AsyncClient):
    """Every response includes X-Request-ID header for tracing."""
    response = await client.get("/health")
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0
