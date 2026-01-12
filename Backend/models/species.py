from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# SQLAlchemy Model
class Species(Base):
    __tablename__ = "species"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    animal_class_id = Column(String, ForeignKey("animal_class.id"), nullable=False)
    common_name = Column(Text, nullable=False)
    scientific_name = Column(Text, unique=True, nullable=False)
    description = Column(Text)
    habitat = Column(Text)
    threats = Column(Text)
    conservation = Column(Text)
    endangered_status = Column(String)
    api_response = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    animal_class = relationship("AnimalClass", back_populates="species")

# Pydantic Schemas
class SpeciesBase(BaseModel):
    common_name: str
    scientific_name: str
    description: Optional[str] = None
    habitat: Optional[str] = None
    threats: Optional[str] = None
    conservation: Optional[str] = None
    endangered_status: Optional[str] = None
    api_response: Optional[Dict[str, Any]] = None

class SpeciesCreate(SpeciesBase):
    animal_class_id: str

class SpeciesResponse(SpeciesBase):
    id: str
    animal_class_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)