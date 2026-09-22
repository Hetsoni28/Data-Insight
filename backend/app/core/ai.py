import json
import logging
import os

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

_FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]

# Try to initialize the client. It will automatically pick up GEMINI_API_KEY from os.environ
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment")
    client = genai.Client(api_key=api_key)
except Exception as e:
    logger.warning(f"Failed to initialize genai client: {e}")
    client = None


def _is_retriable(err_str: str) -> bool:
    lower = err_str.lower()
    return (
        "503" in err_str
        or "404" in err_str
        or "not_found" in lower
        or "no longer available" in lower
        or "unavailable" in lower
        or "quota" in lower
        or "429" in err_str
        or "resource_exhausted" in lower
    )


def generate_structured_report(
    prompt: str, schema: dict, model_name: str = "gemini-3.6-flash",
) -> dict:
    """Generates a structured JSON response from Gemini using Structured Outputs.
    Tries model_name first, then falls back through _FALLBACK_MODELS on 404/503.

    Args:
        prompt (str): The prompt containing the dataset and instructions.
        schema (dict): The JSON schema definition for the desired output structure.
        model_name (str): The Gemini model to use (primary attempt).

    Returns:
        dict: The parsed JSON response.

    """
    if not client:
        raise ValueError("Gemini client is not initialized. Check GEMINI_API_KEY.")

    models_to_try = [model_name] + [m for m in _FALLBACK_MODELS if m != model_name]
    last_exc = None

    for model in models_to_try:
        try:
            logger.info(f"[generate_structured_report] Trying model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.2,
                    max_output_tokens=8192,
                ),
            )

            text = response.text.strip()

            # Robustly extract the JSON object
            start_idx = text.find("{")
            end_idx = text.rfind("}")
            if start_idx != -1 and end_idx != -1:
                text = text[start_idx: end_idx + 1]

            try:
                return json.loads(text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from {model}: {response.text[:200]}")
                try:
                    if not text.endswith("}"):
                        text = text + '"}]}'
                    return json.loads(text)
                except Exception:
                    raise e

        except Exception as exc:
            err_str = str(exc)
            logger.warning(f"[generate_structured_report] {model} failed: {err_str[:120]}")
            last_exc = exc
            if _is_retriable(err_str):
                continue  # try next model
            raise  # non-retriable — propagate immediately

    raise last_exc

