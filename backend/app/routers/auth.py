from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import Book
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserRead
from app.utils.auth import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/guest", response_model=TokenResponse)
async def create_guest(db: AsyncSession = Depends(get_db)):
    user = User(display_name="Guest", is_guest=True)
    db.add(user)
    await db.flush()

    book = Book(user_id=user.id, title="My Unwritten Book")
    db.add(book)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
        book_id=book.id,
    )


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        display_name=data.display_name or data.email.split("@")[0],
        email=data.email,
        password_hash=hash_password(data.password),
        is_guest=False,
    )
    db.add(user)
    await db.flush()

    book = Book(user_id=user.id, title="My Unwritten Book")
    db.add(book)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
        book_id=book.id,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserCreate, db: AsyncSession = Depends(get_db)):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    book_result = await db.execute(select(Book).where(Book.user_id == user.id).limit(1))
    book = book_result.scalar_one_or_none()
    book_id = book.id if book else None

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserRead.model_validate(user),
        book_id=book_id,
    )


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)):
    return UserRead.model_validate(user)
