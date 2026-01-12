# routes/points.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import PointsTransaction, User
from models.points_transactions import PointsTransactionResponse
from routes.auth import get_current_user

router = APIRouter(prefix="/api/points", tags=["points"])

# Get user's currency transactions history
@router.get("/transactions", response_model=list[PointsTransactionResponse])
async def get_currency_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transactions = db.query(PointsTransaction).filter(
        PointsTransaction.user_id == current_user.id
    ).order_by(PointsTransaction.created_at.desc()).all()
    
    return transactions

# Get user's current currency balance
@router.get("/balance")
async def get_currency_balance(
    current_user: User = Depends(get_current_user)
):
    return {"currency": current_user.currency}

# Add currency to user (for testing/admin purposes)
@router.post("/add")
async def add_currency(
    currency: int,
    description: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if currency <= 0:
        raise HTTPException(status_code=400, detail="Currency must be positive")
    
    # Add currency to user
    current_user.currency += currency
    
    # Create transaction record
    transaction = PointsTransaction(
        user_id=current_user.id,
        transaction_type="earn",
        points=currency,  # Still using 'points' field but storing currency value
        description=description,
        reference_id=None
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "success": True,
        "message": f"Added {currency} currency",
        "new_balance": current_user.currency
    }