from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services import pdf_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/{book_id}/pdf")
async def export_book_pdf(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await pdf_service.generate_book_pdf(db, user, book_id)
    if content[:5] == b"<!DOC" or content[:5] == b"<html":
        return Response(content=content, media_type="text/html")
    return StreamingResponse(
        iter([content]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="unwritten-book.pdf"'},
    )


@router.get("/chapter/{chapter_id}/page")
async def export_chapter_pdf(
    chapter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await pdf_service.generate_chapter_pdf(db, user, chapter_id)
    if content[:5] == b"<!DOC" or content[:5] == b"<html":
        return Response(content=content, media_type="text/html")
    return StreamingResponse(
        iter([content]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="unwritten-chapter.pdf"'},
    )
