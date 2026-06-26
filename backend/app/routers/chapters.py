from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.chapter import ChapterCreate, ChapterRead, ChapterReorder, ChapterUpdate
from app.services import book_service
from app.utils.auth import get_current_user

router = APIRouter(tags=["chapters"])


@router.get("/books/{book_id}/chapters", response_model=list[ChapterRead])
async def list_chapters(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.list_chapters(db, user, book_id)


@router.post("/books/{book_id}/chapters", response_model=ChapterRead)
async def create_chapter(
    book_id: str,
    data: ChapterCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.create_chapter(db, user, book_id, data)


@router.get("/chapters/{chapter_id}", response_model=ChapterRead)
async def get_chapter(
    chapter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.get_chapter(db, user, chapter_id)


@router.patch("/chapters/{chapter_id}", response_model=ChapterRead)
async def update_chapter(
    chapter_id: str,
    data: ChapterUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.update_chapter(db, user, chapter_id, data)


@router.delete("/chapters/{chapter_id}", status_code=204)
async def delete_chapter(
    chapter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await book_service.delete_chapter(db, user, chapter_id)


@router.patch("/chapters/{chapter_id}/reorder", response_model=ChapterRead)
async def reorder_chapter(
    chapter_id: str,
    data: ChapterReorder,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.reorder_chapter(db, user, chapter_id, data)
