from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.book import BookCreate, BookListItem, BookRead, BookUpdate
from app.services import book_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[BookListItem])
async def list_books(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.list_books(db, user)


@router.post("", response_model=BookRead)
async def create_book(
    data: BookCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    book = await book_service.create_book(db, user, data)
    return await book_service.get_book(db, user, book.id)


@router.get("/{book_id}", response_model=BookRead)
async def get_book(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.get_book(db, user, book_id)


@router.patch("/{book_id}", response_model=BookRead)
async def update_book(
    book_id: str,
    data: BookUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await book_service.update_book(db, user, book_id, data)


@router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await book_service.delete_book(db, user, book_id)
