from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship  # ADD THIS
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class AnimalClass(Base):
    __tablename__ = "animal_class"

    # Allow custom IDs by making default optional
    id = Column(String, primary_key=True, index=True)
    class_name = Column(Text, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    species = relationship("Species", back_populates="animal_class")

    def __init__(self, id=None, **kwargs):
        if id is None:
            id = generate_uuid()
        super().__init__(id=id, **kwargs)

# Pydantic Schemas
class AnimalClassBase(BaseModel):
    class_name: str

class AnimalClassCreate(AnimalClassBase):
    pass

class AnimalClassResponse(AnimalClassBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)