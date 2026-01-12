from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from models.species import Species  # ← Add this at the top
from database import get_db
from models.scanned_species import ScannedSpecies, ScannedSpeciesCreate, ScannedSpeciesResponse
from models.user import User
from routes.auth import get_current_user
from typing import Optional, Dict, Any
import logging
import sys
import os
from datetime import datetime
from models.species import SpeciesResponse  # Add this import
from pydantic import BaseModel, ConfigDict  # If using Pydantic v2
from google.cloud import storage
from google.oauth2 import service_account

# Add the root directory to Python path to import species_scanner
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from species_scanner import scan_species_from_image, get_species_scan_capabilities, classify_species_by_name as classify_species_ai
from location_service import get_current_location, get_demo_location

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scanned-species", tags=["scanned-species"])

@router.get("/test-gcp-connection")
async def test_gcp_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test GCP Bucket connection with individual environment variables
    """
    try:
        import os
        from google.cloud import storage
        from google.oauth2 import service_account
        
        # Get GCP configuration
        credentials_info = {
            "type": os.getenv("GCP_TYPE"),
            "project_id": os.getenv("GCP_PROJECT_ID"),
            "private_key_id": os.getenv("GCP_PRIVATE_KEY_ID"),
            "private_key": os.getenv("GCP_PRIVATE_KEY"),
            "client_email": os.getenv("GCP_CLIENT_EMAIL"),
            "client_id": os.getenv("GCP_CLIENT_ID"),
            # Add the required token_uri and auth_uri
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        }
        
        bucket_name = os.getenv("GCP_BUCKET_NAME")
        
        # Check for missing variables
        missing_vars = []
        for key, value in credentials_info.items():
            if not value and key not in ["client_id", "token_uri", "auth_uri"]:  # These have defaults
                missing_vars.append(f"GCP_{key.upper()}")
        
        if not bucket_name:
            missing_vars.append("GCP_BUCKET_NAME")
            
        if missing_vars:
            return {
                "status": "error",
                "error": f"Missing GCP environment variables: {', '.join(missing_vars)}",
                "tested_at": datetime.now().isoformat()
            }
        
        logger.info(f"🔍 Testing GCP connection to bucket: {bucket_name}")
        
        # Initialize GCP client - fix the private key formatting
        if credentials_info["private_key"]:
            credentials_info["private_key"] = credentials_info["private_key"].replace('\\n', '\n')
        
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        # Test bucket access
        bucket = storage_client.bucket(bucket_name)
        if not bucket.exists():
            return {
                "status": "error",
                "error": f"Bucket does not exist or is not accessible: {bucket_name}",
                "tested_at": datetime.now().isoformat()
            }
        
        # Test write permissions
        test_filename = f"connection_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        test_blob = bucket.blob(f"scanned-species/{test_filename}")
        
        test_content = f"GCP Connection Test - {datetime.now().isoformat()}"
        test_blob.upload_from_string(test_content, content_type='text/plain')
        
        # Test read permissions
        if not test_blob.exists():
            return {
                "status": "error",
                "error": "Write test succeeded but file not found (read permission issue)",
                "tested_at": datetime.now().isoformat()
            }
        
        downloaded_content = test_blob.download_as_text()
        
        # Test delete permissions
        test_blob.delete()
        
        # List files to verify folder structure
        blobs = bucket.list_blobs(prefix="scanned-species/", max_results=5)
        file_count = len(list(blobs))
        
        logger.info(f"✅ GCP Connection test successful for user {current_user.id}")
        
        return {
            "status": "success",
            "message": "GCP Bucket connection test successful!",
            "details": {
                "bucket_name": bucket_name,
                "project_id": credentials_info["project_id"],
                "write_test": "PASSED",
                "read_test": "PASSED", 
                "delete_test": "PASSED",
                "files_in_folder": file_count,
                "test_content_verified": downloaded_content == test_content
            },
            "user_id": str(current_user.id),
            "tested_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ GCP connection test failed: {str(e)}")
        return {
            "status": "error",
            "error": f"Connection test failed: {str(e)}",
            "user_id": str(current_user.id),
            "tested_at": datetime.now().isoformat()
        }
        
async def validate_image_file(image: UploadFile) -> bool:
    """Validate uploaded image file"""
    if not image.filename:
        return False
    
    # Check if it's an image file
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.heic', '.heif'}
    file_extension = os.path.splitext(image.filename.lower())[1]
    
    if file_extension not in allowed_extensions:
        return False
    
    return True

async def check_existing_scanned_species(
    user_id: str, 
    species_id: str, 
    location: str, 
    db: Session
) -> Optional[ScannedSpecies]:
    """
    Check if user already has a scanned species record for this species and location
    """
    return db.query(ScannedSpecies).filter(
        ScannedSpecies.user_id == user_id,
        ScannedSpecies.species_id == species_id,
        ScannedSpecies.location.ilike(f"%{location}%")
    ).first()

# ===== CLEANUP ENDPOINTS - MUST BE DEFINED FIRST =====

@router.delete("/cleanup-all-images")
async def cleanup_all_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete ALL files inside the scanned-species folder in GCP Bucket
    """
    try:
        import os
        from google.cloud import storage
        from google.oauth2 import service_account
        
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
        
        # Initialize GCP Storage client
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        bucket = storage_client.bucket(bucket_name)
        
        # List all blobs in the scanned-species folder
        blobs = bucket.list_blobs(prefix="scanned-species/")
        files_to_delete = list(blobs)
        
        if not files_to_delete:
            return {
                "status": "success",
                "message": "No files found to delete - folder is already empty",
                "deleted_count": 0,
                "cleaned_at": datetime.now().isoformat()
            }
        
        # Delete each file
        deleted_count = 0
        for blob in files_to_delete:
            try:
                blob.delete()
                deleted_count += 1
                logger.info(f"✅ Deleted file: {blob.name}")
            except Exception as file_error:
                logger.error(f"❌ Failed to delete {blob.name}: {str(file_error)}")
                continue
        
        logger.info(f"User {current_user.id} deleted {deleted_count} files from GCP")
        
        return {
            "status": "success",
            "message": f"Successfully deleted {deleted_count} files from scanned-species folder",
            "deleted_count": deleted_count,
            "total_files_found": len(files_to_delete),
            "cleaned_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting GCP images: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "cleaned_at": datetime.now().isoformat()
        }

