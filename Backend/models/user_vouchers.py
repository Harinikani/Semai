from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class UserVoucher(Base):
    __tablename__ = "user_vouchers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    voucher_id = Column(String, ForeignKey("vouchers.id"), nullable=False)
    redemption_code = Column(String, unique=True, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(Date, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="user_vouchers")
    voucher = relationship("Voucher", back_populates="user_vouchers")

# Pydantic Schemas
class UserVoucherBase(BaseModel):
    is_used: bool = False

class UserVoucherCreate(BaseModel):
    voucher_id: str

class UserVoucherResponse(BaseModel):
    id: str
    user_id: str
    voucher_id: str
    redemption_code: str
    redeemed_at: datetime
    expires_at: date
    is_used: bool
    used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# NEW: Response model with voucher details
class UserVoucherWithDetailsResponse(UserVoucherResponse):
    voucher_title: Optional[str] = None
    voucher_description: Optional[str] = None
    voucher_merchant_name: Optional[str] = None
    voucher_points_required: Optional[int] = None