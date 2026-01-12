from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime


from database import get_db
from models.friendships import Friendship
from models.user import User
# Adjust these imports to point to the actual location of your Pydantic schemas
from models.friendships import (
    FriendshipCreate as FriendshipCreateSchema,
    FriendshipResponse as FriendshipResponseSchema,
    FriendshipListResponse as FriendshipListResponseSchema,
    FriendshipUpdate as FriendshipUpdateSchema,
    FriendSummary as FriendSummarySchema,
)
from models.user import UserResponse as UserResponseSchema


router = APIRouter(prefix="/friendships", tags=["friendships"])








# ---------------------------
# Helpers
# ---------------------------
def friendship_to_response(f: Friendship, include_users: bool = False) -> dict:
    """
    Convert Friendship SQLAlchemy instance to dict compatible with FriendshipResponseSchema.
    If include_users=True, include minimal info for user and friend.
    """
    data = {
        "id": f.id,
        "user_id": f.user_id,
        "friend_id": f.friend_id,
        "status": f.status,
        "created_at": f.created_at,
        "accepted_at": f.accepted_at,
    }


    if include_users:
        # Lazy access to related objects (requires they are available/queried)
        data["user"] = (
            {
                "id": f.user.id,
                "email": f.user.email,
                "first_name": f.user.first_name,
                "last_name": f.user.last_name,
            }
            if getattr(f, "user", None) is not None
            else None
        )
        data["friend"] = (
            {
                "id": f.friend.id,
                "email": f.friend.email,
                "first_name": f.friend.first_name,
                "last_name": f.friend.last_name,
            }
            if getattr(f, "friend", None) is not None
            else None
        )


    return data




# ---------------------------
# Endpoints
# ---------------------------


# @router.get("/", response_model=FriendshipListResponseSchema)
# def list_all_friendships(db: Session = Depends(get_db)):
#     """
#     ADMIN / debug endpoint: return all friendships.
#     """
#     friendships = db.query(Friendship).all()
#     items = [friendship_to_response(f, include_users=False) for f in friendships]
#     return {"friendships": items, "total": len(items)}




@router.get("/requests/{user_id}", response_model=FriendshipListResponseSchema)
def view_friendship_requests(
    user_id: str,
    direction: Optional[str] = "incoming",  # "incoming" or "outgoing"
    db: Session = Depends(get_db),
   
):
    """
    View friendship requests for the current user.
    direction:
      - incoming: requests where friend_id == current_user.id and status == "pending"
      - outgoing: requests where user_id == current_user.id and status == "pending"
    """
    if direction not in ("incoming", "outgoing"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='direction must be "incoming" or "outgoing".',
        )


    if direction == "incoming":
        query = db.query(Friendship).filter(
            Friendship.friend_id == user_id, Friendship.status == "pending"
        )
    else:
        query = db.query(Friendship).filter(
            Friendship.user_id == user_id, Friendship.status == "pending"
        )


    friendships = query.all()
    items = [friendship_to_response(f, include_users=True) for f in friendships]
    return {"friendships": items, "total": len(items)}




@router.get("/friends/{user_id}", response_model=List[FriendSummarySchema])
def view_friends(user_id: str, db: Session = Depends(get_db),):
    """
    Return all accepted friendships for the current user as a list of FriendSummary.
    This returns the other user's id (friend_id or user_id depending on the stored row).
    """
    # Case A: current_user as requester
    q1 = db.query(Friendship).filter(
        Friendship.user_id == user_id, Friendship.status == "accepted"
    )


    # Case B: current_user as recipient
    q2 = db.query(Friendship).filter(
        Friendship.friend_id == user_id, Friendship.status == "accepted"
    )


    results = q1.union_all(q2).all()


    friends_list = []
    for f in results:
        # determine the id of the other user
        other_id = f.friend_id if f.user_id == user_id else f.user_id


        # If relationship objects are loaded, include minimal user info
        friend_obj = None
        if getattr(f, "friend", None) is not None and f.friend.id == other_id:
            friend_obj = {
                "id": f.friend.id,
                "email": f.friend.email,
                "first_name": f.friend.first_name,
                "last_name": f.friend.last_name,
                "points": f.friend.points,
               
            }
        elif getattr(f, "user", None) is not None and f.user.id == other_id:
            friend_obj = {
                "id": f.user.id,
                "email": f.user.email,
                "first_name": f.user.first_name,
                "last_name": f.user.last_name,
                "points": f.user.points,
            }


        friends_list.append({"friend_id": other_id, "friend": friend_obj, "accepted_at": f.accepted_at})


    return friends_list




@router.post("/", response_model=FriendshipResponseSchema, status_code=status.HTTP_201_CREATED)
def send_friend_request(
    user_id: str,
    payload: FriendshipCreateSchema,
    db: Session = Depends(get_db),
   
):
    """
    Send a friendship request from current_user to payload.friend_id.
    - Prevent sending to self
    - Prevent duplicate pending/accepted relationships in either direction
    """
    if payload.friend_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a friendship request to yourself.",
        )


    # Ensure target user exists
    target_user = db.query(User).filter(User.id == payload.friend_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")


    # Check existing relationship in either direction
    existing = (
        db.query(Friendship)
        .filter(
            ((Friendship.user_id == user_id) & (Friendship.friend_id == payload.friend_id))
            | ((Friendship.user_id == payload.friend_id) & (Friendship.friend_id == user_id))
        )
        .first()
    )


    if existing:
        # If there is already a pending request from the other user, you may want to accept it automatically.
        # For now, block duplicate creation.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A friendship record already exists with status '{existing.status}'.",
        )


    # Create new friendship
    new_friendship = Friendship(
        user_id=user_id,
        friend_id=payload.friend_id,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        created_at=datetime.utcnow(),
    )
    db.add(new_friendship)
    db.commit()
    db.refresh(new_friendship)


    return friendship_to_response(new_friendship, include_users=True)




@router.patch("/update", response_model=FriendshipResponseSchema)
def update_friendship_status(
    user_id: str,
    friendship_id: str,
    payload: FriendshipUpdateSchema,
    db: Session = Depends(get_db),
   
):
    """
    Accept or reject a friendship request.
    - Only the recipient (friend_id) may accept/reject an incoming request.
    - Allowed status transitions: pending -> accepted/rejected.
    """
    f = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found.")


    # Only the recipient can accept/reject an incoming request
    if f.friend_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the recipient of the friendship request can accept or reject it.",
        )


    if f.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change status of a friendship that is already '{f.status}'.",
        )


    new_status = payload.status.value if hasattr(payload.status, "value") else payload.status
    if new_status not in ("accepted", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be 'accepted' or 'rejected'.",
        )


    f.status = new_status
    if new_status == "accepted":
        f.accepted_at = payload.accepted_at or datetime.utcnow()


    db.add(f)
    db.commit()
    db.refresh(f)


    return friendship_to_response(f, include_users=True)
