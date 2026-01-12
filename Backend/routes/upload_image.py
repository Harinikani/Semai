import os
import dropbox
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Create router instead of FastAPI app
router = APIRouter(prefix="/upload", tags=["upload"])

# Initialize Dropbox
dbx = dropbox.Dropbox(os.getenv("DROPBOX_TOKEN"))

@router.get("/")
async def read_root():
    return {"message": "Upload endpoints!"}

@router.get("/dropbox")
async def get_image_folder():
    try:
        for entry in dbx.files_list_folder('').entries:
            return entry.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dropbox error: {str(e)}")

@router.post("/animal")
async def upload_animal_picture(file: UploadFile = File(...)):
    """
    Upload an animal picture to Dropbox
    """
    try:
        # Read file contents
        file_content = await file.read()

        # Set Dropbox path
        dropbox_path = f"/animals/{file.filename}"

        # Upload file
        dbx.files_upload(
            file_content,
            dropbox_path,
            mode=dropbox.files.WriteMode("overwrite")
        )

        return {
            "message": "Upload successful",
            "file_name": file.filename,
            "dropbox_path": dropbox_path
        }

    except dropbox.exceptions.ApiError as e:
        raise HTTPException(status_code=500, detail=f"Dropbox API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
@router.get("/animal/{filename}")
async def get_animal_picture(filename: str):
    """
    Retrieve an animal picture from Dropbox
    """
    try:
        # Set Dropbox path
        dropbox_path = f"/animals/{filename}"
        
        # Download the file directly (includes metadata)
        metadata, response = dbx.files_download(dropbox_path)
        
        # Get file content
        file_content = response.content
        
        # Determine content type safely
        content_type = getattr(metadata, 'mime_type', None)
        if not content_type:
            # Fallback: determine by file extension
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
                content_type = f"image/{filename.split('.')[-1].lower()}"
                if content_type == "image/jpg":
                    content_type = "image/jpeg"
            else:
                content_type = "application/octet-stream"
        
        # Return file response
        from fastapi.responses import Response
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "max-age=3600"
            }
        )

    except dropbox.exceptions.ApiError as e:
        if e.error.is_path() and e.error.get_path().is_not_found():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image '{filename}' not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dropbox API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/animals")
async def list_animal_pictures():
    """
    List all animal pictures in Dropbox
    """
    try:
        result = dbx.files_list_folder("/animals")
        images = []
        
        for entry in result.entries:
            if isinstance(entry, dropbox.files.FileMetadata):
                images.append({
                    "filename": entry.name,
                    "size": entry.size,
                    "modified": entry.server_modified.isoformat(),
                    "path": entry.path_display
                })
        
        return {"images": images}
    
    except dropbox.exceptions.ApiError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dropbox API error: {str(e)}"
        )

@router.delete("/animal/{filename}")
async def delete_animal_picture(filename: str):
    """
    Delete an animal picture from Dropbox
    """
    try:
        dropbox_path = f"/animals/{filename}"
        dbx.files_delete_v2(dropbox_path)
        
        return {
            "message": "File deleted successfully",
            "filename": filename
        }
    
    except dropbox.exceptions.ApiError as e:
        if e.error.is_path() and e.error.get_path().is_not_found():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image '{filename}' not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dropbox API error: {str(e)}"
        )

@router.post("/scanned-species")
async def upload_scanned_species_picture(file: UploadFile = File(...)):
    """
    Upload a scanned species picture to Dropbox and return the URL
    """
    try:
        # Read file contents
        file_content = await file.read()

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"scanned_species_{timestamp}{file_extension}"

        # Set Dropbox path
        dropbox_path = f"/scanned-species/{unique_filename}"

        # Upload file to Dropbox
        dbx.files_upload(
            file_content,
            dropbox_path,
            mode=dropbox.files.WriteMode("overwrite")
        )

        # Create shared link
        try:
            shared_link_metadata = dbx.sharing_create_shared_link_with_settings(dropbox_path)
            image_url = shared_link_metadata.url
            
            # Convert to direct download link
            if "?dl=0" in image_url:
                image_url = image_url.replace("?dl=0", "?raw=1")
            elif "?" not in image_url:
                image_url += "?raw=1"
            else:
                image_url += "&raw=1"
                
        except dropbox.exceptions.ApiError as e:
            # If shared link already exists, get existing link
            if e.error.is_shared_link_already_exists():
                shared_links = dbx.sharing_list_shared_links(dropbox_path)
                if shared_links.links:
                    image_url = shared_links.links[0].url
                    if "?dl=0" in image_url:
                        image_url = image_url.replace("?dl=0", "?raw=1")
                else:
                    raise HTTPException(status_code=500, detail="Failed to create shared link")
            else:
                raise

        print(f"✅ Generated Dropbox URL: {image_url}")

        return {
            "message": "Upload successful",
            "file_name": unique_filename,
            "image_url": image_url,  # This should be a directly accessible URL
            "dropbox_path": dropbox_path
        }

    except dropbox.exceptions.ApiError as e:
        print(f"❌ Dropbox API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dropbox API error: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")