import asyncio
import base64
import time
from functools import lru_cache

from google import genai
from google.genai import types
from google.genai.errors import ClientError

from app.config import settings


@lru_cache
def get_gemini_client() -> genai.Client | None:
    if not settings.gemini_api_key:
        return None
    return genai.Client(api_key=settings.gemini_api_key)


def _generate_text_sync(prompt: str, *, json_mode: bool = False) -> str:
    client = get_gemini_client()
    if not client:
        raise RuntimeError("Gemini API key not configured")

    config_kwargs: dict = {
        "temperature": 0.7,
        "max_output_tokens": 2048,
    }
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"

    last_error: Exception | None = None
    for attempt in range(4):
        try:
            response = client.models.generate_content(
                model=settings.gemini_text_model,
                contents=prompt,
                config=types.GenerateContentConfig(**config_kwargs),
            )
            text = response.text
            if not text:
                raise RuntimeError("Empty response from Gemini")
            return text.strip()
        except ClientError as exc:
            last_error = exc
            if exc.status_code in (429, 503) and attempt < 3:
                time.sleep(3 + attempt * 4)
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("Gemini request failed")


def _generate_image_sync(prompt: str) -> bytes:
    client = get_gemini_client()
    if not client:
        raise RuntimeError("Gemini API key not configured")

    last_error: Exception | None = None
    for attempt in range(3):
        try:
            try:
                interaction = client.interactions.create(
                    model=settings.gemini_image_model,
                    input=prompt,
                )
                if interaction.output_image and interaction.output_image.data:
                    return base64.b64decode(interaction.output_image.data)
            except ClientError as exc:
                if exc.status_code != 429:
                    raise
                last_error = exc
            except Exception:
                pass

            response = client.models.generate_content(
                model=settings.gemini_image_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )

            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.data:
                        data = part.inline_data.data
                        if isinstance(data, str):
                            return base64.b64decode(data)
                        return data

            raise RuntimeError("No image returned from Gemini")
        except ClientError as exc:
            last_error = exc
            if exc.status_code == 429 and attempt < 2:
                time.sleep(12 + attempt * 6)
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("Gemini image request failed")


async def generate_text(prompt: str, *, json_mode: bool = False) -> str:
    return await asyncio.to_thread(_generate_text_sync, prompt, json_mode=json_mode)


async def generate_image_bytes(prompt: str) -> bytes:
    return await asyncio.to_thread(_generate_image_sync, prompt)
