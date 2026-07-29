"""AIService — multi-model routing, token tracking, and Copilot chat."""
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from google.genai import types
from openai import AsyncOpenAI

from app.models.user import User
from app.models.ai_token_usage import AITokenUsage
from app.core.config import settings
from app.core.exceptions import AIServiceException

# Model pricing per 1K tokens (USD) — Gemini free tier is $0
MODEL_COSTS = {
    "gemini-3.5-flash": {"prompt": 0.0, "completion": 0.0},
    "gemini-2.5-pro": {"prompt": 0.0, "completion": 0.0},
}

MAX_HISTORY = 10


class AIService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self._gemini = None
        self._openai = None
        
        if settings.GEMINI_API_KEY:
            try:
                self._gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception:
                pass
        
        if settings.OPENAI_API_KEY:
            self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
        self._default_model = "gemini-3.5-flash" if self._gemini else "gpt-4o-mini"

    async def _check_and_track_tokens(
        self,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        feature: str,
        report_id: uuid.UUID | None = None,
        dataset_id: uuid.UUID | None = None,
    ) -> None:
        costs = MODEL_COSTS.get(model, {"prompt": 0, "completion": 0})
        cost = (prompt_tokens / 1000 * costs["prompt"]) + (completion_tokens / 1000 * costs["completion"])

        usage = AITokenUsage(
            tenant_id=tenant_id,
            user_id=user_id,
            feature=feature,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            cost_usd=cost,
            report_id=report_id,
            dataset_id=dataset_id,
        )
        self.session.add(usage)
        await self.session.flush()

    async def copilot_chat(
        self,
        question: str,
        dataset_id: uuid.UUID,
        actor: User,
        history: list[dict] | None = None,
    ) -> dict:
        if not self._gemini and not self._openai:
            raise AIServiceException("AI API key is not configured.")

        clean_question = _sanitize_prompt(question)
        
        if self._gemini:
            try:
                # Gemini doesn't use standard roles in this quick method, we just format history as text
                prompt_text = "You are a professional business intelligence analyst.\nAnswer questions about the user's data clearly and concisely in business language.\n\n"
                if history:
                    for h in history[-MAX_HISTORY:]:
                        prompt_text += f"{h['role'].capitalize()}: {h['content']}\n"
                prompt_text += f"\nUser: {clean_question}\nAnalyst:"

                response = await self._gemini.aio.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=prompt_text,
                    config=types.GenerateContentConfig(temperature=0.3)
                )
                
                if response.usage_metadata:
                    await self._check_and_track_tokens(
                        tenant_id=actor.tenant_id, user_id=actor.id, model="gemini-3.5-flash",
                        prompt_tokens=response.usage_metadata.prompt_token_count,
                        completion_tokens=response.usage_metadata.candidates_token_count,
                        feature="copilot_chat", dataset_id=dataset_id,
                    )
                return {"answer": response.text, "model": "gemini-3.5-flash"}
            except Exception as e:
                print(f"Gemini error: {e}")
                # Fallback to OpenAI if Gemini fails (e.g. 429 quota exceeded)
                if not self._openai:
                    raise AIServiceException(f"AI service error (Gemini): {str(e)}")
                # Continue to OpenAI block

        if self._openai:
            # Fallback to OpenAI
            messages = [{"role": "system", "content": "You are a professional business intelligence analyst."}]
            if history:
                messages.extend(history[-MAX_HISTORY:])
            messages.append({"role": "user", "content": clean_question})
            try:
                response = await self._openai.chat.completions.create(model=self._default_model, messages=messages, max_tokens=1500, temperature=0.3)
                if response.usage:
                    await self._check_and_track_tokens(tenant_id=actor.tenant_id, user_id=actor.id, model=self._default_model, prompt_tokens=response.usage.prompt_tokens, completion_tokens=response.usage.completion_tokens, feature="copilot_chat", dataset_id=dataset_id)
                return {"answer": response.choices[0].message.content, "model": self._default_model}
            except Exception as e:
                raise AIServiceException(f"AI service error: {str(e)}")

    async def generate_blueprint(
        self,
        dataset_summary: str,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        dataset_id: uuid.UUID,
    ) -> dict:
        if not self._gemini and not self._openai:
            raise AIServiceException("AI API key is not configured.")

        prompt = f"""You are a senior business intelligence architect designing an Excel workbook.

Dataset summary:
{dataset_summary}

Design a complete Excel workbook blueprint as JSON with the following structure:
{{
  "sheets": [
    {{
      "name": "Executive Dashboard",
      "type": "kpi_dashboard",
      "kpis": [...],
      "charts": [...]
    }}
  ],
  "detected_kpis": ["Revenue", "Growth Rate"],
  "primary_date_column": "date_column_name_or_null",
  "primary_metric_column": "metric_column_name",
  "groupby_dimension": "category_column_name_or_null",
  "executive_summary_prompt": "Brief prompt for writing the executive summary"
}}

Include these 10 sheets: Cover, Executive Dashboard, AI Executive Summary, Charts & Visualizations, Cleaned Data, KPI Analysis, Pivot Analysis, Forecast, Risk & Anomaly Report, Methodology.
Return ONLY valid JSON. Do not include markdown code block syntax (like ```json), just the raw JSON object."""

        if self._gemini:
            try:
                response = await self._gemini.aio.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        response_mime_type="application/json"
                    )
                )
                
                content = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                blueprint = json.loads(content)

                if response.usage_metadata:
                    await self._check_and_track_tokens(
                        tenant_id=tenant_id, user_id=user_id, model="gemini-3.5-flash",
                        prompt_tokens=response.usage_metadata.prompt_token_count,
                        completion_tokens=response.usage_metadata.candidates_token_count,
                        feature="report_blueprint", report_id=report_id, dataset_id=dataset_id,
                    )
                return blueprint
            except Exception as e:
                print(f"Gemini error: {e}")
                if not self._openai:
                    raise AIServiceException(f"Blueprint generation failed (Gemini): {str(e)}")

        if self._openai:
            # Fallback to OpenAI
            try:
                response = await self._openai.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], max_tokens=4096, temperature=0.2)
                content = response.choices[0].message.content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                blueprint = json.loads(content)
                if response.usage:
                    await self._check_and_track_tokens(tenant_id=tenant_id, user_id=user_id, model="gpt-4o-mini", prompt_tokens=response.usage.prompt_tokens, completion_tokens=response.usage.completion_tokens, feature="report_blueprint", report_id=report_id, dataset_id=dataset_id)
                return blueprint
            except Exception as e:
                raise AIServiceException(f"Blueprint generation failed (OpenAI): {str(e)}")

    async def write_executive_summary(
        self,
        blueprint: dict,
        data_insights: str,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
    ) -> str:
        prompt = f"""You are a senior business analyst writing an executive summary for a board report.

Key findings from the data:
{data_insights}

Workbook blueprint summary:
KPIs detected: {', '.join(blueprint.get('detected_kpis', []))}

Write a professional executive summary with exactly 5 sections:
1. OVERVIEW — What the data shows overall (2 paragraphs)
2. TOP FINDINGS — 3 positive findings (numbered list)
3. KEY CONCERNS — 3 risks or concerns (numbered list)
4. RECOMMENDATIONS — 5 numbered, specific, actionable recommendations
5. OUTLOOK — What to watch in the next quarter (1 paragraph)

Write in professional business English. Be specific, not generic."""

        if self._gemini:
            try:
                response = await self._gemini.aio.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.4)
                )
                if response.usage_metadata:
                    await self._check_and_track_tokens(
                        tenant_id=tenant_id, user_id=user_id, model="gemini-3.5-flash",
                        prompt_tokens=response.usage_metadata.prompt_token_count,
                        completion_tokens=response.usage_metadata.candidates_token_count,
                        feature="report_narrative", report_id=report_id,
                    )
                return response.text
            except Exception as e:
                print(f"Gemini error: {e}")
                if not self._openai:
                    raise AIServiceException(f"Summary generation failed (Gemini): {str(e)}")

        if self._openai:
            # Fallback to OpenAI
            try:
                response = await self._openai.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], max_tokens=2000, temperature=0.4)
                if response.usage:
                    await self._check_and_track_tokens(tenant_id=tenant_id, user_id=user_id, model="gpt-4o-mini", prompt_tokens=response.usage.prompt_tokens, completion_tokens=response.usage.completion_tokens, feature="report_narrative", report_id=report_id)
                return response.choices[0].message.content
            except Exception as e:
                raise AIServiceException(f"Summary generation failed (OpenAI): {str(e)}")


def _sanitize_prompt(text: str) -> str:
    injection_patterns = [
        "ignore previous instructions",
        "ignore all previous",
        "disregard your instructions",
        "you are now",
        "act as",
        "forget your",
        "new instructions:",
        "system prompt:",
        "\\n\\nHuman:",
        "\\n\\nAssistant:",
    ]
    lower = text.lower()
    for pattern in injection_patterns:
        if pattern in lower:
            idx = lower.find(pattern)
            text = text[:idx].strip()
            break
    return text[:4000]
