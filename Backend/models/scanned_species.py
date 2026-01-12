from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class ScannedSpecies(Base):
    __tablename__ = "scanned_species"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    species_id = Column(String, ForeignKey("species.id"))
    location = Column(String, nullable=False)
    image_url = Column(String)
    date_spotted = Column(DateTime(timezone=True), server_default=func.now())
    verified = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="scanned_species")
    species = relationship("Species", back_populates="scanned_species")

# Pydantic Schemas
class ScannedSpeciesBase(BaseModel):
    location: str
    image_url: Optional[str] = None
    verified: bool = False

class ScannedSpeciesCreate(ScannedSpeciesBase):
    species_id: Optional[str] = None

class ScannedSpeciesResponse(ScannedSpeciesBase):
    id: str
    user_id: str
    species_id: Optional[str] = None
    date_spotted: datetime

    model_config = ConfigDict(from_attributes=True)