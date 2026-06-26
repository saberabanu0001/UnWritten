from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserBase(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str
    is_guest: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    book_id: Optional[str] = None
