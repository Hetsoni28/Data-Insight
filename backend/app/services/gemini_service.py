from google import genai
from google.genai import types
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.tenant import Tenant
from app.models.user import User
from app.models.ai_ops import AIProvider, AIUsageLog, ProviderStatus
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class GeminiService:
    def __init__(self):
        self.client = None
        if GEMINI_API_KEY:
            self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model_name = "gemini-flash-latest"

    async def _get_platform_context(self, db: AsyncSession, tenant_id: str) -> str:
        """Fetches live DB data to inject into the Gemini system prompt"""
        tenant = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant.scalars().first()
        
        user_count = await db.execute(select(func.count(User.id)).where(User.tenant_id == tenant_id))
        user_count = user_count.scalar()
        
        if not tenant:
            return "No tenant context found."
            
        return f"""
        PLATFORM CONTEXT:
        Organization Name: {tenant.name}
        Total Users: {user_count}
        Subscription Tier: {tenant.plan}
        Active: {tenant.is_active}
        """

    async def _get_owner_system_context(self, db: AsyncSession) -> str:
        """Fetches live DB data for the entire platform (Super Admin context)"""
        # Tenants
        tenants_result = await db.execute(select(Tenant).where(Tenant.is_deleted == False).limit(100))
        tenants_list = tenants_result.scalars().all()
        total_tenants = len(tenants_list)
        active_tenants = sum(1 for t in tenants_list if t.is_active)
        total_mrr = sum((float(t.mrr) if t.mrr else 0.0) for t in tenants_list)
        
        tenants_summary = []
        for t in tenants_list:
            tenants_summary.append(f"- {t.name} (Plan: {t.plan}, MRR: ${t.mrr}, Active: {t.is_active})")
        tenants_summary_str = "\n        ".join(tenants_summary) if tenants_summary else "No organizations found."
        
        # Users
        users_result = await db.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0
        
        # AI Health & Metrics
        providers_result = await db.execute(select(AIProvider))
        providers = providers_result.scalars().all()
        total_providers = len(providers)
        online_providers = sum(1 for p in providers if p.status == ProviderStatus.ONLINE)
        
        usage_result = await db.execute(
            select(
                func.count(AIUsageLog.id),
                func.sum(AIUsageLog.cost_usd)
            )
        )
        usage_stats = usage_result.fetchone()
        total_ai_requests = int(usage_stats[0] or 0)
        total_ai_cost = float(usage_stats[1] or 0.0)
        
        # Recent Audit Logs
        from app.models.audit_log import AuditLog
        from sqlalchemy import desc
        logs_result = await db.execute(
            select(AuditLog.action, AuditLog.status, AuditLog.severity, AuditLog.created_at, AuditLog.module)
            .order_by(desc(AuditLog.created_at))
            .limit(15)
        )
        logs_data = logs_result.all()
        audit_logs_str = "\n        ".join([f"- [{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {log.module.upper()}: {log.action} ({log.status}, {log.severity})" for log in logs_data]) if logs_data else "No recent audit logs."

        return f"""
        GLOBAL PLATFORM CONTEXT (OWNER):
        Total Organizations: {total_tenants} ({active_tenants} active)
        Platform Monthly Recurring Revenue (MRR): ${total_mrr:.2f}
        Total Users Across Platform: {total_users}
        
        ORGANIZATION DETAILS:
        {tenants_summary_str}
        
        AI Providers: {online_providers}/{total_providers} online
        Total AI Requests: {total_ai_requests}
        Total AI API Cost: ${total_ai_cost:.2f}
        
        RECENT AUDIT LOGS (Last 15 events):
        {audit_logs_str}
        """

    async def generate_chat_stream(self, db: AsyncSession, tenant_id: str, message: str, history: list, files: list = None, is_owner: bool = False):
        if is_owner:
            context = await self._get_owner_system_context(db)
        else:
            context = await self._get_platform_context(db, tenant_id)
        
        system_instruction = f"""
        You are the Data Insight Owner AI Command Center.
        You are an elite, executive-level AI assistant for the platform owner.
        You have direct access to the SaaS platform data.
        
        {context}
        
        Answer professionally, concisely, and use Markdown for all formatting.
        Do not make up fake data. If asked about data not in your context, say you cannot access it right now.
        """
        
        # Build contents from history
        contents = []
        for h in history:
            role = "user" if h.get("role") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h.get("content", ""))]))
            
        parts = []
        
        # Process uploaded files (omitted for brevity, keep existing logic if needed)
        uploaded_gemini_files = []
        if files:
            import tempfile
            import os
            
            for file in files:
                content = await file.read()
                if not content:
                    continue
                ext = os.path.splitext(file.filename)[1]
                temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
                with os.fdopen(temp_fd, 'wb') as f:
                    f.write(content)
                try:
                    gemini_file = self.client.files.upload(file=temp_path, config={'display_name': file.filename})
                    uploaded_gemini_files.append(gemini_file)
                    parts.append(types.Part.from_uri(file_uri=gemini_file.uri, mime_type=gemini_file.mime_type))
                except Exception as e:
                    print(f"Error uploading file {file.filename} to Gemini: {e}")
                finally:
                    os.remove(temp_path)
        
        parts.append(types.Part.from_text(text=message))
        contents.append(types.Content(role="user", parts=parts))

        if not self.client:
            yield "Google Gemini API key is missing. Please configure GEMINI_API_KEY in your environment."
            return

        try:
            response = await self.client.aio.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7
                )
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            yield "I'm sorry, I encountered an error connecting to Google Gemini. Please ensure your API key is correctly configured."

gemini_service = GeminiService()
