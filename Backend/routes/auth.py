from fastapi import APIRouter, HTTPException, status, Depends, Header, Query, Response
from typing import Optional
import json
import base64
import logging
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.user import UserCreate, UserResponse, UserLogin, LoginResponse
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["authentication"])
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def find_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def find_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def create_token(user_id: str) -> str:
    """Create a proper token with user ID"""
    token_data = {"user_id": user_id, "type": "access"}
    token_json = json.dumps(token_data)
    token_encoded = base64.b64encode(token_json.encode()).decode()
    return f"bearer_{token_encoded}"

def decode_token(token: str) -> Optional[dict]:
    """Decode token and extract user ID"""
    try:
        if token.startswith("bearer_"):
            token_encoded = token.replace("bearer_", "")
            token_json = base64.b64decode(token_encoded).decode()
            token_data = json.loads(token_json)
            return token_data
        return None
    except Exception:
        return None

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt for email: {user_data.email}")
    
    try:
        # Check if user already exists
        existing_user = find_user_by_email(db, user_data.email)
        if existing_user:
            logger.warning(f"Email already registered: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        logger.info("Email is available, creating user...")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
            birthday=user_data.birthday
            # currency will automatically be set to 0 by the database default
        )
        
        logger.info(f"New user object created: {new_user.email}")
        
        # Save to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User created successfully with ID: {new_user.id}")
        
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            phone_number=new_user.phone_number,
            birthday=new_user.birthday,
            points=new_user.points,
            currency=new_user.currency,  # ADD THIS LINE - FIXES THE ERROR
            created_at=new_user.created_at,
            updated_at=new_user.updated_at,
            is_active=new_user.is_active
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = find_user_by_email(db, login_data.email)
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create proper token with user ID
    access_token = create_token(user.id)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        birthday=user.birthday,
        points=user.points,
        currency=user.currency,  # ADD THIS LINE - FIXES THE ERROR
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    # Try to get token from Authorization header first
    auth_token = None
    if authorization:
        if authorization.startswith("Bearer "):
            auth_token = authorization.replace("Bearer ", "")
        else:
            auth_token = authorization
    
    # If no Authorization header, try query parameter
    if not auth_token and token:
        auth_token = token
    
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    
    try:
        # Decode token to get user ID
        token_data = decode_token(auth_token)
        if not token_data or "user_id" not in token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        user_id = token_data["user_id"]
        user = find_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )
        
        logger.info(f"Authenticated user: {user.email} (ID: {user.id})")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

@router.post("/logout")
async def logout_user(
    response: Response,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
):
    """
    Logout user by invalidating the token on the client side.
    Since we're using stateless tokens, the actual invalidation happens on the client.
    """
    
    # Try to get token from Authorization header first
    auth_token = None
    if authorization:
        if authorization.startswith("Bearer "):
            auth_token = authorization.replace("Bearer ", "")
        else:
            auth_token = authorization
    
    # If no Authorization header, try query parameter
    if not auth_token and token:
        auth_token = token
    
    if not auth_token:
        # Even without a token, we can consider it a successful logout
        # since the client is indicating they want to logout
        logger.info("Logout request without token - client-side cleanup")
        return {"message": "Logged out successfully"}
    
    try:
        # Decode token to get user info for logging
        token_data = decode_token(auth_token)
        if token_data and "user_id" in token_data:
            user_id = token_data["user_id"]
            logger.info(f"User {user_id} logged out")
        else:
            logger.info("Logout request with invalid token format")
    except Exception as e:
        logger.warning(f"Error decoding token during logout: {str(e)}")
    
    # In a stateless JWT system, we can't invalidate the token on the server
    # The client should remove the token from storage
    # We can set cookies to expire if using cookie-based auth
    
    # Clear any auth cookies if using cookie-based authentication
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return {
        "message": "Logged out successfully",
        "details": "Please remove the token from client storage"
    }


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "points": current_user.points,
        "currency": current_user.currency  # ADD THIS LINE
    }

# In your auth.py router, add:
@router.get("/debug-token")
async def debug_token(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check token validity"""
    return {
        "status": "success", 
        "user_id": str(current_user.id),
        "email": current_user.email,
        "token_valid": True
    }