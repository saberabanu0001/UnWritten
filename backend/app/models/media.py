import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChapterImage(Base):
    __tablename__ = "chapter_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chapter_id: Mapped[str] = mapped_column(String(36), ForeignKey("chapters.id", ondelete="CASCADE"))
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    style: Mapped[str] = mapped_column(String(50), default="ink_sketch")
    width: Mapped[int] = mapped_column(Integer, default=400)
    height: Mapped[int] = mapped_column(Integer, default=350)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    chapter: Mapped["Chapter"] = relationship("Chapter", back_populates="images")


from app.models.chapter import Chapter  # noqa: E402
