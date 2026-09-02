import json
import logging
import os

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Try to initialize the client. It will automatically pick up GEMINI_API_KEY from os.environ
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment")
    client = genai.Client(api_key=api_key)
except Exception as e:
    logger.warning(f"Failed to initialize genai client: {e}")
    client = None


def generate_structured_report(
    prompt: str, schema: dict, model_name: str = "gemini-3.5-flash",
) -> dict:
    """Generates a structured JSON response from Gemini using Structured Outputs.

    Args:
        prompt (str): The prompt containing the dataset and instructions.
        schema (dict): The JSON schema definition for the desired output structure.
        model_name (str): The Gemini model to use.

    Returns:
        dict: The parsed JSON response.

    """
    if not client:
        raise ValueError("Gemini client is not initialized. Check GEMINI_API_KEY.")

    response = client.models.generate_content(
        model=model_name,
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
        text = text[start_idx : end_idx + 1]

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response from Gemini: {response.text}")
        # Try a more forgiving approach if it's truncated at the end
        try:
            # Very basic attempt to close unclosed JSON object (often happens with truncation)
            if not text.endswith("}"):
                text = text + '"}]}'  # Try to close typical report structure
            return json.loads(text)
        except Exception:
            raise e
