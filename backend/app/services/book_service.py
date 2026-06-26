import json
import re
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.book import Book
from app.models.chapter import Chapter
from app.models.media import ChapterImage
from app.models.user import User
from app.schemas.book import BookCreate, BookListItem, BookRead, BookUpdate, ChapterSummary
from app.schemas.chapter import ChapterCreate, ChapterRead, ChapterReorder, ChapterUpdate


def _chapter_preview(chapter: Chapter) -> str:
    text = chapter.prose or chapter.raw_input or ""
    return text[:80] + ("..." if len(text) > 80 else "")


def _chapter_to_read(chapter: Chapter, *, image_url: str | None = None) -> ChapterRead:
    resolved_image_url = image_url
    if resolved_image_url is None and chapter.images:
        resolved_image_url = chapter.images[0].image_url
    return ChapterRead(
        id=chapter.id,
        book_id=chapter.book_id,
        number=chapter.chapter_number,
        title=chapter.title,
        raw_input=chapter.raw_input,
        input_method=chapter.input_method,
        language=chapter.language,
        followup_question=chapter.followup_question,
        followup_answer=chapter.followup_answer,
        scene_data=chapter.scene_data,
        prose=chapter.prose,
        pull_quote=chapter.pull_quote,
        image_url=resolved_image_url,
        is_sealed=chapter.is_sealed,
        is_draft=chapter.is_draft,
        created_at=chapter.created_at,
    )


async def _get_user_book(db: AsyncSession, book_id: str, user_id: str) -> Book:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user_id))
    book = result.scalar_one_or_none()
    if not book:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Book not found")
    return book


async def list_books(db: AsyncSession, user: User) -> list[BookListItem]:
    result = await db.execute(select(Book).where(Book.user_id == user.id).order_by(Book.created_at))
    books = result.scalars().all()
    items = []
    for book in books:
        ch_result = await db.execute(select(Chapter).where(Chapter.book_id == book.id))
        count = len(ch_result.scalars().all())
        items.append(
            BookListItem(
                id=book.id,
                title=book.title,
                cover_style=book.cover_style,
                is_private=book.is_private,
                chapter_count=count,
                created_at=book.created_at,
            )
        )
    return items


async def create_book(db: AsyncSession, user: User, data: BookCreate) -> Book:
    book = Book(user_id=user.id, **data.model_dump())
    db.add(book)
    await db.flush()
    return book


async def get_book(db: AsyncSession, user: User, book_id: str) -> BookRead:
    book = await _get_user_book(db, book_id, user.id)
    result = await db.execute(
        select(Chapter).where(Chapter.book_id == book.id).order_by(Chapter.sort_order, Chapter.chapter_number)
    )
    chapters = result.scalars().all()
    summaries = [
        ChapterSummary(
            id=ch.id,
            number=ch.chapter_number,
            title=ch.title or ("Sealed" if ch.is_sealed else "Untitled"),
            is_sealed=ch.is_sealed,
            is_draft=ch.is_draft,
            date=ch.created_at,
            preview_text="🔒 Private" if ch.is_sealed else _chapter_preview(ch),
        )
        for ch in chapters
    ]
    return BookRead(
        id=book.id,
        title=book.title,
        description=book.description,
        cover_style=book.cover_style,
        is_private=book.is_private,
        chapters=summaries,
        created_at=book.created_at,
    )


async def update_book(db: AsyncSession, user: User, book_id: str, data: BookUpdate) -> BookRead:
    book = await _get_user_book(db, book_id, user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(book, key, value)
    await db.flush()
    return await get_book(db, user, book_id)


async def delete_book(db: AsyncSession, user: User, book_id: str) -> None:
    book = await _get_user_book(db, book_id, user.id)
    await db.delete(book)


async def list_chapters(db: AsyncSession, user: User, book_id: str) -> list[ChapterRead]:
    await _get_user_book(db, book_id, user.id)
    result = await db.execute(
        select(Chapter)
        .options(selectinload(Chapter.images))
        .where(Chapter.book_id == book_id)
        .order_by(Chapter.sort_order, Chapter.chapter_number)
    )
    return [_chapter_to_read(ch) for ch in result.scalars().all()]


async def create_chapter(db: AsyncSession, user: User, book_id: str, data: ChapterCreate) -> ChapterRead:
    await _get_user_book(db, book_id, user.id)
    count_result = await db.execute(select(Chapter).where(Chapter.book_id == book_id))
    existing = count_result.scalars().all()
    next_num = len(existing) + 1

    chapter = Chapter(
        book_id=book_id,
        chapter_number=next_num,
        sort_order=next_num,
        raw_input=data.raw_input,
        input_method=data.input_method,
        language=data.language,
        followup_question=data.followup_question,
        followup_answer=data.followup_answer,
        scene_data=data.scene_data,
        title=data.title,
        prose=data.prose,
        pull_quote=data.pull_quote,
        image_prompt=data.image_prompt,
        is_draft=data.is_draft,
    )
    db.add(chapter)
    await db.flush()

    if data.image_url:
        db.add(ChapterImage(chapter_id=chapter.id, image_url=data.image_url))

    await db.flush()
    await db.refresh(chapter)
    return _chapter_to_read(chapter, image_url=data.image_url)


async def get_chapter(db: AsyncSession, user: User, chapter_id: str) -> ChapterRead:
    result = await db.execute(
        select(Chapter).options(selectinload(Chapter.images)).where(Chapter.id == chapter_id)
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Chapter not found")
    await _get_user_book(db, chapter.book_id, user.id)
    return _chapter_to_read(chapter)


async def update_chapter(db: AsyncSession, user: User, chapter_id: str, data: ChapterUpdate) -> ChapterRead:
    result = await db.execute(
        select(Chapter).options(selectinload(Chapter.images)).where(Chapter.id == chapter_id)
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Chapter not found")
    await _get_user_book(db, chapter.book_id, user.id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(chapter, key, value)
    await db.flush()
    return await get_chapter(db, user, chapter_id)


async def delete_chapter(db: AsyncSession, user: User, chapter_id: str) -> None:
    result = await db.execute(
        select(Chapter).options(selectinload(Chapter.images)).where(Chapter.id == chapter_id)
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Chapter not found")
    book_id = chapter.book_id
    await _get_user_book(db, book_id, user.id)
    await db.delete(chapter)
    await db.flush()

    remaining = await db.execute(
        select(Chapter).where(Chapter.book_id == book_id).order_by(Chapter.sort_order)
    )
    for i, ch in enumerate(remaining.scalars().all(), start=1):
        ch.chapter_number = i
        ch.sort_order = i


async def reorder_chapter(db: AsyncSession, user: User, chapter_id: str, data: ChapterReorder) -> ChapterRead:
    return await update_chapter(db, user, chapter_id, ChapterUpdate(sort_order=data.sort_order))
