import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id: Mapped[str] = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"))
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_input: Mapped[str] = mapped_column(Text, nullable=False)
    input_method: Mapped[str] = mapped_column(String(10), default="text")
    language: Mapped[str] = mapped_column(String(10), default="en")
    followup_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    followup_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    scene_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    prose: Mapped[str | None] = mapped_column(Text, nullable=True)
    pull_quote: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_sealed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    book: Mapped["Book"] = relationship("Book", back_populates="chapters")
    images: Mapped[list["ChapterImage"]] = relationship(
        "ChapterImage", back_populates="chapter", cascade="all, delete-orphan"
    )


from app.models.book import Book  # noqa: E402
from app.models.media import ChapterImage  # noqa: E402
