from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_  
from database import get_db
from models.user import User, UserUpdate, PasswordChange, UserResponse, DeleteAccountResponse
from routes.auth import verify_password, hash_password, get_current_user 
import os
from datetime import datetime
from google.cloud import storage
from google.oauth2 import service_account
import logging
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

def find_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = find_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        birthday=user.birthday,
        points=user.points,
        currency=user.currency,
        profile_picture=user.profile_picture,  # Add this line
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active
    )

@router.put("/profile/{user_id}", response_model=UserResponse)
async def update_user_profile(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = find_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Update only the fields that are provided in the request
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        birthday=user.birthday,
        points=user.points,
        profile_picture=user.profile_picture,  # Add this line
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active
    )

@router.put("/password/{user_id}")
async def change_password(user_id: str, password_data: PasswordChange, db: Session = Depends(get_db)):
    user = find_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords don't match")
    
    # Hash and update new password
    user.password = hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.delete("/account/{user_id}", response_model=DeleteAccountResponse)
async def delete_user_account(user_id: str, db: Session = Depends(get_db)):
    user = find_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return DeleteAccountResponse(
        message="Account deleted successfully",
        deleted_user_id=user_id
    )

@router.get("/")
async def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/search/", response_model=list[UserResponse])
async def search_users(
    search: str,
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(
        or_(
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
    ).all()

    if not users:
        raise HTTPException(
            status_code=404,
            detail="No users found"
        )

    return users

@router.get("/rankings")
def get_user_rankings(db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .order_by(User.points.desc(), User.created_at.asc())
        .all()
    )

    results = []
    rank = 1
    for u in users:
        results.append({
            "rank": rank,
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "points": u.points,
            "currency": u.currency,
        })
        rank += 1

    return results

@router.get("/rankings/{user_id}")
def get_user_rank(db: Session = Depends(get_db), user_id: str = None):
    users = (
        db.query(User)
        .order_by(User.currency.desc(), User.created_at.asc())
        .all()
    )

    ranked_users = []
    rank = 1
    for u in users:
        ranked_users.append({
            "rank": rank,
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "currency": u.currency,
        })
        rank += 1

    user_rank = next((u for u in ranked_users if str(u["id"]) == str(user_id)), None)

    if not user_rank:
        raise HTTPException(status_code=404, detail="User not found in rankings")

    return user_rank

@router.post("/profile-picture/{user_id}")
async def upload_profile_picture(
    user_id: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload profile picture to GCP Bucket and save filename to user record"""
    try:
        user = find_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if str(user.id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
        # Validate image file
        if not await validate_profile_image_file(image):
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large (max 5MB)")
        
        # Upload to GCP
        profile_image_filename = await upload_profile_image_to_gcp(image_data, image.filename, user_id)
        
        # Update user record with profile picture filename
        user.profile_picture = profile_image_filename
        db.commit()
        db.refresh(user)
        
        # Construct URL using our bucket-image endpoint (similar to scanned_species)
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        image_url = f"{base_url}/users/profile-picture/{profile_image_filename}"
        
        return {
            "status": "success",
            "message": "Profile picture uploaded successfully",
            "profile_picture": profile_image_filename,
            "image_url": image_url,
            "user_id": str(user.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

async def validate_profile_image_file(image: UploadFile) -> bool:
    """Validate profile image file"""
    if not image.filename:
        return False
    
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_extension = os.path.splitext(image.filename.lower())[1]
    
    if file_extension not in allowed_extensions:
        return False
    
    return True

async def upload_profile_image_to_gcp(image_data: bytes, filename: str, user_id: str) -> str:
    """Upload profile image to GCP Bucket and return filename"""
    try:
        # Get GCP configuration from environment variables
        credentials_info = {
            "type": os.getenv("GCP_TYPE"),
            "project_id": os.getenv("GCP_PROJECT_ID"),
            "private_key_id": os.getenv("GCP_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GCP_PRIVATE_KEY").replace('\\n', '\n'),
            "client_email": os.getenv("GCP_CLIENT_EMAIL"),
            "client_id": os.getenv("GCP_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        bucket_name = os.getenv("GCP_BUCKET_NAME")
        
        # Validate required environment variables
        missing_vars = []
        required_fields = ["type", "project_id", "private_key_id", "private_key", "client_email"]
        for field in required_fields:
            if not credentials_info.get(field):
                missing_vars.append(f"GCP_{field.upper()}")
        
        if not bucket_name:
            missing_vars.append("GCP_BUCKET_NAME")
            
        if missing_vars:
            raise Exception(f"Missing GCP environment variables: {', '.join(missing_vars)}")
        
        # Initialize GCP Storage client
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        bucket = storage_client.bucket(bucket_name)
        
        # Generate unique filename with user ID and timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"profile_picture_{user_id}_{timestamp}{file_extension}"
        
        # Upload to GCP in profile-pictures folder
        blob = bucket.blob(f"profile-pictures/{unique_filename}")
        
        # Determine content type
        content_type = 'image/jpeg'
        if file_extension.lower() in ['.png']:
            content_type = 'image/png'
        elif file_extension.lower() in ['.gif']:
            content_type = 'image/gif'
        elif file_extension.lower() in ['.webp']:
            content_type = 'image/webp'
        
        # Upload the file
        blob.upload_from_string(image_data, content_type=content_type)
        
        # Verify upload
        blob.reload()
        logger.info(f"✅ Profile picture uploaded to GCP: {unique_filename}")
        
        return unique_filename
        
    except Exception as e:
        logger.error(f"❌ GCP upload error: {str(e)}")
        raise Exception(f"GCP upload error: {str(e)}")

@router.get("/profile-picture/{filename}")
async def get_profile_picture(filename: str):
    """
    Serve profile pictures from GCP Bucket
    """
    try:
        # Get GCP configuration
        credentials_info = {
            "type": os.getenv("GCP_TYPE"),
            "project_id": os.getenv("GCP_PROJECT_ID"),
            "private_key_id": os.getenv("GCP_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GCP_PRIVATE_KEY").replace('\\n', '\n'),
            "client_email": os.getenv("GCP_CLIENT_EMAIL"),
            "client_id": os.getenv("GCP_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        bucket_name = os.getenv("GCP_BUCKET_NAME")
        
        # Initialize GCP client
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        bucket = storage_client.bucket(bucket_name)
        
        # Try different possible paths
        possible_paths = [
            f"profile-pictures/{filename}",
            f"profile_picture_{filename}",  # in case filename already includes prefix
            filename  # direct filename
        ]
        
        blob = None
        for path in possible_paths:
            test_blob = bucket.blob(path)
            if test_blob.exists():
                blob = test_blob
                logger.info(f"✅ Found profile picture at: {path}")
                break
        
        if not blob:
            raise HTTPException(status_code=404, detail="Profile picture not found in bucket")
        
        # Download image data
        image_data = blob.download_as_bytes()
        
        # Determine content type
        content_type = 'image/jpeg'  # default
        if filename.lower().endswith('.png'):
            content_type = 'image/png'
        elif filename.lower().endswith('.gif'):
            content_type = 'image/gif'
        elif filename.lower().endswith('.webp'):
            content_type = 'image/webp'
        
        logger.info(f"✅ Serving profile picture: {filename} ({len(image_data)} bytes)")
        
        return Response(content=image_data, media_type=content_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving profile picture {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading profile picture: {str(e)}")

@router.delete("/profile-picture/{user_id}")
async def delete_profile_picture(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user's profile picture from GCP and database"""
    try:
        user = find_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if str(user.id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
        if not user.profile_picture:
            raise HTTPException(status_code=404, detail="No profile picture to delete")
        
        # Delete from GCP
        filename = user.profile_picture
        await delete_profile_image_from_gcp(filename)
        
        # Remove from database
        user.profile_picture = None
        db.commit()
        
        return {
            "status": "success",
            "message": "Profile picture deleted successfully",
            "user_id": str(user.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete profile picture: {str(e)}")

async def delete_profile_image_from_gcp(filename: str):
    """Delete profile image from GCP Bucket"""
    try:
        credentials_info = {
            "type": os.getenv("GCP_TYPE"),
            "project_id": os.getenv("GCP_PROJECT_ID"),
            "private_key_id": os.getenv("GCP_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GCP_PRIVATE_KEY").replace('\\n', '\n'),
            "client_email": os.getenv("GCP_CLIENT_EMAIL"),
            "client_id": os.getenv("GCP_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        bucket_name = os.getenv("GCP_BUCKET_NAME")
        
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(f"profile-pictures/{filename}")
        
        if blob.exists():
            blob.delete()
            logger.info(f"✅ Deleted profile picture: {filename}")
        else:
            logger.warning(f"⚠️ Profile picture not found in GCP: {filename}")
            
    except Exception as e:
        logger.error(f"❌ Error deleting profile picture from GCP: {str(e)}")
        raise Exception(f"GCP delete error: {str(e)}")
    
@router.get("/test-gcp-connection")
async def test_gcp_connection():
    """Test GCP connection for profile pictures"""
    try:
        # Test with a small dummy upload
        test_data = b"test"
        filename = await upload_profile_image_to_gcp(test_data, "test.txt", "test_user")
        
        # Try to retrieve it
        # This will test both upload and serving
        return {
            "status": "success",
            "message": "GCP connection test successful",
            "test_filename": filename
        }
    except Exception as e:
        return {
            "status": "error", 
            "error": str(e)
        }