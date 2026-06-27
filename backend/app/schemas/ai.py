from typing import Literal, Optional

from pydantic import BaseModel


class SceneExtractRequest(BaseModel):
    raw_input: str
    language: str = "en"


class SceneExtractResponse(BaseModel):
    setting: str
    people: str
    sensory: str
    emotion: str
    followup_question: str


class ConversationQuestion(BaseModel):
    question_id: str
    question_type: Literal["mcq", "open"]
    question_text: str
    options: Optional[list[str]] = None
    answer: Optional[str] = None


class ConversationRequest(BaseModel):
    raw_input: str
    language: str = "en"
    scene_data: dict
    conversation_history: list[ConversationQuestion] = []


class ConversationResponse(BaseModel):
    status: Literal["asking", "ready"]
    question: Optional[ConversationQuestion] = None
    questions_remaining: Optional[int] = None
    enrichment_score: Optional[float] = None
    summary: Optional[str] = None


class ProseGenerateRequest(BaseModel):
    raw_input: str
    scene_data: dict
    conversation_history: list[dict] = []
    enrichment_summary: Optional[str] = None
    language: str = "en"


class ProseGenerateResponse(BaseModel):
    title: str
    prose: str
    pull_quote: str


class ImageGenerateRequest(BaseModel):
    scene_data: dict
    style: str = "ink_sketch"


class ImageGenerateResponse(BaseModel):
    image_url: str
    image_prompt: str
