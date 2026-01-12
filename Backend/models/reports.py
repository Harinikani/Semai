from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    scanned_species_id = Column(String, ForeignKey("scanned_species.id"), nullable=False)
    image_url = Column(String)
    species = Column(String, nullable=False)
    location = Column(String, nullable=False)
    endangered_status = Column(String, nullable=False)
    remarks = Column(String)
    status = Column(String, default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reports")
    scanned_species = relationship("ScannedSpecies", back_populates="reports")

# Pydantic Schemas
class ReportBase(BaseModel):
    image_url: Optional[str] = None
    species: str
    location: str
    endangered_status: str
    remarks: Optional[str] = None
    status: str = 'pending'

class ReportCreate(ReportBase):
    scanned_species_id: str

class ReportResponse(ReportBase):
    id: str
    user_id: str
    scanned_species_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)