# ===== REGULAR ROUTES =====

@router.get("/", response_model=Dict[str, Any])
async def get_scanned_species(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all scanned species records for the current user with enhanced data for frontend"""
    try:
        scanned_species = db.query(ScannedSpecies).filter(
            ScannedSpecies.user_id == current_user.id
        ).all()
        
        # Enhanced response with species details
        enhanced_species_data = []
        
        for scanned_item in scanned_species:
            # Get basic scanned species data
            species_response = ScannedSpeciesResponse.model_validate(scanned_item)
            species_dict = species_response.model_dump()
            
            # Get species details if species_id exists
            species_details = None
            if scanned_item.species_id:
                species = db.query(Species).filter(Species.id == scanned_item.species_id).first()
                if species:
                    species_details = {
                        "common_name": species.common_name,
                        "scientific_name": species.scientific_name,
                        "endangered_status": species.endangered_status,
                        "description": species.description,
                        "habitat": species.habitat
                    }
            
            # ✅ FIX: Return just the filename, let frontend construct the URL
            image_url = scanned_item.image_url  # Just return the filename as-is
            logger.info(f"🖼 Returning image filename: {image_url}")
            
            # Enhanced data structure for frontend
            enhanced_data = {
                "id": str(scanned_item.id),
                "user_id": str(scanned_item.user_id),
                "species_id": str(scanned_item.species_id) if scanned_item.species_id else None,
                "location": scanned_item.location,
                "image_url": image_url,  # ✅ This should now be just the filename
                "verified": scanned_item.verified,
                "created_at": scanned_item.date_spotted.isoformat() if scanned_item.date_spotted else None,
                # Species details for frontend display
                "common_name": species_details["common_name"] if species_details else "Unknown Species",
                "scientific_name": species_details["scientific_name"] if species_details else None,
                "endangered_status": species_details["endangered_status"] if species_details else None,
                # Raw data for debugging (optional)
                "raw_data": species_dict
            }
            
            enhanced_species_data.append(enhanced_data)
        
        # Sort by creation date (newest first)
        enhanced_species_data.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {
            "status": "success",
            "data": enhanced_species_data,
            "count": len(enhanced_species_data),
            "user_id": str(current_user.id),
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrieving scanned species: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "retrieved_at": datetime.now().isoformat()
        }

@router.post("/test-gcp-storage")
async def test_gcp_storage_direct(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test GCP storage and see exactly what gets stored in database"""
    try:
        image_data = await image.read()

        # Test GCP upload
        image_filename = await upload_image_to_gcp(image_data, image.filename)
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        gcp_url = f"{base_url}/scanned-species/bucket-image/{image_filename}"
        logger.info(f"📤 GCP returned filename: {image_filename}")
        logger.info(f"📤 Constructed URL: {gcp_url}")

        # Create a test scanned species record
        test_species = db.query(Species).first()  # Get any species
        logger.info(f"🖼 FINAL DATABASE STORAGE - image_url: {image_filename}")
        scanned_species_data = ScannedSpeciesCreate(
            species_id=str(test_species.id),
            location="Test Location",
            image_url=image_filename,  # ← Store filename, not URL
            verified=False
        )
        
        db_scanned_species = ScannedSpecies(
            **scanned_species_data.model_dump(),
            user_id=current_user.id
        )
        
        db.add(db_scanned_species)
        db.commit()
        db.refresh(db_scanned_species)
        
        # Check what's actually in the database
        stored_record = db.query(ScannedSpecies).filter(
            ScannedSpecies.id == db_scanned_species.id
        ).first()
        
        return {
            "status": "success",
            "gcp_uploaded_url": gcp_url,
            "stored_in_database": stored_record.image_url,
            "match": gcp_url == stored_record.image_url,
            "record_id": str(db_scanned_species.id)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@router.post("/", response_model=Dict[str, Any])
async def create_scanned_species(
    scanned_data: ScannedSpeciesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new scanned species record"""
    try:
        # Check if species exists if species_id is provided
        if scanned_data.species_id:
            species = db.query(Species).filter(Species.id == scanned_data.species_id).first()
            if not species:
                return {
                    "status": "error",
                    "error": "Species not found",
                    "species_id": scanned_data.species_id,
                    "created_at": datetime.now().isoformat()
                }
        
        # Check for existing scanned species record
        existing_scanned_species = await check_existing_scanned_species(
            str(current_user.id), 
            scanned_data.species_id, 
            scanned_data.location, 
            db
        )
        
        if existing_scanned_species:
            # Convert existing record to Pydantic model
            existing_response = ScannedSpeciesResponse.model_validate(existing_scanned_species)
            return {
                "status": "success",
                "data": existing_response,
                "scanned_species_id": str(existing_scanned_species.id),
                "user_id": str(current_user.id),
                "message": "Scanned species record already exists",
                "is_duplicate": True,
                "created_at": datetime.now().isoformat()
            }
        
        # Create new scanned species record
        db_scanned_species = ScannedSpecies(
            **scanned_data.model_dump(),
            user_id=current_user.id
        )
        
        db.add(db_scanned_species)
        db.commit()
        db.refresh(db_scanned_species)
        
        # Convert to Pydantic model for response
        species_response = ScannedSpeciesResponse.model_validate(db_scanned_species)
        
        return {
            "status": "success",
            "data": species_response,
            "scanned_species_id": str(db_scanned_species.id),
            "user_id": str(current_user.id),
            "message": "Scanned species record created successfully",
            "is_duplicate": False,
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error creating scanned species: {str(e)}")
        db.rollback()  # Important: rollback on error
        return {
            "status": "error",
            "error": str(e),
            "created_at": datetime.now().isoformat()
        }

@router.get("/capabilities")
async def get_scan_capabilities():
    """
    Get information about species scanning capabilities
    """
    try:
        capabilities = get_species_scan_capabilities()
        return {
            "status": "success",
            "data": capabilities,
            "retrieved_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting scan capabilities: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "retrieved_at": datetime.now().isoformat()
        }

@router.post("/scan-with-location")
async def scan_species_with_enhanced_location(
    image: UploadFile = File(..., description="Animal image to identify"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Enhanced scan endpoint that awards both POINTS and CURRENCY
    """
    try:
        # Basic validation
        if not await validate_image_file(image):
            raise HTTPException(
                status_code=400, 
                detail="Invalid image file"
            )
        
        logger.info(f"Enhanced species scan with location from user {current_user.id}")
        
        # HARDCODE LOCATION TO MALAYSIA
        logger.info("📍 Hardcoding location to Malaysia...")
        final_location = "Kuala Lumpur, Wilayah Persekutuan, Malaysia"
        location_detected = True

        # Create simplified location data for the scanner with Malaysia coordinates
        simplified_location_data = {
            "latitude": 3.1390,  # Kuala Lumpur latitude
            "longitude": 101.6869,  # Kuala Lumpur longitude  
            "city": "Kuala Lumpur",
            "country": "Malaysia",
            "region": "Wilayah Persekutuan"
        }

        logger.info(f"✅ Location set to: {final_location}")
        
        # Read and validate image
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large")
        
        # Process with species scanner - PASS THE LOCATION DATA
        result = scan_species_from_image(
            image_data=image_data, 
            location=final_location, 
            filename=image.filename,
            location_data=simplified_location_data
        )
        
        # Enhanced response formatted for database tables
        if result.get("status") == "success":
            # Get or create species in the database
            species_id = await get_or_create_species(
                result.get("data", {}), 
                db
            )
            
            # Get the complete species data for response
            from models.species import Species
            species = db.query(Species).filter(Species.id == species_id).first()
            if not species:
                raise HTTPException(status_code=500, detail="Species not found after creation")
            
            # CALCULATE REWARDS BASED ON SIMPLIFIED STATUS (ANTI-EXPLOIT)
            endangered_status = species.endangered_status.lower() if species.endangered_status else "not concern"

            # Simplified reward tiers - POINTS (permanent) and CURRENCY (spendable)
            reward_tiers = {
                "concern": {"points": 80, "currency": 40},      # Endangered species
                "not concern": {"points": 20, "currency": 10}   # Common species
            }

            # Get rewards - if status is unknown, default to "not concern"
            rewards = reward_tiers.get(endangered_status, reward_tiers["not concern"])
            
            # AWARD BOTH POINTS AND CURRENCY
            current_user.points += rewards["points"]      # Permanent achievement points
            current_user.currency += rewards["currency"]  # Spendable coins
            
            # Create transaction record for POINTS (achievement tracking)
            from models.points_transactions import PointsTransaction
            points_transaction = PointsTransaction(
                user_id=current_user.id,
                transaction_type="species_scan",
                points=rewards["points"],
                description=f"Scanned {species.common_name} - {endangered_status.title()}"
            )
            
            db.add(points_transaction)
            
            logger.info(f"🎯 User {current_user.id} earned {rewards['points']} points and {rewards['currency']} currency for scanning {endangered_status} species")
            
            # Create scanned species record
            scanner_location = result.get("location", {})
            location_string = f"{scanner_location.get('city', 'Unknown')}, {scanner_location.get('country', 'Unknown')}"
            
            # CHECK FOR EXISTING RECORD BEFORE CREATING NEW ONE
            existing_scanned_species = await check_existing_scanned_species(
                str(current_user.id), 
                species_id, 
                location_string, 
                db
            )
            
            scanned_species_id = None
            is_new_record = False

            # TRY TO UPLOAD TO GCP, FALLBACK TO UNSPLASH
            image_filename = None
            gcp_upload_successful = False

            try:
                # Upload and get filename
                image_filename = await upload_image_to_gcp(image_data, image.filename)
                gcp_upload_successful = True
                logger.info(f"✅ Successfully uploaded image to GCP. Filename: {image_filename}")
                    
            except Exception as gcp_error:
                logger.warning(f"❌ GCP upload failed, using Unsplash fallback: {str(gcp_error)}")
                # Fallback to Unsplash API image
                image_filename = get_default_image(species.common_name)  # Store the Unsplash URL directly
                gcp_upload_successful = False
                logger.info(f"🔄 Using fallback image: {image_filename}")
    
            if existing_scanned_species:
                # Update existing record instead of creating new one
                scanned_species_id = str(existing_scanned_species.id)
                logger.info(f"Using existing scanned species record: {scanned_species_id}")
                message = "Species already scanned in this location - using existing record"
                is_new_record = False
            else:
                # Create new scanned species record
                scanned_species_data = ScannedSpeciesCreate(
                    species_id=species_id,
                    location=location_string,
                    image_url=image_filename,  # Store either GCP filename or Unsplash URL
                    verified=False
                )
                
                db_scanned_species = ScannedSpecies(
                    **scanned_species_data.model_dump(),
                    user_id=current_user.id
                )
                
                db.add(db_scanned_species)
                db.commit()
                db.refresh(db_scanned_species)
                scanned_species_id = str(db_scanned_species.id)
                is_new_record = True
                message = "Species scanned and saved successfully"
            
            # Commit all changes (user points/currency updates and transactions)
            db.commit()
            
            # Return the complete formatted response for frontend
            return {
                "status": "success",
                "scan_timestamp": datetime.now().isoformat(),
                "user_id": str(current_user.id),
                "filename": image.filename,
                "file_size": len(image_data),
                "image_format": result.get("data", {}).get("image_format"),
                "location": result.get("location", {}),
                "species_data": {
                    "common_name": species.common_name,
                    "scientific_name": species.scientific_name,
                    "description": species.description,
                    "habitat": species.habitat,
                    "threats": species.threats,
                    "conservation": species.conservation,
                    "endangered_status": species.endangered_status,
                    "success": True,
                    "api_response": species.api_response
                },
                "rewards": {
                    "points_earned": rewards["points"],
                    "currency_earned": rewards["currency"],
                    "total_points": current_user.points,
                    "total_currency": current_user.currency,
                    "endangered_status": endangered_status
                },
                "scanned_species_id": scanned_species_id,
                "species_id": species_id,
                "is_new_record": is_new_record,
                "image_url": image_filename, 
                "message": f"Species scanned successfully! +{rewards['points']} 🏆 points, +{rewards['currency']} 🪙 coins"
            }
        else:
            return {
                "status": "error",
                "error": result.get("error", "Unknown error occurred"),
                "scan_timestamp": datetime.now().isoformat()
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in enhanced species scanning: {str(e)}", exc_info=True)
        db.rollback()  # Rollback in case of error
        return {
            "status": "error",
            "error": str(e),
            "scan_timestamp": datetime.now().isoformat()
        }

async def upload_image_to_gcp_and_get_filename(image_data: bytes, filename: str) -> str:
    """
    Upload image to GCP Bucket and return just the filename (not full URL)
    WORKS WITH UNIFORM BUCKET-LEVEL ACCESS
    """
    try:
        # ... (same code as above until upload part)
        
        # Upload the file WITHOUT making it public
        blob.upload_from_string(image_data, content_type=content_type)
        
        # Verify upload
        blob.reload()  # Refresh blob metadata
        
        logger.info(f"✅ Successfully uploaded image to GCP. Filename: {unique_filename}")
        
        return unique_filename  # Return just the filename, not the full URL
        
    except Exception as e:
        logger.error(f"❌ GCP upload error: {str(e)}")
        raise Exception(f"GCP upload error: {str(e)}")

@router.post("/classify-species", response_model=Dict[str, Any])
async def classify_species_endpoint(  
    classification_request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Classify species into categories based on species name using AI
    """
    try:
        species_name = classification_request.get("species_name")
        
        if not species_name:
            return {
                "status": "error",
                "error": "species_name is required",
                "timestamp": datetime.now().isoformat()
            }
        
        # Use the aliased function
        classification_result = classify_species_ai(species_name)  # ← Changed to alias
        
        if classification_result["status"] == "success":
            return {
                "status": "success",
                "data": classification_result["classification"],
                "species_name": species_name,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "error",
                "error": classification_result.get("error", "Classification failed"),
                "species_name": species_name,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Error in classify species endpoint: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.post("/test-image-upload")
async def test_image_upload(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test image upload to GCP"""
    try:
        image_data = await image.read()
        filename = await upload_image_to_gcp(image_data, image.filename)

        # Construct URL
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        image_url = f"{base_url}/scanned-species/bucket-image/{filename}"
        
        return {
            "status": "success",
            "filename": filename,
            "image_url": image_url,
            "message": "Image uploaded successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
        
# ===== PARAMETERIZED ROUTES - MUST BE DEFINED LAST =====

@router.get("/{scanned_species_id}", response_model=Dict[str, Any])
async def get_scanned_species_by_id(
    scanned_species_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific scanned species record by ID"""
    try:
        scanned_species = db.query(ScannedSpecies).filter(
            ScannedSpecies.id == scanned_species_id
        ).first()
        
        if not scanned_species:
            return {
                "status": "error",
                "error": "Scanned species record not found",
                "scanned_species_id": scanned_species_id,
                "retrieved_at": datetime.now().isoformat()
            }
        
        # Check if user owns the record
        if scanned_species.user_id != current_user.id:
            return {
                "status": "error",
                "error": "Not authorized to access this record",
                "scanned_species_id": scanned_species_id,
                "retrieved_at": datetime.now().isoformat()
            }
        
        # ✅ FIX: Return just the filename
        response_data = ScannedSpeciesResponse.model_validate(scanned_species)
        response_dict = response_data.model_dump()
        response_dict["image_url"] = scanned_species.image_url  # Ensure it's just the filename
        
        return {
            "status": "success",
            "data": response_dict,  # ✅ This now has just the filename
            "scanned_species_id": scanned_species_id,
            "user_id": str(current_user.id),
            "retrieved_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error retrieving scanned species: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "scanned_species_id": scanned_species_id,
            "retrieved_at": datetime.now().isoformat()
        }

@router.put("/{scanned_species_id}", response_model=Dict[str, Any])
async def update_scanned_species(
    scanned_species_id: str,
    scanned_data: ScannedSpeciesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scanned species record"""
    try:
        scanned_species = db.query(ScannedSpecies).filter(
            ScannedSpecies.id == scanned_species_id
        ).first()
        
        if not scanned_species:
            return {
                "status": "error",
                "error": "Scanned species record not found",
                "scanned_species_id": scanned_species_id,
                "updated_at": datetime.now().isoformat()
            }
        
        # Check if user owns the record
        if scanned_species.user_id != current_user.id:
            return {
                "status": "error",
                "error": "Not authorized to update this record",
                "scanned_species_id": scanned_species_id,
                "updated_at": datetime.now().isoformat()
            }
        
        # Check if species exists if species_id is provided
        if scanned_data.species_id:
            from models.species import Species
            species = db.query(Species).filter(Species.id == scanned_data.species_id).first()
            if not species:
                return {
                    "status": "error",
                    "error": "Species not found",
                    "species_id": scanned_data.species_id,
                    "updated_at": datetime.now().isoformat()
                }
        
        # Update scanned species fields
        for field, value in scanned_data.model_dump().items():
            setattr(scanned_species, field, value)
        
        db.commit()
        db.refresh(scanned_species)
        
        # Convert to Pydantic model
        species_response = ScannedSpeciesResponse.model_validate(scanned_species)
        
        return {
            "status": "success",
            "data": species_response,
            "scanned_species_id": scanned_species_id,
            "user_id": str(current_user.id),
            "message": "Scanned species record updated successfully",
            "updated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating scanned species: {str(e)}")
        db.rollback()
        return {
            "status": "error",
            "error": str(e),
            "scanned_species_id": scanned_species_id,
            "updated_at": datetime.now().isoformat()
        }

@router.delete("/{scanned_species_id}")
async def delete_scanned_species(
    scanned_species_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scanned species record"""
    try:
        scanned_species = db.query(ScannedSpecies).filter(
            ScannedSpecies.id == scanned_species_id
        ).first()
        
        if not scanned_species:
            return {
                "status": "error",
                "error": "Scanned species record not found",
                "scanned_species_id": scanned_species_id,
                "deleted_at": datetime.now().isoformat()
            }
        
        # Check if user owns the record
        if scanned_species.user_id != current_user.id:
            return {
                "status": "error",
                "error": "Not authorized to delete this record",
                "scanned_species_id": scanned_species_id,
                "deleted_at": datetime.now().isoformat()
            }
        
        db.delete(scanned_species)
        db.commit()
        
        return {
            "status": "success",
            "message": "Scanned species record deleted successfully",
            "scanned_species_id": scanned_species_id,
            "user_id": str(current_user.id),
            "deleted_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error deleting scanned species: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "scanned_species_id": scanned_species_id,
            "deleted_at": datetime.now().isoformat()
        }

@router.get("/species/{species_id}", response_model=Dict[str, Any])
async def get_species_by_id(
    species_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        from models.species import Species
        species = db.query(Species).filter(Species.id == species_id).first()
        
        if not species:
            return {"status": "error", "error": "Species not found"}
        
        # Convert to Pydantic model
        species_response = SpeciesResponse.model_validate(species)
        
        return {
            "status": "success",
            "data": species_response,  # ← Now using Pydantic model
            "species_id": species_id,
            "retrieved_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error retrieving species: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "species_id": species_id,
            "retrieved_at": datetime.now().isoformat()
        }

# ===== HELPER FUNCTIONS =====
        
async def get_or_create_species(species_data: dict, db: Session) -> str:
    """
    Get existing species or create new one in the database
    Returns the species ID
    """
    try:
        from models.species import Species
        from models.animal_class import AnimalClass
        
        scientific_name = species_data.get("scientific_name")
        common_name = species_data.get("common_name")
        
        # First, check if species already exists by scientific name (most accurate)
        existing_species = db.query(Species).filter(
            Species.scientific_name == scientific_name
        ).first()
        
        if existing_species:
            logger.info(f"Species already exists: {scientific_name} ({common_name})")
            return str(existing_species.id)
        
        # Also check by common name to avoid duplicates
        existing_by_common_name = db.query(Species).filter(
            Species.common_name.ilike(f"%{common_name}%")
        ).first()
        
        if existing_by_common_name:
            logger.info(f"Species with similar common name exists: {common_name} -> {existing_by_common_name.scientific_name}")
            return str(existing_by_common_name.id)
        
        # ✅ FIXED: Use AI classification to get correct animal_class_id
        animal_class_id = await get_animal_class_id_using_ai(common_name, db)
        
        # Create new species only if it doesn't exist
        new_species = Species(
            animal_class_id=animal_class_id,  # ✅ Now uses correct animal class from AI
            common_name=common_name,
            scientific_name=scientific_name,
            description=species_data.get("description"),
            habitat=species_data.get("habitat"),
            threats=species_data.get("threats"),
            conservation=species_data.get("conservation"),
            endangered_status=species_data.get("endangered_status"),
            api_response=species_data.get("api_response")
        )
        
        db.add(new_species)
        db.commit()
        db.refresh(new_species)
        
        logger.info(f"✅ Created new species: {scientific_name} ({common_name}) with animal_class_id: {animal_class_id}")
        return str(new_species.id)
        
    except Exception as e:
        logger.error(f"Error in get_or_create_species: {e}")
        # If there's an error, try to find any existing species as fallback
        try:
            scientific_name = species_data.get("scientific_name")
            existing_species = db.query(Species).filter(
                Species.scientific_name == scientific_name
            ).first()
            if existing_species:
                return str(existing_species.id)
            
            # Fallback to common name search
            common_name = species_data.get("common_name")
            existing_by_common_name = db.query(Species).filter(
                Species.common_name.ilike(f"%{common_name}%")
            ).first()
            if existing_by_common_name:
                return str(existing_by_common_name.id)
        except:
            pass
        
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process species: {str(e)}"
        )

# ✅ NEW FUNCTION: Use AI classification to get correct animal_class_id
async def get_animal_class_id_using_ai(common_name: str, db: Session) -> str:
    """
    Use AI classification to determine the correct animal_class_id
    """
    from models.animal_class import AnimalClass
    
    try:
        # Use the existing classify_species_by_name function
        classification_result = classify_species_by_name(common_name)
        
        if classification_result.get("status") == "success":
            ai_category = classification_result["classification"].get("category")
            if ai_category:
                logger.info(f"🤖 AI classification for '{common_name}': {ai_category}")
                
                # Find the animal class in database
                animal_class = db.query(AnimalClass).filter(
                    AnimalClass.class_name.ilike(ai_category)
                ).first()
                
                if animal_class:
                    logger.info(f"✅ Found animal class: {animal_class.class_name} (ID: {animal_class.id})")
                    return str(animal_class.id)
                else:
                    logger.warning(f"❌ Animal class '{ai_category}' not found in database")
        
        # Fallback if AI classification fails
        logger.warning(f"🔄 AI classification failed for '{common_name}', using fallback")
        return await get_animal_class_id_fallback(common_name, db)
        
    except Exception as e:
        logger.error(f"❌ AI classification error for '{common_name}': {str(e)}")
        return await get_animal_class_id_fallback(common_name, db)

# ✅ FALLBACK FUNCTION: Use keyword matching when AI fails
async def get_animal_class_id_fallback(common_name: str, db: Session) -> str:
    """
    Fallback method using keyword matching
    """
    from models.animal_class import AnimalClass
    
    common_name_lower = common_name.lower()
    
    # Bird patterns - INCLUDING SHOEBILL
    bird_keywords = [
        'bird', 'eagle', 'owl', 'hawk', 'falcon', 'hornbill', 'parrot', 'penguin', 
        'flamingo', 'sparrow', 'crow', 'raven', 'pigeon', 'dove', 'duck', 'goose', 
        'swan', 'stork', 'heron', 'kingfisher', 'woodpecker', 'hummingbird', 
        'shoebill', 'pelican', 'seagull', 'vulture', 'ostrich', 'emu', 'kiwi',
        'cockatoo', 'macaw', 'toucan', 'canary', 'finch', 'robin', 'bluejay'
    ]
    
    # Mammal patterns
    mammal_keywords = [
        'tiger', 'lion', 'elephant', 'bear', 'wolf', 'fox', 'deer', 'monkey', 
        'ape', 'gorilla', 'chimpanzee', 'orangutan', 'whale', 'dolphin', 'bat', 
        'rodent', 'squirrel', 'rabbit', 'kangaroo', 'koala', 'panda', 'zebra',
        'giraffe', 'hippo', 'rhino', 'leopard', 'cheetah', 'jaguar', 'seal'
    ]
    
    # Determine category based on keywords
    category = "Unknown"
    
    if any(keyword in common_name_lower for keyword in bird_keywords):
        category = "Birds"
    elif any(keyword in common_name_lower for keyword in mammal_keywords):
        category = "Mammals"
    elif 'fish' in common_name_lower or 'shark' in common_name_lower:
        category = "Fish"
    elif 'reptile' in common_name_lower or 'snake' in common_name_lower or 'lizard' in common_name_lower:
        category = "Reptiles"
    elif 'amphibian' in common_name_lower or 'frog' in common_name_lower or 'toad' in common_name_lower:
        category = "Amphibians"
    elif 'insect' in common_name_lower or 'butterfly' in common_name_lower or 'bee' in common_name_lower:
        category = "Insects"
    
    logger.info(f"🔄 Fallback classification for '{common_name}': {category}")
    
    # Find the animal class in database
    animal_class = db.query(AnimalClass).filter(
        AnimalClass.class_name.ilike(category)
    ).first()
    
    if animal_class:
        return str(animal_class.id)
    
    # Ultimate fallback: Use Birds as default (since Shoebill is a bird)
    birds_class = db.query(AnimalClass).filter(AnimalClass.class_name == "Birds").first()
    if birds_class:
        logger.warning(f"⚠️ Using default animal class: Birds")
        return str(birds_class.id)
    
    # Last resort: First animal class in database
    first_class = db.query(AnimalClass).first()
    if first_class:
        logger.error(f"🚨 Using first available animal class: {first_class.class_name}")
        return str(first_class.id)
    
    raise Exception("No animal classes found in database")

async def get_animal_class_id_for_species(species_data: dict, db: Session) -> str:
    """
    Get animal_class_id based on species data - USE THE NEW AI FUNCTION
    """
    common_name = species_data.get("common_name", "")
    return await get_animal_class_id_using_ai(common_name, db)

@router.get("/animal-class/{animal_class_id}")
async def get_animal_class_by_id(
    animal_class_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get animal class by ID"""
    try:
        from models.animal_class import AnimalClass
        
        animal_class = db.query(AnimalClass).filter(AnimalClass.id == animal_class_id).first()
        
        if not animal_class:
            return {
                "status": "error",
                "error": "Animal class not found",
                "animal_class_id": animal_class_id
            }
        
        return {
            "status": "success",
            "data": {
                "id": str(animal_class.id),
                "class_name": animal_class.class_name
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching animal class: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }
        
@router.get("/image/animal/{filename:path}")
async def get_animal_image(
    filename: str,
    db: Session = Depends(get_db)
):
    """
    Redirect to bucket-image endpoint - PUBLIC ENDPOINT
    This handles legacy URLs and provides backward compatibility
    """
    from fastapi.responses import RedirectResponse
    import urllib.parse
    
    # Decode URL-encoded filename
    filename = urllib.parse.unquote(filename)
    
    logger.info(f"🖼 Image redirect received - filename: {filename}")
    
    # If the filename is already a full bucket-image URL, extract just the filename
    if "bucket-image/" in filename:
        # Extract just the filename part from the URL
        filename_only = filename.split("bucket-image/")[-1]
        logger.info(f"🖼 Redirecting to bucket-image with filename: {filename_only}")
        return RedirectResponse(url=f"/scanned-species/bucket-image/{filename_only}")
    elif filename.startswith(('http://', 'https://')):
        # If it's a full URL but doesn't contain bucket-image, try to extract the filename
        # This handles cases like http://localhost:8000/scanned-species/bucket-image/filename.jpg
        from urllib.parse import urlparse
        parsed_url = urlparse(filename)
        path_parts = parsed_url.path.split('/')
        if len(path_parts) >= 3 and path_parts[-2] == "bucket-image":
            filename_only = path_parts[-1]
            logger.info(f"🖼 Extracted filename from full URL: {filename_only}")
            return RedirectResponse(url=f"/scanned-species/bucket-image/{filename_only}")
    
    # Regular filename, redirect to bucket-image
    logger.info(f"🖼 Regular filename redirect: {filename}")
    return RedirectResponse(url=f"/scanned-species/bucket-image/{filename}")
    
async def get_animal_class_id_for_species(common_name: str, db: Session) -> str:
    # ← Remove all keyword matching code
    # Just use the animal_class from AI response
    animal_class_name = species_data.get("animal_class", "Mammals")
    
    animal_class = db.query(AnimalClass).filter(
        AnimalClass.class_name == animal_class_name
    ).first()
    return str(animal_class.id)

async def upload_image_to_gcp(image_data: bytes, filename: str) -> str:
    """
    Upload image to GCP Bucket and return PUBLIC GCP URL
    WORKS WITH UNIFORM BUCKET-LEVEL ACCESS
    """
    try:
        import os
        from google.cloud import storage
        from google.oauth2 import service_account
        
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
        
        # Generate unique filename with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"scanned_species_{timestamp}{file_extension}"
        
        # Upload to GCP
        blob = bucket.blob(f"scanned-species/{unique_filename}")
        
        # Determine content type
        content_type = 'image/jpeg'
        if file_extension.lower() in ['.png']:
            content_type = 'image/png'
        elif file_extension.lower() in ['.gif']:
            content_type = 'image/gif'
        elif file_extension.lower() in ['.webp']:
            content_type = 'image/webp'
        
        # Add debug logging
        logger.info(f"📤 Attempting GCP upload: {filename} -> {unique_filename}")
        logger.info(f"📊 File size: {len(image_data)} bytes")
        logger.info(f"🏷️ Content type: {content_type}")
        
        # Upload the file WITHOUT making it public (since we have Uniform Bucket-Level Access)
        blob.upload_from_string(image_data, content_type=content_type)
        
        # Verify upload
        blob.reload()  # Refresh blob metadata
        logger.info(f"✅ Upload confirmed - Blob size: {blob.size} bytes")
        logger.info(f"✅ Blob exists: {blob.exists()}")
        
        # With Uniform Bucket-Level Access, we serve images through our API endpoint
        # Construct the URL to our own bucket-image endpoint
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        image_url = f"{base_url}/scanned-species/bucket-image/{unique_filename}"
        
        logger.info(f"✅ Successfully uploaded image to GCP. Serving URL: {image_url}")
        
        return unique_filename  
        
    except Exception as e:
        logger.error(f"❌ GCP upload error: {str(e)}")
        raise Exception(f"GCP upload error: {str(e)}")
    
@router.delete("/cleanup-all-images")
async def cleanup_all_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete ALL files inside the scanned-species folder in GCP Bucket
    """
    try:
        import os
        from google.cloud import storage
        from google.oauth2 import service_account
        
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
        
        # Initialize GCP Storage client
        credentials = service_account.Credentials.from_service_account_info(credentials_info)
        storage_client = storage.Client(credentials=credentials, project=credentials_info["project_id"])
        
        bucket = storage_client.bucket(bucket_name)
        
        # List all blobs in the scanned-species folder
        blobs = bucket.list_blobs(prefix="scanned-species/")
        files_to_delete = list(blobs)
        
        if not files_to_delete:
            return {
                "status": "success",
                "message": "No files found to delete - folder is already empty",
                "deleted_count": 0,
                "cleaned_at": datetime.now().isoformat()
            }
        
        # Delete each file
        deleted_count = 0
        for blob in files_to_delete:
            try:
                blob.delete()
                deleted_count += 1
                logger.info(f"✅ Deleted file: {blob.name}")
            except Exception as file_error:
                logger.error(f"❌ Failed to delete {blob.name}: {str(file_error)}")
                continue
        
        logger.info(f"User {current_user.id} deleted {deleted_count} files from GCP")
        
        return {
            "status": "success",
            "message": f"Successfully deleted {deleted_count} files from scanned-species folder",
            "deleted_count": deleted_count,
            "total_files_found": len(files_to_delete),
            "cleaned_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting GCP images: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "cleaned_at": datetime.now().isoformat()
        }
    
def get_default_image(species_name: str) -> str:
    """
    Get fallback Unsplash image for species
    """
    default_images = {
        'Hornbill': 'https://images.unsplash.com/photo-1597848212624-e5f4bfc2afb5?w=400&h=300&fit=crop',
        'Rhinoceros Hornbill': 'https://images.unsplash.com/photo-1597848212624-e5f4bfc2afb5?w=400&h=300&fit=crop',
        'Blue Ringed Octopus': 'https://images.unsplash.com/photo-1559827260-d66d52bef19?w=400&h=300&fit=crop',
        'Poison Dart Frog': 'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=400&h=300&fit=crop',
        'Sea Turtle': 'https://images.unsplash.com/photo-1598158181777-19c8e323ed7c?w=400&h=300&fit=crop',
        'Orangutan': 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=300&fit=crop',
        'Rafflesia': 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop',
        'Bengal Tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop',
        'Bald Eagle': 'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=400&h=300&fit=crop',
        'Green Turtle': 'https://images.unsplash.com/photo-1598158181777-19c8e323ed7c?w=400&h=300&fit=crop',
        'Oriental Pied Hornbill': 'https://images.unsplash.com/photo-1597848212624-e5f4bfc2afb5?w=400&h=300&fit=crop',
        'Blue-throated Bee-eater': 'https://images.unsplash.com/photo-1517832203067-7c0c8bd328e5?w=400&h=300&fit=crop',
        'Malayan Tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop',
        'Asian Elephant': 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=300&fit=crop',
        'Sun Bear': 'https://images.unsplash.com/photo-1574870111867-089858c7af7e?w=400&h=300&fit=crop'
    }
    
    # Try exact match first
    if species_name in default_images:
        return default_images[species_name]
    
    # Try partial match
    for key, url in default_images.items():
        if key.lower() in species_name.lower():
            return url
    
    # Default fallback
    return '/semai-elephant-error.png'

@router.get("/public-test")
async def public_test_connection():
    """Public test endpoint - no authentication required"""
    from datetime import datetime
    return {
        "status": "success",
        "message": "Public test endpoint is working!",
        "timestamp": datetime.now().isoformat(),
        "endpoint": "/scanned-species/public-test"
    }

@router.get("/test-connection")
async def test_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test endpoint to verify authenticated connection"""
    from datetime import datetime
    return {
        "status": "success",
        "message": "Authenticated test endpoint is working!",
        "user_id": str(current_user.id),
        "timestamp": datetime.now().isoformat(),
        "endpoint": "/scanned-species/test-connection"
    }
    
@router.get("/bucket-image/{filename}")
async def get_bucket_image(
    filename: str,
    db: Session = Depends(get_db)
):
    """
    Serve images directly from GCP Bucket - PUBLIC ENDPOINT
    """
    try:
        import os
        from google.cloud import storage
        from google.oauth2 import service_account
        from fastapi.responses import Response
        
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
            f"scanned-species/{filename}",
            f"scanned_species_{filename}",  # in case filename already includes prefix
            filename  # direct filename
        ]
        
        blob = None
        for path in possible_paths:
            test_blob = bucket.blob(path)
            if test_blob.exists():
                blob = test_blob
                logger.info(f"✅ Found image at: {path}")
                break
        
        if not blob:
            raise HTTPException(status_code=404, detail="Image not found in bucket")
        
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
        
        logger.info(f"✅ Serving image: {filename} ({len(image_data)} bytes)")
        
        return Response(content=image_data, media_type=content_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving bucket image {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading image: {str(e)}")