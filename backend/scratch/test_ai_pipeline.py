import asyncio
import sys
import uuid
import os
sys.path.append('.')

from app.db.session import AsyncSessionLocal
from app.repositories.dataset import DatasetRepository
from app.repositories.report import ReportRepository
from app.services.report import ReportService
from app.models.dataset import Dataset, DatasetStatus, DatasetFileType
from app.models.report import ReportType, ReportStatus
from sqlalchemy import text

async def run():
    async with AsyncSessionLocal() as session:
        # 1. Get user and workspace
        result = await session.execute(text('SELECT id, email, tenant_id FROM users LIMIT 1'))
        user_row = result.fetchone()
        if not user_row:
            print("No user found")
            return
        
        class FakeUser:
            id = user_row.id
            tenant_id = user_row.tenant_id
        
        user = FakeUser()

        ws_result = await session.execute(text('SELECT id FROM workspaces WHERE tenant_id = :tid LIMIT 1'), {'tid': user.tenant_id})
        ws_row = ws_result.fetchone()
        if not ws_row:
            print("No workspace found")
            return
        workspace_id = ws_row.id

        # 2. Create a dummy CSV file on disk for the test
        from app.core.storage import LOCAL_UPLOADS_DIR, DATASETS_BUCKET
        csv_data = """Date,Product,Region,Sales,Profit
2023-01-01,Widget A,North,1500,300
2023-01-02,Widget B,South,2200,450
2023-01-03,Widget A,East,1100,200
2023-01-04,Widget C,West,3400,800
2023-01-05,Widget B,North,1800,350
2023-01-06,Widget A,South,2100,420
2023-01-07,Widget C,East,3100,750
"""
        file_url = f"test_data_{uuid.uuid4().hex}.csv"
        local_path = LOCAL_UPLOADS_DIR / DATASETS_BUCKET / file_url
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(csv_data)

        # 3. Create Dataset Record
        dataset = Dataset(
            tenant_id=user.tenant_id,
            workspace_id=workspace_id,
            name="Test Sales Data",
            file_url=file_url,
            file_type=DatasetFileType.csv,
            file_size_bytes=len(csv_data.encode('utf-8')),
            original_filename="test_sales_data.csv",
            uploaded_by_id=user.id,
            status=DatasetStatus.ready,  # skip profiling for this test
            row_count=7,
            column_count=5,
            profile={
                "row_count": 7,
                "column_count": 5,
                "columns": {
                    "Date": {"type": "datetime", "null_pct": 0},
                    "Product": {"type": "categorical", "null_pct": 0},
                    "Region": {"type": "categorical", "null_pct": 0},
                    "Sales": {"type": "numeric", "null_pct": 0},
                    "Profit": {"type": "numeric", "null_pct": 0},
                }
            }
        )
        session.add(dataset)
        await session.commit()
        await session.refresh(dataset)

        # 4. Trigger Report Generation Manually (Bypass Celery)
        print("Triggering Report Generation (Synchronously)...")
        from app.models.report import Report, ReportStatus, ReportType
        report = Report(
            tenant_id=user.tenant_id,
            workspace_id=workspace_id,
            dataset_id=dataset.id,
            created_by_id=user.id,
            title="Sales AI Dashboard Test",
            report_type=ReportType.excel,
            status=ReportStatus.queued,
            generation_config={},
            progress=0,
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)

        from app.worker.tasks.report_tasks import _run_excel_pipeline
        import app.services.ai_service
        
        class MockAIService:
            def __init__(self, session):
                self.session = session
            async def generate_blueprint(self, dataset_summary, tenant_id, user_id, report_id, dataset_id):
                return {
                    "domain": "Sales",
                    "primary_date_column": "Date",
                    "primary_metric_column": "Sales",
                    "groupby_dimension": "Region",
                    "detected_kpis": [{"name": "Sales", "description": "Total sales", "type": "currency"}],
                    "recommended_charts": [],
                    "pivot_tables": [],
                    "anomaly_detection_column": "Sales",
                    "executive_summary_prompt": "Summarize sales"
                }
            async def write_executive_summary(self, blueprint, data_insights, tenant_id, user_id, report_id):
                return "1. OVERVIEW\nSales are good.\n2. TOP FINDINGS\nWe sold widgets.\n3. KEY RISKS & CONCERNS\nNone.\n4. EXECUTIVE RECOMMENDATIONS\nSell more.\n5. OUTLOOK\nUpward."

        app.services.ai_service.AIService = MockAIService

        try:
            # We must run it without AsyncSessionLocal conflicting if it opens a new one, 
            # actually _run_excel_pipeline opens its own AsyncSessionLocal, so it's fine!
            await _run_excel_pipeline(None, str(report.id))
            
            await session.refresh(report)
            if report.status == ReportStatus.ready:
                print("\n✅ SUCCESS! Excel Report Generated.")
                print(f"Download URL: {report.output_url}")
                print(f"File Size: {report.output_size_bytes} bytes")
            elif report.status == ReportStatus.error:
                print(f"\n❌ ERROR! Report generation failed: {report.error_message}")
            else:
                print(f"Status is {report.status}")
                
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(run())
