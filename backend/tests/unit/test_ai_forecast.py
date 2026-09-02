import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.api.deps import get_current_active_tenant_user
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_ai_forecast_endpoint():
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.tenant_id = "tenant-123"
    
    app.dependency_overrides[get_current_active_tenant_user] = lambda: mock_user

    with patch("app.services.analytics.forecasting_engine.ForecastingEngine") as MockEngine:
        # Mock class method
        MockEngine.fit_and_forecast.return_value = {
            "forecast": [{"ds": "2024-01-01", "yhat": 100, "yhat_lower": 90, "yhat_upper": 110}]
        }
        
        with patch("app.core.storage.download_file_bytes", new_callable=AsyncMock) as mock_dl:
            mock_dl.return_value = b"mock csv data"
            
            from app.api.deps import get_db
            mock_db = AsyncMock()
            mock_dataset = MagicMock()
            mock_dataset.storage_path = "path/to/data.csv"
            
            mock_execute_result = MagicMock()
            mock_execute_result.scalars.return_value.first.return_value = mock_dataset
            mock_db.execute.return_value = mock_execute_result
            
            app.dependency_overrides[get_db] = lambda: mock_db
            
            valid_uuid = str(uuid.uuid4())
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post(
                    "/api/v1/ai/forecast",
                    json={"dataset_id": valid_uuid, "date_column": "date", "target_column": "revenue", "periods": 30}
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "forecast" in data

    app.dependency_overrides.clear()
