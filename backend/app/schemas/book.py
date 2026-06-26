from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    title: str = "My Unwritten Book"
    description: Optional[str] = None
    cover_style: Literal["classic", "modern", "minimal"] = "classic"
    is_private: bool = True


class BookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_style: Optional[Literal["classic", "modern", "minimal"]] = None
    is_private: Optional[bool] = None


class ChapterSummary(BaseModel):
    id: str
    number: int
    title: Optional[str] = None
    is_sealed: bool
    is_draft: bool
    date: datetime
    preview_text: str = ""

    model_config = {"from_attributes": True}


class BookRead(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    cover_style: str
    is_private: bool
    chapters: list[ChapterSummary] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class BookListItem(BaseModel):
    id: str
    title: str
    cover_style: str
    is_private: bool
    chapter_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
