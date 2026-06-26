from typing import Optional

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


class ProseGenerateRequest(BaseModel):
    raw_input: str
    scene_data: dict
    followup_answer: Optional[str] = None
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
