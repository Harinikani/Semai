from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    points_required = Column(Integer, nullable=False)
    expiry_date = Column(Date, nullable=False)
    merchant_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user_vouchers = relationship("UserVoucher", back_populates="voucher")

# Pydantic Schemas
class VoucherBase(BaseModel):
    title: str
    description: Optional[str] = None
    points_required: int
    expiry_date: date
    merchant_name: str
    is_active: bool = True

class VoucherCreate(VoucherBase):
    pass

class VoucherResponse(VoucherBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)