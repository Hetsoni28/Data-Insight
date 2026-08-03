from google import genai
from google.genai import types
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.tenant import Tenant
from app.models.user import User
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

    async def generate_chat_response(self, db: AsyncSession, tenant_id: str, message: str, history: list, files: list = None) -> str:
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
        
        # Process uploaded files
        uploaded_gemini_files = []
        if files:
            import tempfile
            import os
            
            for file in files:
                # Need to read and write temp file because genai.Client().files.upload expects a file path
                content = await file.read()
                if not content:
                    continue
                    
                ext = os.path.splitext(file.filename)[1]
                temp_fd, temp_path = tempfile.mkstemp(suffix=ext)
                with os.fdopen(temp_fd, 'wb') as f:
                    f.write(content)
                
                try:
                    # Upload to Gemini API
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
            return "Google Gemini API key is missing. Please configure GEMINI_API_KEY in your environment."

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7
                )
            )
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return "I'm sorry, I encountered an error connecting to Google Gemini. Please ensure your API key is correctly configured."

gemini_service = GeminiService()
