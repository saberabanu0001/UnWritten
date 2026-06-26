from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    raw_input: str
    input_method: Literal["text", "voice"] = "text"
    language: str = "en"
    followup_question: Optional[str] = None
    followup_answer: Optional[str] = None
    scene_data: Optional[dict] = None
    title: Optional[str] = None
    prose: Optional[str] = None
    pull_quote: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    is_draft: bool = False


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    prose: Optional[str] = None
    pull_quote: Optional[str] = None
    followup_answer: Optional[str] = None
    scene_data: Optional[dict] = None
    image_prompt: Optional[str] = None
    is_sealed: Optional[bool] = None
    is_draft: Optional[bool] = None
    sort_order: Optional[int] = None


class ChapterRead(BaseModel):
    id: str
    book_id: str
    number: int
    title: Optional[str] = None
    raw_input: str
    input_method: str
    language: str
    followup_question: Optional[str] = None
    followup_answer: Optional[str] = None
    scene_data: Optional[dict] = None
    prose: Optional[str] = None
    pull_quote: Optional[str] = None
    image_url: Optional[str] = None
    is_sealed: bool
    is_draft: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChapterReorder(BaseModel):
    sort_order: int
