import json
import logging
import re
import uuid
from pathlib import Path

from fastapi import HTTPException

from app.config import settings
from app.schemas.ai import ConversationResponse, ProseGenerateResponse, SceneExtractResponse
from app.services.gemini_client import generate_image_bytes, generate_text
from app.utils.prompts import (
    CONVERSATION_AGENT_PROMPT,
    IMAGE_PROMPT_TEMPLATE,
    PROSE_GENERATE_PROMPT,
    SCENE_EXTRACT_PROMPT,
)

logger = logging.getLogger(__name__)

FALLBACK_FOLLOWUP = "What is the one sound or smell you remember most clearly from that moment?"

MAX_CONVERSATION_QUESTIONS = 5

IMAGE_STYLES = {
    "ink_sketch": {
        "suffix": (
            "Black and white ink illustration, hand-drawn sketch, "
            "expressive linework, crosshatching shadows, cream background, "
            "editorial book illustration style, Quentin Blake meets Edward Gorey"
        ),
    },
    "watercolor": {
        "suffix": (
            "Loose watercolor illustration, muted earth tones, "
            "wet-on-wet technique, book illustration, painterly"
        ),
    },
    "pencil": {
        "suffix": (
            "Pencil sketch illustration, soft graphite shading, "
            "detailed crosshatching, vintage book illustration"
        ),
    },
}


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _pick_field(data: dict, *keys: str) -> str | None:
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return None


def _normalize_scene_data(data: dict) -> dict:
    sensory = _pick_field(data, "sensory") or ""
    if isinstance(sensory, dict):
        parts = []
        for key, value in sensory.items():
            if isinstance(value, list):
                parts.append(f"{key}: {', '.join(str(v) for v in value)}")
            elif value:
                parts.append(f"{key}: {value}")
        sensory = "; ".join(parts) if parts else ""
    elif sensory is None:
        sensory = ""

    followup = _pick_field(data, "followup_question", "followUpQuestion", "followupQuestion") or ""

    return {
        "setting": str(_pick_field(data, "setting") or ""),
        "people": str(_pick_field(data, "people") or ""),
        "sensory": str(sensory),
        "emotion": str(_pick_field(data, "emotion") or ""),
        "followup_question": str(followup),
    }


def _fallback_scene(raw_input: str) -> SceneExtractResponse:
    return SceneExtractResponse(
        setting="A place from memory, at a particular time",
        people="Someone important to the narrator",
        sensory="Details waiting to be uncovered",
        emotion="A feeling held beneath the surface",
        followup_question=FALLBACK_FOLLOWUP,
    )


def _gemini_error_detail(exc: Exception) -> str:
    message = str(exc)
    if "429" in message or "RESOURCE_EXHAUSTED" in message:
        if "prepayment credits are depleted" in message.lower() or "credits are depleted" in message.lower():
            return "Gemini billing credits are depleted. Add credits in AI Studio, then try again."
        return "Gemini rate limit reached. Wait about a minute, then tap Try again."
    if "503" in message or "UNAVAILABLE" in message:
        return "Gemini is briefly unavailable. Wait a few seconds, then tap Try again."
    if "API_KEY_INVALID" in message or "API key not valid" in message:
        return "Gemini API key is invalid. Check GEMINI_API_KEY in your .env file."
    if "validation error" in message.lower():
        return "Gemini returned an unexpected format. Tap Try again."
    return "Could not reach Gemini right now. Please try again."


def _raise_gemini_error(exc: Exception) -> None:
    logger.warning("Gemini request failed: %s", exc)
    raise HTTPException(status_code=503, detail=_gemini_error_detail(exc)) from exc


def _fallback_prose(raw_input: str) -> ProseGenerateResponse:
    words = raw_input.split()[:80]
    prose = " ".join(words)
    if len(raw_input.split()) > 80:
        prose += "..."
    return ProseGenerateResponse(
        title="A Memory Unfolding",
        prose=prose,
        pull_quote=prose[:60] + ("..." if len(prose) > 60 else ""),
    )


def _format_conversation(history: list[dict]) -> str:
    if not history:
        return "(No follow-up questions answered yet)"
    lines = []
    for i, item in enumerate(history, start=1):
        q_type = item.get("question_type", "open")
        q_text = item.get("question_text", "")
        answer = item.get("answer", "")
        lines.append(f'Q{i} ({q_type}): "{q_text}" → "{answer}"')
    return "\n".join(lines)


