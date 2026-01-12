from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  
    first_name = Column(String, nullable=False)  
    last_name = Column(String, nullable=False)   
    phone_number = Column(String, nullable=True)
    birthday = Column(Date, nullable=True)
    points = Column(Integer, default=0)
    currency = Column(Integer, default=0)  # New column with default 0
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    profile_picture = Column(String, nullable=True)

# Pydantic Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    birthday: Optional[date] = None
    # Note: currency is removed from UserCreate since it defaults to 0

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    birthday: Optional[date] = None
    currency: Optional[int] = None  # Keep for updates if needed

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    birthday: Optional[date] = None
    points: int
    currency: int  
    profile_picture: Optional[str] = None 
    created_at: datetime
    updated_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class DeleteAccountResponse(BaseModel):
    message: str
    deleted_user_id: str