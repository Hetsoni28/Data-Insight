import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from google import genai
from google.genai import types

from app.core.config import settings
from app.models.user import User
from app.models.tenant import Tenant
from app.models.storage import StorageFile
from app.models.ai_token_usage import AITokenUsage
from app.models.ai_ops import AIUsageLog, AIModel
from app.models.security import SecurityEvent, ComplianceReport
from app.models.user_session import UserSession

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                # Using the official google-genai SDK client
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")

    async def get_platform_context(self, db: AsyncSession) -> Dict[str, Any]:
        """Fetch real-time PostgreSQL platform stats to feed into the Gemini prompt."""
        try:
            # 1. Total & Active Users
            total_users = await db.scalar(select(func.count(User.id))) or 0
            active_users_count = await db.scalar(
                select(func.count(func.distinct(UserSession.user_id)))
                .where(UserSession.is_active == True)
            ) or 0

            # 2. Tenants & MRR
            total_tenants = await db.scalar(select(func.count(Tenant.id)).where(Tenant.is_deleted == False)) or 0
            active_tenants = await db.scalar(
                select(func.count(Tenant.id))
                .where(and_(Tenant.is_deleted == False, Tenant.is_active == True))
            ) or 0
            
            total_mrr = await db.scalar(
                select(func.sum(Tenant.mrr))
                .where(and_(Tenant.is_deleted == False, Tenant.is_active == True))
            ) or 0.0

            # Plan breakdown
            plans_query = await db.execute(
                select(Tenant.plan, func.count(Tenant.id))
                .where(Tenant.is_deleted == False)
                .group_by(Tenant.plan)
            )
            plan_breakdown = {plan: count for plan, count in plans_query.all()}

            # 3. Storage Used (bytes to GB)
            total_storage_bytes = await db.scalar(
                select(func.sum(StorageFile.file_size_bytes))
                .where(StorageFile.deleted_at == None)
            ) or 0
            total_storage_gb = round(total_storage_bytes / 1_073_741_824, 2)

            # 4. Security SOC status
            open_security_events = await db.scalar(
                select(func.count(SecurityEvent.id))
                .where(SecurityEvent.resolved == False)
            ) or 0
            
            severity_query = await db.execute(
                select(SecurityEvent.severity, func.count(SecurityEvent.id))
                .where(SecurityEvent.resolved == False)
                .group_by(SecurityEvent.severity)
            )
            unresolved_by_severity = {sev: count for sev, count in severity_query.all()}

            compliance_query = await db.execute(
                select(ComplianceReport.framework, ComplianceReport.score, ComplianceReport.status)
            )
            compliance_status = [
                {"framework": row.framework, "score": row.score, "status": row.status}
                for row in compliance_query.all()
            ]

            # 5. AI Telemetry & Quality
            ai_log_stats = await db.execute(
                select(
                    func.count(AIUsageLog.id).label("requests"),
                    func.coalesce(func.sum(AIUsageLog.tokens_total), 0).label("tokens"),
                    func.coalesce(func.sum(AIUsageLog.cost_usd), 0.0).label("cost"),
                    func.coalesce(func.avg(AIUsageLog.latency_ms), 0).label("latency")
                ).where(AIUsageLog.created_at >= datetime.now(timezone.utc) - timedelta(days=30))
            )
            ai_stats = ai_log_stats.fetchone()
            
            # 6. Detailed Tenant breakdown for granular query matching
            tenants_detailed_stmt = select(
                Tenant.id, Tenant.name, Tenant.plan, Tenant.mrr, Tenant.is_active
            ).where(Tenant.is_deleted == False).order_by(desc(Tenant.mrr)).limit(10)
            tenants_res = await db.execute(tenants_detailed_stmt)
            top_tenants = []
            for t in tenants_res.all():
                # Sub-query storage for this tenant
                t_storage = await db.scalar(
                    select(func.coalesce(func.sum(StorageFile.file_size_bytes), 0))
                    .where(and_(StorageFile.tenant_id == t.id, StorageFile.deleted_at == None))
                ) or 0
                t_users = await db.scalar(
                    select(func.count(User.id)).where(and_(User.tenant_id == t.id, User.is_active == True))
                ) or 0
                top_tenants.append({
                    "id": str(t.id),
                    "name": t.name,
                    "plan": t.plan,
                    "mrr": float(t.mrr),
                    "is_active": t.is_active,
                    "users_count": t_users,
                    "storage_gb": round(t_storage / 1_073_741_824, 3)
                })

            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "users": {
                    "total_registered": total_users,
                    "currently_active_sessions": active_users_count
                },
                "tenants": {
                    "total_organizations": total_tenants,
                    "active_organizations": active_tenants,
                    "mrr_usd": float(total_mrr),
                    "plan_distribution": plan_breakdown,
                    "top_organizations": top_tenants
                },
                "storage": {
                    "total_used_gb": total_storage_gb,
                    "total_used_bytes": total_storage_bytes
                },
                "security": {
                    "unresolved_events_count": open_security_events,
                    "unresolved_by_severity": unresolved_by_severity,
                    "compliance_posture": compliance_status
                },
                "ai_performance": {
                    "requests_last_30_days": int(ai_stats[0] or 0),
                    "tokens_last_30_days": int(ai_stats[1] or 0),
                    "cost_usd_last_30_days": round(float(ai_stats[2] or 0.0), 2),
                    "avg_latency_ms": int(ai_stats[3] or 0)
                }
            }
        except Exception as e:
            logger.error(f"Error compiling platform context: {e}", exc_info=True)
            return {"error": "Failed to compile platform context."}

    async def generate_chat_stream(
        self,
        question: str,
        history: List[Dict[str, str]],
        platform_context: Dict[str, Any],
        model: str = "gemini-2.5-flash"
    ) -> AsyncGenerator[str, None]:
        """Stream chat completions from Gemini using the google-genai SDK."""
        if not self.client:
            yield "Gemini API client not initialized. Please verify your GEMINI_API_KEY in backend/.env."
            return

        # Build prompt injecting the live PostgreSQL platform context
        context_json = json.dumps(platform_context, indent=2)
        system_prompt = (
            "You are the world-class Data Insight AI Command Center Copilot, designed for the Platform Owner.\n"
            "You have READ-ONLY access to real-time database stats of the platform.\n"
            "Here is the real-time system context (JSON format):\n"
            "--------------------------------------------------\n"
            f"{context_json}\n"
            "--------------------------------------------------\n"
            "Guidelines:\n"
            "- Answer questions regarding platform metrics, MRR, users, storage, security, and organizations using the JSON context above.\n"
            "- If the user asks you to generate code, scripts, or queries, wrap them in clean Markdown code blocks.\n"
            "- If the data supports visual analysis, you can format datasets as structured tables or return JSON arrays containing data that can be graphed.\n"
            "- When requested to generate reports or SQL queries, generate them as 'artifacts'. Specify a special tag structure so the frontend can intercept it:\n"
            "  `[ARTIFACT:type:title]` followed by the content and ending with `[/ARTIFACT]`.\n"
            "  Supported types: 'sql', 'excel', 'chart', 'json'. Example:\n"
            "  `[ARTIFACT:sql:Total Revenue Query]\nSELECT SUM(mrr) FROM tenants;\n[/ARTIFACT]`\n"
            "- Be direct, concise, and professional."
        )

        contents = []
        # Add system prompt as instructions
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.3,
            max_output_tokens=2048
        )

        # Build history structure
        # In GenAI SDK, we can pass a list of Content objects or format it in the prompt contents
        chat_contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            chat_contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg["content"])]
            ))
        
        chat_contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=question)]
        ))

        try:
            # Async stream generator
            response_stream = await self.client.aio.models.generate_content_stream(
                model=model,
                contents=chat_contents,
                config=config
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Error during Gemini generation: {e}")
            yield f"\n[Generation Error: {str(e)}]"

    async def analyze_file(
        self,
        file_bytes: bytes,
        file_name: str,
        mime_type: str,
        question: str,
        platform_context: Dict[str, Any],
        model: str = "gemini-2.5-flash"
    ) -> str:
        """Process file analysis (CSV, images, PDFs) with Gemini multi-modal client."""
        if not self.client:
            return "Gemini API client not initialized. Please verify your GEMINI_API_KEY in backend/.env."

        context_json = json.dumps(platform_context, indent=2)
        system_prompt = (
            "You are the world-class Data Insight AI Command Center Copilot.\n"
            "You have access to real-time database stats of the platform:\n"
            f"{context_json}\n"
            "Analyze the uploaded file combined with the platform statistics if applicable. Answer the user query accurately."
        )

        try:
            # GenAI SDK file upload support via Part.from_bytes
            file_part = types.Part.from_bytes(
                data=file_bytes,
                mime_type=mime_type
            )
            
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3
            )

            contents = [file_part, question]

            response = await self.client.aio.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            logger.error(f"Error analyzing file with Gemini: {e}")
            return f"Error analyzing file: {str(e)}"
