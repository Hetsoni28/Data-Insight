import asyncio
import io
import uuid
import pandas as pd
from typing import Dict, Any
from asgiref.sync import async_to_sync

from app.worker.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.report import Report, ReportStatus
from app.models.dataset import Dataset, DatasetFileType
from app.core.storage import download_file_bytes, DATASETS_BUCKET
from app.core.ai import generate_structured_report


async def _process_ai_report(
    tenant_id: str, report_id: str, dataset_id: str, report_category: str
):
    """
    Core async logic for processing AI reports based on category.
    """
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # 1. Fetch Report and Dataset
        r_stmt = select(Report).where(
            Report.id == uuid.UUID(report_id), Report.tenant_id == uuid.UUID(tenant_id)
        )
        report = (await db.execute(r_stmt)).scalars().first()
        if not report:
            return

        d_stmt = select(Dataset).where(
            Dataset.id == uuid.UUID(dataset_id),
            Dataset.tenant_id == uuid.UUID(tenant_id),
        )
        dataset = (await db.execute(d_stmt)).scalars().first()
        if not dataset:
            report.status = ReportStatus.error
            report.error_message = "Dataset not found"
            await db.commit()
            return

        try:
            # 2. Download and parse Dataset (limiting to 1000 rows for token limits for now,
            # though Gemini supports millions, Pandas read overhead exists)
            file_bytes = await download_file_bytes(DATASETS_BUCKET, dataset.file_url)
            file_buffer = io.BytesIO(file_bytes)

            if dataset.file_type == DatasetFileType.csv:
                df = pd.read_csv(file_buffer)
            elif dataset.file_type == DatasetFileType.xlsx:
                df = pd.read_excel(file_buffer)
            elif dataset.file_type == DatasetFileType.json:
                df = pd.read_json(file_buffer)
            else:
                df = pd.read_csv(file_buffer)

            # Sample the data to fit comfortably and quickly in context (first 5000 rows max)
            sample_df = df.head(5000)
            csv_data = sample_df.to_csv(index=False)

            # Data stats
            total_rows = len(df)
            total_cols = len(df.columns)

            # 3. Choose the appropriate AI schema and prompt
            if report_category == "executive":
                prompt = f"""
                You are an elite Enterprise Business Analyst.
                Analyze the following dataset and generate an Executive Summary Report.
                Dataset Info: {dataset.name} ({total_rows} rows, {total_cols} columns).
                Below is a sample of the data (up to 5000 rows):
                
                {csv_data}
                
                Generate a highly professional, detailed executive summary matching the requested JSON structure exactly. 
                Do not include markdown blocks, just the raw JSON.
                """
                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "companyOverview": {"type": "STRING"},
                        "datasetSummary": {"type": "STRING"},
                        "businessHighlights": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "executiveKPIs": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "label": {"type": "STRING"},
                                    "value": {"type": "STRING"},
                                    "trend": {"type": "STRING"},
                                },
                            },
                        },
                        "revenueOverview": {"type": "STRING"},
                        "profitAnalysis": {"type": "STRING"},
                        "growthAnalysis": {"type": "STRING"},
                        "topInsights": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "businessOpportunities": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "potentialRisks": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "keyRecommendations": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "managementActionPlan": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "executiveConclusion": {"type": "STRING"},
                    },
                    "required": [
                        "companyOverview",
                        "datasetSummary",
                        "businessHighlights",
                        "executiveKPIs",
                        "revenueOverview",
                        "profitAnalysis",
                        "growthAnalysis",
                        "topInsights",
                        "businessOpportunities",
                        "potentialRisks",
                        "keyRecommendations",
                        "managementActionPlan",
                        "executiveConclusion",
                    ],
                }

            elif report_category == "ai-insight":
                prompt = f"""
                You are a world-class Data Scientist.
                Perform a Deep AI Data Profiling and Analysis on the following dataset.
                Dataset Info: {dataset.name} ({total_rows} rows, {total_cols} columns).
                Below is a sample of the data (up to 5000 rows):
                
                {csv_data}
                
                Generate a highly professional AI Analysis Report matching the requested JSON structure exactly.
                """
                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "missingValues": {"type": "STRING"},
                        "outliers": {"type": "STRING"},
                        "dataDistribution": {"type": "STRING"},
                        "correlations": {"type": "STRING"},
                        "businessTrends": {"type": "STRING"},
                        "seasonality": {"type": "STRING"},
                        "customerBehavior": {"type": "STRING"},
                        "salesPerformance": {"type": "STRING"},
                        "departmentPerformance": {"type": "STRING"},
                        "revenueDrivers": {"type": "STRING"},
                        "profitability": {"type": "STRING"},
                        "businessRisks": {"type": "STRING"},
                        "anomalyDetection": {"type": "STRING"},
                        "aiInsights": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "businessRecommendations": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "forecastOpportunities": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"},
                        },
                        "confidenceScores": {
                            "type": "OBJECT",
                            "properties": {
                                "dataQuality": {"type": "INTEGER"},
                                "predictability": {"type": "INTEGER"},
                                "overallConfidence": {"type": "INTEGER"},
                            },
                        },
                    },
                }
            elif report_category == "dashboard":
                prompt = f"""
                You are a Senior Data Visualization Expert.
                Analyze the following dataset and generate a dynamic BI Dashboard configuration.
                Dataset Info: {dataset.name} ({total_rows} rows, {total_cols} columns).
                Below is a sample of the data (up to 5000 rows):
                
                {csv_data}
                
                Generate a highly professional BI Dashboard JSON layout containing multiple chart configurations.
                """
                schema = {
                    "type": "OBJECT",
                    "properties": {
                        "dashboardTitle": {"type": "STRING"},
                        "dashboardSummary": {"type": "STRING"},
                        "charts": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "chartId": {"type": "STRING"},
                                    "title": {"type": "STRING"},
                                    "chartType": {
                                        "type": "STRING"
                                    },  # "bar", "line", "pie", "area"
                                    "description": {"type": "STRING"},
                                    "xAxisKey": {"type": "STRING"},
                                    "yAxisKey": {"type": "STRING"},
                                    "data": {
                                        "type": "ARRAY",
                                        "items": {
                                            "type": "OBJECT",
                                            "properties": {
                                                "name": {"type": "STRING"},
                                                "value": {"type": "NUMBER"},
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                }

            if report_category in ["executive", "ai-insight", "dashboard"]:
                ai_blueprint = generate_structured_report(prompt, schema)

            elif report_category in ["forecast", "trend_forecast"]:
                # Use real Machine Learning Time-Series Forecasting Engine
                from app.services.analytics.forecasting_engine import ForecastingEngine

                ai_blueprint = ForecastingEngine.fit_and_forecast(df, horizon=6)
            else:
                raise ValueError(f"Unsupported report category: {report_category}")

            # 5. Save to database
            report.ai_blueprint = ai_blueprint
            report.status = ReportStatus.ready
            report.progress = 100

            await db.commit()

        except Exception as e:
            import traceback

            traceback.print_exc()
            report.status = ReportStatus.error
            report.error_message = str(e)
            await db.commit()


@celery_app.task(name="generate_executive_summary")
def generate_executive_summary_task(tenant_id: str, report_id: str, dataset_id: str):
    async_to_sync(_process_ai_report)(tenant_id, report_id, dataset_id, "executive")


@celery_app.task(name="generate_ai_analysis")
def generate_ai_analysis_task(tenant_id: str, report_id: str, dataset_id: str):
    async_to_sync(_process_ai_report)(tenant_id, report_id, dataset_id, "ai-insight")


@celery_app.task(name="generate_bi_dashboard")
def generate_bi_dashboard_task(tenant_id: str, report_id: str, dataset_id: str):
    async_to_sync(_process_ai_report)(tenant_id, report_id, dataset_id, "dashboard")


@celery_app.task(name="generate_trend_forecast")
def generate_trend_forecast_task(tenant_id: str, report_id: str, dataset_id: str):
    async_to_sync(_process_ai_report)(tenant_id, report_id, dataset_id, "forecast")
