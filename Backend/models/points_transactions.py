from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class PointsTransaction(Base):
    __tablename__ = "points_transactions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String, nullable=False)
    points = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    reference_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="points_transactions")

# Pydantic Schemas
class PointsTransactionBase(BaseModel):
    transaction_type: str
    points: int
    description: str
    reference_id: Optional[str] = None

class PointsTransactionCreate(PointsTransactionBase):
    user_id: str

class PointsTransactionResponse(PointsTransactionBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)