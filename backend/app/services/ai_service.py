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

        # Fetch the dataset to inject its schema into the context
        from app.repositories.dataset import DatasetRepository
        ds_repo = DatasetRepository(self.session)
        dataset = await ds_repo.get_tenant_dataset(actor.tenant_id, dataset_id)
        
        dataset_context = ""
        if dataset and dataset.profile:
            import json
            # Extract basic schema and stats without overwhelming the context limit
            profile_summary = {
                "name": dataset.name,
                "row_count": dataset.profile.get("row_count"),
                "column_count": dataset.profile.get("column_count"),
                "columns": {k: {"type": v.get("type"), "null_pct": v.get("null_pct")} for k, v in dataset.profile.get("columns", {}).items()}
            }
            dataset_context = f"\n\nDATASET CONTEXT:\n{json.dumps(profile_summary, indent=2)}\n"

        clean_question = _sanitize_prompt(question)
        
        if self._gemini:
            try:
                # Gemini doesn't use standard roles in this quick method, we just format history as text
                prompt_text = "You are a professional business intelligence analyst.\nAnswer questions about the user's data clearly and concisely in business language."
                prompt_text += dataset_context + "\n"
                
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
            sys_msg = "You are a professional business intelligence analyst." + dataset_context
            messages = [{"role": "system", "content": sys_msg}]
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

        prompt = f"""You are a Principal Data Scientist, Business Intelligence Architect, Financial Analyst, Excel Automation Expert, and AI Engineer from Microsoft Excel, Power BI, Tableau, Google Looker, Stripe, Amazon, and McKinsey.

Your task is to generate the blueprint for a completely NEW AI-powered Microsoft Excel workbook that looks like a professionally designed Business Intelligence report prepared by a Fortune 500 consulting firm.

Dataset summary (raw data profile):
{dataset_summary}

Step 1: Understand the business domain (e.g. Sales, Finance, HR, Logistics).
Step 2: Detect the most important KPIs to calculate.
Step 3: Determine the best columns to use for categorical and time-series analysis.
Step 4: Design the 12-sheet architecture blueprint.

Return ONLY valid JSON with this exact structure:
{{
  "domain": "Inferred Business Domain",
  "primary_date_column": "column_name_or_null",
  "primary_metric_column": "column_name",
  "groupby_dimension": "column_name_or_null",
  "detected_kpis": [
    {{"name": "Revenue", "description": "Total revenue generated", "type": "currency"}},
    {{"name": "Growth Rate", "description": "Month over month growth", "type": "percentage"}}
  ],
  "recommended_charts": [
    {{"title": "Revenue by Region", "type": "bar", "x_col": "Region", "y_col": "Revenue"}}
  ],
  "pivot_tables": [
    {{"name": "Sales by Product", "rows": "Product", "values": "Sales"}}
  ],
  "anomaly_detection_column": "column_name_to_check_for_outliers",
  "executive_summary_prompt": "Specific instructions for the narrative AI to write the executive summary based on this domain."
}}

Do not include markdown code block syntax (like ```json), just the raw JSON object."""

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
        prompt = f"""You are a Principal Data Scientist and Business Strategy Consultant from McKinsey & Company writing an AI Executive Summary for a Board of Directors report.

Business Domain: {blueprint.get('domain', 'General')}
Key findings from the data:
{data_insights}

Write a professional, premium executive summary with exactly 5 sections. Do not use generic filler; be specific, analytical, and highly actionable.

1. OVERVIEW — What the data shows overall about the health of the business (2 paragraphs).
2. TOP FINDINGS — 3 highly impactful positive findings or strengths (numbered list).
3. KEY RISKS & CONCERNS — 3 critical risks, anomalies, or areas of concern (numbered list).
4. EXECUTIVE RECOMMENDATIONS — 5 numbered, specific, actionable strategic recommendations.
5. OUTLOOK — Predictive statement on what to expect next quarter based on trends (1 paragraph).

Write in authoritative, professional business English. Focus on WHY trends happened and WHAT the business should do next."""

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