def _serialize_conversation_history(history: list) -> str:
    serialized = []
    for item in history:
        if hasattr(item, "model_dump"):
            serialized.append(item.model_dump())
        elif isinstance(item, dict):
            serialized.append(item)
    return json.dumps(serialized, indent=2)


def _normalize_conversation_question(data: dict, *, next_id: str) -> dict:
    q_type = _pick_field(data, "question_type", "questionType") or "open"
    if q_type not in ("mcq", "open"):
        q_type = "open"

    question = {
        "question_id": _pick_field(data, "question_id", "questionId") or next_id,
        "question_type": q_type,
        "question_text": str(_pick_field(data, "question_text", "questionText") or ""),
    }

    options = data.get("options")
    if q_type == "mcq" and isinstance(options, list) and len(options) >= 3:
        question["options"] = [str(o) for o in options[:4]]
    elif q_type == "mcq":
        question["question_type"] = "open"
        question.pop("options", None)

    return question


def _fallback_conversation_ready(history: list, scene_data: dict) -> ConversationResponse:
    parts = [scene_data.get("setting", ""), scene_data.get("sensory", ""), scene_data.get("emotion", "")]
    for item in history:
        if isinstance(item, dict) and item.get("answer"):
            parts.append(str(item["answer"]))
        elif hasattr(item, "answer") and item.answer:
            parts.append(str(item.answer))
    summary = ". ".join(p for p in parts if p) or "A personal memory ready to be written."
    score = min(0.5 + len(history) * 0.1, 0.9)
    return ConversationResponse(status="ready", enrichment_score=score, summary=summary)


def _fallback_conversation_asking(scene_data: dict, history: list) -> ConversationResponse:
    followup = scene_data.get("followup_question") or FALLBACK_FOLLOWUP
    next_num = len(history) + 1
    remaining = max(0, MAX_CONVERSATION_QUESTIONS - len(history))
    return ConversationResponse(
        status="asking",
        question={
            "question_id": f"q{next_num}",
            "question_type": "open",
            "question_text": followup,
        },
        questions_remaining=remaining,
        enrichment_score=min(len(history) * 0.15, 0.5),
    )


def _build_ready_response(data: dict, history: list, scene_data: dict) -> ConversationResponse:
    score = data.get("enrichment_score", 0.85)
    if not isinstance(score, (int, float)):
        score = 0.85
    score = max(0.0, min(1.0, float(score)))
    summary = str(data.get("summary") or _fallback_conversation_ready(history, scene_data).summary)
    return ConversationResponse(status="ready", enrichment_score=score, summary=summary)


async def run_conversation_step(
    raw_input: str,
    language: str,
    scene_data: dict,
    conversation_history: list,
) -> ConversationResponse:
    history_len = len(conversation_history)
    remaining = max(0, MAX_CONVERSATION_QUESTIONS - history_len)

    if history_len >= MAX_CONVERSATION_QUESTIONS:
        return _fallback_conversation_ready(conversation_history, scene_data)

    if not settings.gemini_api_key:
        if history_len == 0:
            return _fallback_conversation_asking(scene_data, conversation_history)
        return _fallback_conversation_ready(conversation_history, scene_data)

    next_number = history_len + 1
    prompt = CONVERSATION_AGENT_PROMPT.format(
        raw_input=raw_input,
        scene_json=json.dumps(scene_data),
        conversation_history=_serialize_conversation_history(conversation_history),
        next_number=next_number,
        remaining=remaining,
    )

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            text = await generate_text(prompt, json_mode=True)
            data = _parse_json(text)
            status = data.get("status", "asking")

            if status == "ready":
                return _build_ready_response(data, conversation_history, scene_data)

            question_data = data.get("question") or {}
            question = _normalize_conversation_question(
                question_data,
                next_id=f"q{next_number}",
            )

            if not question["question_text"]:
                if history_len == 0:
                    return _fallback_conversation_asking(scene_data, conversation_history)
                return _fallback_conversation_ready(conversation_history, scene_data)

            if history_len > 0:
                last_item = conversation_history[-1]
                last_type = (
                    last_item.get("question_type")
                    if isinstance(last_item, dict)
                    else getattr(last_item, "question_type", None)
                )
                if last_type == question["question_type"]:
                    question["question_type"] = "open" if last_type == "mcq" else "mcq"
                    if question["question_type"] == "open":
                        question.pop("options", None)

            score = data.get("enrichment_score", 0.3)
            if not isinstance(score, (int, float)):
                score = 0.3
            score = max(0.0, min(1.0, float(score)))

            return ConversationResponse(
                status="asking",
                question=question,
                questions_remaining=remaining,
                enrichment_score=score,
            )
        except HTTPException:
            raise
        except Exception as exc:
            last_exc = exc
            logger.warning("run_conversation_step attempt %s failed: %s", attempt + 1, exc)

    if last_exc:
        _raise_gemini_error(last_exc)

    if history_len == 0:
        return _fallback_conversation_asking(scene_data, conversation_history)
    return _fallback_conversation_ready(conversation_history, scene_data)


