from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.chapter import Chapter
from app.models.user import User
from app.schemas.ai import (
    ImageGenerateRequest,
    ImageGenerateResponse,
    ProseGenerateRequest,
    ProseGenerateResponse,
    SceneExtractRequest,
    SceneExtractResponse,
)
from app.schemas.chapter import ChapterUpdate
from app.services import ai_service, book_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/extract-scene", response_model=SceneExtractResponse)
async def extract_scene(
    data: SceneExtractRequest,
    user: User = Depends(get_current_user),
):
    return await ai_service.extract_scene(data.raw_input, data.language)


@router.post("/generate-prose", response_model=ProseGenerateResponse)
async def generate_prose(
    data: ProseGenerateRequest,
    user: User = Depends(get_current_user),
):
    return await ai_service.generate_prose(
        data.raw_input, data.scene_data, data.followup_answer, data.language
    )


@router.post("/generate-image", response_model=ImageGenerateResponse)
async def generate_image(
    data: ImageGenerateRequest,
    user: User = Depends(get_current_user),
):
    prompt = await ai_service.generate_image_prompt(data.scene_data)
    image_url, full_prompt = await ai_service.generate_image(prompt, data.style)
    return ImageGenerateResponse(image_url=image_url, image_prompt=full_prompt)


@router.post("/rewrite/{chapter_id}", response_model=ProseGenerateResponse)
async def rewrite_chapter(
    chapter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chapter).where(Chapter.id == chapter_id).options(selectinload(Chapter.images))
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Chapter not found")

    scene_data = chapter.scene_data or {}
    prose_result = await ai_service.generate_prose(
        chapter.raw_input,
        scene_data,
        chapter.followup_answer,
        chapter.language,
    )

    await book_service.update_chapter(
        db,
        user,
        chapter_id,
        ChapterUpdate(
            title=prose_result.title,
            prose=prose_result.prose,
            pull_quote=prose_result.pull_quote,
        ),
    )
    return prose_result
