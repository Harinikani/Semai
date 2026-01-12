# routes/vouchers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Voucher, UserVoucher, PointsTransaction, User
from models.vouchers import VoucherCreate, VoucherResponse
from models.user_vouchers import UserVoucherCreate, UserVoucherResponse, UserVoucherWithDetailsResponse
from routes.auth import get_current_user
import uuid
from datetime import datetime, date

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])

# Get all available vouchers
@router.get("/available", response_model=list[VoucherResponse])
async def get_available_vouchers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Add debug prints
    today = date.today()
    print(f"🔍 DEBUG - Today's date: {today}")
    print(f"🔍 DEBUG - Current user: {current_user.email}")
    
    # Get all vouchers first to see what's in the database
    all_vouchers = db.query(Voucher).filter(Voucher.is_active == True).all()
    print(f"🔍 DEBUG - Total active vouchers: {len(all_vouchers)}")
    
    for voucher in all_vouchers:
        print(f"🔍 DEBUG - Voucher: {voucher.title}, Expiry: {voucher.expiry_date}, Active: {voucher.is_active}")
    
    # Then get filtered vouchers
    vouchers = db.query(Voucher).filter(
        Voucher.is_active == True,
        Voucher.expiry_date > today
    ).order_by(Voucher.points_required.asc()).all()  # Keep points_required column name
    
    print(f"🔍 DEBUG - Available vouchers after filter: {len(vouchers)}")
    
    return vouchers

# Get user's redeemed vouchers - UPDATED: Use join to get voucher details
@router.get("/my-vouchers", response_model=list[UserVoucherWithDetailsResponse])
async def get_my_vouchers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_vouchers = db.query(UserVoucher).filter(
        UserVoucher.user_id == current_user.id,
        UserVoucher.expires_at > date.today(),
        UserVoucher.is_used == False
    ).order_by(UserVoucher.redeemed_at.desc()).all()
    
    # Manually populate voucher details to avoid circular imports
    result = []
    for uv in user_vouchers:
        voucher_data = {
            "id": uv.id,
            "user_id": uv.user_id,
            "voucher_id": uv.voucher_id,
            "redemption_code": uv.redemption_code,
            "redeemed_at": uv.redeemed_at,
            "expires_at": uv.expires_at,
            "is_used": uv.is_used,
            "used_at": uv.used_at,
            "voucher_title": uv.voucher.title if uv.voucher else None,
            "voucher_description": uv.voucher.description if uv.voucher else None,
            "voucher_merchant_name": uv.voucher.merchant_name if uv.voucher else None
        }
        result.append(UserVoucherWithDetailsResponse(**voucher_data))
    
    return result

# Redeem a voucher
@router.post("/redeem")
async def redeem_voucher(
    voucher_data: UserVoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Start a transaction
    try:
        # Check if user has enough currency
        if current_user.currency <= 0:
            raise HTTPException(status_code=400, detail="You don't have any currency to redeem")
        
        # Get the voucher
        voucher = db.query(Voucher).filter(
            Voucher.id == voucher_data.voucher_id,
            Voucher.is_active == True,
            Voucher.expiry_date > date.today()
        ).first()
        
        if not voucher:
            raise HTTPException(status_code=404, detail="Voucher not found or expired")
        
        # Check if user has enough currency
        if current_user.currency < voucher.points_required:  # Keep points_required column name
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough currency. You have {current_user.currency} but need {voucher.points_required}"
            )
        
        # Generate unique redemption code
        redemption_code = f"VOUCHER-{current_user.id[:8]}-{voucher.id[:8]}-{int(datetime.now().timestamp())}"
        
        # Create user voucher
        user_voucher = UserVoucher(
            user_id=current_user.id,
            voucher_id=voucher.id,
            redemption_code=redemption_code,
            expires_at=voucher.expiry_date
        )
        
        # Deduct currency from user
        current_user.currency -= voucher.points_required  # Keep points_required column name
        
        # Create currency transaction record (using PointsTransaction model)
        currency_transaction = PointsTransaction(
            user_id=current_user.id,
            transaction_type="redeem",
            points=-voucher.points_required,  # Keep points field name
            description=f"Redeemed: {voucher.title}",
            reference_id=user_voucher.id
        )
        
        # Save all changes
        db.add(user_voucher)
        db.add(currency_transaction)
        db.commit()
        db.refresh(user_voucher)
        
        return {
            "success": True,
            "message": f"Successfully redeemed {voucher.title}!",
            "redemption_code": redemption_code,
            "new_currency": current_user.currency
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to redeem voucher: {str(e)}")

# Mark voucher as used
@router.post("/use/{redemption_code}")
async def use_voucher(
    redemption_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_voucher = db.query(UserVoucher).filter(
        UserVoucher.redemption_code == redemption_code,
        UserVoucher.user_id == current_user.id
    ).first()
    
    if not user_voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    if user_voucher.is_used:
        raise HTTPException(status_code=400, detail="Voucher has already been used")
    
    if user_voucher.expires_at < date.today():
        raise HTTPException(status_code=400, detail="Voucher has expired")
    
    user_voucher.is_used = True
    user_voucher.used_at = datetime.now()
    db.commit()
    
    return {"success": True, "message": "Voucher marked as used"}

# Get user currency
@router.get("/currency")
async def get_user_currency(
    current_user: User = Depends(get_current_user)
):
    return {"currency": current_user.currency}

# Admin: Create new voucher
@router.post("/", response_model=VoucherResponse)
async def create_voucher(
    voucher_data: VoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # In a real app, you'd check if user is admin
    voucher = Voucher(**voucher_data.dict())
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher

# Admin: Get all vouchers (including inactive)
@router.get("/")
async def get_all_vouchers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vouchers = db.query(Voucher).order_by(Voucher.created_at.desc()).all()
    return vouchers