async def extract_scene(raw_input: str, language: str = "en") -> SceneExtractResponse:
    if not settings.gemini_api_key:
        return _fallback_scene(raw_input)

    prompt = SCENE_EXTRACT_PROMPT.format(raw_input=raw_input, language=language)
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            text = await generate_text(prompt, json_mode=True)
            data = _normalize_scene_data(_parse_json(text))
            if not data["followup_question"]:
                data["followup_question"] = (
                    "What is one small detail — a sound, smell, or sight — "
                    "that makes this memory vivid?"
                )
            return SceneExtractResponse(**data)
        except HTTPException:
            raise
        except Exception as exc:
            last_exc = exc
            logger.warning("extract_scene attempt %s failed: %s", attempt + 1, exc)
    if last_exc:
        _raise_gemini_error(last_exc)
    return _fallback_scene(raw_input)


async def generate_prose(
    raw_input: str,
    scene_data: dict,
    conversation_history: list | None = None,
    enrichment_summary: str | None = None,
    language: str = "en",
) -> ProseGenerateResponse:
    if not settings.gemini_api_key:
        return _fallback_prose(raw_input)

    history = conversation_history or []
    formatted = _format_conversation(
        [h if isinstance(h, dict) else h.model_dump() for h in history]
    )

    prompt = PROSE_GENERATE_PROMPT.format(
        raw_input=raw_input,
        scene_json=json.dumps(scene_data),
        enrichment_summary=enrichment_summary or "",
        formatted_conversation=formatted,
        language=language,
    )
    try:
        text = await generate_text(prompt, json_mode=True)
        data = _parse_json(text)
        if "pull_quote" not in data and "pullQuote" in data:
            data["pull_quote"] = data.pop("pullQuote")
        return ProseGenerateResponse(**data)
    except HTTPException:
        raise
    except Exception as exc:
        _raise_gemini_error(exc)


async def generate_image_prompt(scene_data: dict) -> str:
    if not settings.gemini_api_key:
        return f"Ink sketch of a memory scene: {scene_data.get('setting', 'a quiet moment')}"

    prompt = IMAGE_PROMPT_TEMPLATE.format(scene_json=json.dumps(scene_data))
    try:
        return (await generate_text(prompt)).strip()
    except Exception:
        return f"Ink sketch of a memory scene: {scene_data.get('setting', 'a quiet moment')}"


async def generate_image(prompt: str, style: str = "ink_sketch") -> tuple[str, str]:
    style_config = IMAGE_STYLES.get(style, IMAGE_STYLES["ink_sketch"])
    full_prompt = f"{prompt}. {style_config['suffix']}"

    media_path = Path(settings.media_dir)
    media_path.mkdir(parents=True, exist_ok=True)

    if settings.gemini_api_key:
        try:
            image_bytes = await generate_image_bytes(full_prompt)
            filename = f"{uuid.uuid4()}.png"
            filepath = media_path / filename
            filepath.write_bytes(image_bytes)
            return f"/media/{filename}", full_prompt
        except Exception:
            pass

    filename = f"placeholder-{uuid.uuid4()}.svg"
    filepath = media_path / filename
    filepath.write_text(_placeholder_svg())
    return f"/media/{filename}", full_prompt


def _placeholder_svg() -> str:
    return """<svg xmlns="http://www.w3.org/2000/svg" width="400" height="350" viewBox="0 0 400 350">
  <rect fill="#F5F0E8" width="400" height="350"/>
  <path d="M40 280 Q120 200 200 240 T360 200" stroke="#2C2416" stroke-width="2" fill="none"/>
  <circle cx="280" cy="100" r="40" stroke="#2C2416" stroke-width="1.5" fill="none"/>
  <path d="M60 180 L140 120 L180 200 Z" stroke="#6B5D4F" stroke-width="1" fill="none"/>
  <text x="200" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#9B8B7A">ink sketch</text>
</svg>"""
