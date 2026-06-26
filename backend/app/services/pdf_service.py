from datetime import datetime
from io import BytesIO
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from xhtml2pdf import pisa

from app.models.chapter import Chapter
from app.models.user import User
from app.services.book_service import _get_user_book
from app.utils.roman import to_roman

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=select_autoescape(["html"]))


def _html_to_pdf(html: str) -> bytes:
    buffer = BytesIO()
    result = pisa.CreatePDF(html, dest=buffer)
    if result.err:
        return html.encode("utf-8")
    return buffer.getvalue()


async def generate_book_pdf(db: AsyncSession, user: User, book_id: str) -> bytes:
    book = await _get_user_book(db, book_id, user.id)
    result = await db.execute(
        select(Chapter)
        .where(Chapter.book_id == book_id, Chapter.is_draft == False)
        .options(selectinload(Chapter.images))
        .order_by(Chapter.sort_order, Chapter.chapter_number)
    )
    chapters = result.scalars().all()

    chapter_data = []
    for ch in chapters:
        if ch.is_sealed:
            continue
        image_url = ch.images[0].image_url if ch.images else None
        paragraphs = (ch.prose or "").split("\n\n") if ch.prose else []
        chapter_data.append({
            "number_roman": to_roman(ch.chapter_number),
            "title": ch.title or "Untitled",
            "paragraphs": paragraphs,
            "pull_quote": ch.pull_quote,
            "image_url": image_url,
        })

    html = env.get_template("book_pdf.html").render(
        book_title=book.title,
        date_range=book.created_at.strftime("%B %Y"),
        chapters=chapter_data,
        generated_at=datetime.now().strftime("%B %d, %Y"),
    )
    return _html_to_pdf(html)


async def generate_chapter_pdf(db: AsyncSession, user: User, chapter_id: str) -> bytes:
    result = await db.execute(
        select(Chapter).where(Chapter.id == chapter_id).options(selectinload(Chapter.images))
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Chapter not found")
    book = await _get_user_book(db, chapter.book_id, user.id)
    image_url = chapter.images[0].image_url if chapter.images else None
    paragraphs = (chapter.prose or "").split("\n\n") if chapter.prose else []

    html = env.get_template("book_pdf.html").render(
        book_title=book.title,
        date_range=book.created_at.strftime("%B %Y"),
        chapters=[{
            "number_roman": to_roman(chapter.chapter_number),
            "title": chapter.title or "Untitled",
            "paragraphs": paragraphs,
            "pull_quote": chapter.pull_quote,
            "image_url": image_url,
        }],
        generated_at=datetime.now().strftime("%B %d, %Y"),
    )
    return _html_to_pdf(html)
