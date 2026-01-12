from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid
from models.user import UserResponse
from enum import Enum




def generate_uuid():
    return str(uuid.uuid4())


# SQLAlchemy Model
class Friendship(Base):
    __tablename__ = "friendships"


    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    friend_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True))
   
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="friendships_initiated")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friendships_received")


# Pydantic Schemas


class FriendshipStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# Base schema shared fields
class FriendshipBase(BaseModel):
    user_id: str
    friend_id: str
    status: FriendshipStatus = FriendshipStatus.pending




# Schema used to create a friendship / send request (function #4)
class FriendshipCreate(BaseModel):
    user_id: str
    friend_id: str
    status: FriendshipStatus = FriendshipStatus.pending


   


# Schema used to update a friendship (accept/reject) (function #3)
class FriendshipUpdate(BaseModel):
    # Allow updating the status only (accept/reject). It can be "accepted" or "rejected".
    status: FriendshipStatus
    # accepted_at can be set by the server when status becomes accepted.
    accepted_at: Optional[datetime] = None




# Response schema when returning friendship records (functions #1 and #2)
# If you want nested user info, replace Optional[dict] with Optional[UserResponse]
class FriendshipResponse(BaseModel):
    id: str
    user_id: str
    friend_id: str
    status: FriendshipStatus
    created_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None


    # Optional nested user objects for convenience when viewing requests or friends.
    # If you already have UserResponse defined (in your snippet above), import and use that:
    # user: Optional[UserResponse] = None
    # friend: Optional[UserResponse] = None
    user: Optional[dict] = None
    friend: Optional[dict] = None


   


# Convenience schemas for lists or specific use-cases:


# When returning multiple friendships (e.g., "view all requests for a user")
class FriendshipListResponse(BaseModel):
    friendships: list[FriendshipResponse]
    total: int


   


# When returning only "friends" (accepted)
class FriendSummary(BaseModel):
    friend_id: str
    # Optionally include friend user details
    friend: Optional[dict] = None
    accepted_at: Optional[datetime] = None