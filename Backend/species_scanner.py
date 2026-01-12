# species_scanner.py - FIXED VERSION
import os
from dotenv import load_dotenv
import google.generativeai as genai
import base64
import logging
from PIL import Image, UnidentifiedImageError
import io
import json
from datetime import datetime
import uuid
from typing import Dict, Any  # ADD THIS IMPORT

# Try to import HEIC support
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_SUPPORT = True
except ImportError:
    HEIC_SUPPORT = False
    print("HEIC support not available. Install pillow-heif for HEIC file support.")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def configure_genai():
    """Configure Google Generative AI with error handling"""
    try:
        if not GEMINI_API_KEY:
            raise ValueError("Missing Gemini API key")
        
        genai.configure(api_key=GEMINI_API_KEY)
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
        return False

# Configure Gemini
genai_configured = configure_genai()

def validate_and_process_image(image_data: bytes, filename: str = None):
    """
    Validate image and get basic information with HEIC support
    """
    try:
        # Try to open with PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Get image info
        original_format = image.format
        original_mode = image.mode
        image_size = image.size
        
        # Close the image to free memory
        image.close()
        
        return {
            "original_format": original_format,
            "original_mode": original_mode,
            "image_size": image_size,
            "is_valid": True
        }
    except UnidentifiedImageError:
        # If PIL can't identify, check if it's HEIC and we have support
        if filename and filename.lower().endswith(('.heic', '.heif')):
            if HEIC_SUPPORT:
                try:
                    heif_file = pillow_heif.open_heif(io.BytesIO(image_data))
                    image = Image.frombytes(
                        heif_file.mode,
                        heif_file.size,
                        heif_file.data,
                        "raw",
                    )
                    
                    return {
                        "original_format": "HEIC",
                        "original_mode": image.mode,
                        "image_size": image.size,
                        "is_valid": True
                    }
                except Exception as heic_error:
                    return {
                        "is_valid": False,
                        "error": f"HEIC file error: {heic_error}"
                    }
            else:
                return {
                    "is_valid": False,
                    "error": "HEIC format not supported. Install pillow-heif package."
                }
        
        return {
            "is_valid": False,
            "error": "Cannot identify image file - file may be corrupted or in an unsupported format"
        }
    except Exception as e:
        return {
            "is_valid": False,
            "error": str(e)
        }

def convert_heic_to_jpeg(image_data: bytes):
    """
    Convert HEIC image to JPEG for better compatibility
    """
    try:
        if not HEIC_SUPPORT:
            return None, "HEIC support not available"
        
        heif_file = pillow_heif.open_heif(io.BytesIO(image_data))
        image = Image.frombytes(
            heif_file.mode,
            heif_file.size,
            heif_file.data,
            "raw",
        )
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save as JPEG
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='JPEG', quality=90)
        jpeg_data = output_buffer.getvalue()
        
        return jpeg_data, "success"
        
    except Exception as e:
        return None, str(e)

def get_mime_type(format_name: str):
    """Get proper MIME type from format name"""
    mime_map = {
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'heic': 'image/heic',
        'heif': 'image/heif'
    }
    return mime_map.get(format_name.lower() if format_name else '', 'application/octet-stream')

def scan_species_from_image(image_data: bytes, location: str = None, filename: str = None, location_data: dict = None) -> dict:
    """
    Identify animal species from uploaded image using Gemini
    """
    if not genai_configured:
        return {
            "status": "error",
            "error": "API configuration error. Please check your Gemini API key."
        }
    
    try:
        # Validate image first
        image_info = validate_and_process_image(image_data, filename)
        
        # If image is HEIC and valid, convert to JPEG for better compatibility
        processed_image_data = image_data
        processing_info = {"format": "original"}
        final_format = image_info.get("original_format", "unknown").lower()
        
        if image_info["is_valid"] and final_format in ['heic', 'heif']:
            converted_data, conversion_status = convert_heic_to_jpeg(image_data)
            if converted_data:
                processed_image_data = converted_data
                final_format = "jpeg"
                processing_info = {
                    "format": "converted",
                    "original_format": "HEIC",
                    "converted_to": "JPEG",
                    "conversion_status": conversion_status
                }
                logger.info("Successfully converted HEIC to JPEG")
            else:
                logger.warning(f"HEIC conversion failed: {conversion_status}")
        
        if not image_info["is_valid"]:
            return {
                "status": "error",
                "error": f"Invalid image file: {image_info.get('error', 'Unknown error')}",
                "heic_support_available": HEIC_SUPPORT
            }
        
        original_file_size = len(image_data)
        processed_file_size = len(processed_image_data)
        
        # Create the model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create the image object for Gemini
        try:
            # Use the processed image data (original or converted)
            image = genai.upload_file(
                processed_image_data, 
                mime_type=get_mime_type(final_format)
            )
        except Exception as upload_error:
            logger.error(f"Error uploading image to Gemini: {upload_error}")
            # Fallback: try to create image from bytes directly
            try:
                pil_image = Image.open(io.BytesIO(processed_image_data))
                image = pil_image
            except Exception as pil_error:
                return {
                    "status": "error",
                    "error": f"Cannot process image: {pil_error}",
                    "heic_support_available": HEIC_SUPPORT
                }
        
        # Create detailed prompt for structured response
        prompt = """Analyze this animal image and provide a comprehensive species identification in JSON format:

        {
        "common_name": "Common name of the species",
        "scientific_name": "Scientific name (Genus species)",
        "animal_class": "Animal class (Mammals, Birds, Reptiles, Amphibians, Fish, Invertebrates, etc.)",
        "description": "Detailed physical description and characteristics",
        "habitat": "Natural habitat and environment",
        "threats": "General conservation challenges",
        "conservation": "Conservation efforts and information",
        "endangered_status": "Use ONLY: 'Concern' or 'Not Concern'"
        }

        IMPORTANT: For endangered_status, use:
        - 'Concern' for any species that needs conservation attention (endangered, vulnerable, threatened, rare)
        - 'Not Concern' for species that are currently stable and abundant

        Focus on accurate identification while keeping conservation status simple."""


        if location:
            prompt += f"\n\nLocation context: This animal was observed in {location}. Consider local species distribution."
        
        # Generate content with image
        try:
            response = model.generate_content([prompt, image])
        except Exception as gen_error:
            logger.error(f"Gemini API error: {gen_error}")
            return {
                "status": "error",
                "error": f"Gemini API error: {str(gen_error)}"
            }
        
        # Parse the JSON response from Gemini
        try:
            response_text = response.text.strip()
            
            # Clean up JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            species_data = json.loads(response_text)
            
            # Validate required fields
            required_fields = ['common_name', 'scientific_name', 'animal_class', 'description', 'habitat', 'threats', 'conservation', 'endangered_status']
            for field in required_fields:
                if field not in species_data:
                    species_data[field] = "Information not available"
                    
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parsing error: {json_error}")
            logger.error(f"Raw response: {response.text}")
            species_data = {
                "common_name": "Identification Failed",
                "scientific_name": "Unknown sp.",
                "description": f"Raw response: {response.text}",
                "habitat": "Information not available",
                "threats": "Information not available",
                "conservation": "Information not available",
                "endangered_status": "Unknown"
            }
        
        # Generate scan metadata
        scan_timestamp = datetime.now().isoformat()
        
        # Build the complete response
        result = {
            "status": "success",
            "data": {
                "common_name": species_data["common_name"],
                "scientific_name": species_data["scientific_name"],
                "animal_class": species_data["animal_class"],
                "description": species_data["description"],
                "habitat": species_data["habitat"], 
                "threats": species_data["threats"],
                "conservation": species_data["conservation"],
                "endangered_status": species_data["endangered_status"],  
                "api_response": json.dumps(species_data),
                "scan_timestamp": scan_timestamp,
                "image_format": final_format,
                "file_size_bytes": original_file_size,
                "success": True
            },

            "filename": filename or "uploaded_image",
            "file_type": get_mime_type(final_format),
            "file_size": original_file_size
        }
        
        # Add simplified location data if provided
        if location_data:
            result["location"] = {
                "latitude": location_data.get("latitude"),
                "longitude": location_data.get("longitude"),
                "city": location_data.get("city"),
                "country": location_data.get("country"),
                "region": location_data.get("region")
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in image species identification: {e}")
        return {
            "status": "error",
            "error": str(e),
            "heic_support_available": HEIC_SUPPORT
        }

def get_species_scan_capabilities() -> Dict[str, Any]:
    """
    Return information about scanning capabilities
    """
    return {
        "supported_formats": [
            "JPEG", "JPG", "PNG", "GIF", "BMP", "TIFF", "WEBP", 
            "HEIC" if HEIC_SUPPORT else "HEIC (not supported)",
            "HEIF" if HEIC_SUPPORT else "HEIF (not supported)"
        ],
        "max_file_size": "10MB",
        "heic_support": HEIC_SUPPORT,
        "api_configured": genai_configured,
        "model": "gemini-2.0-flash"
    }

def classify_species_by_name(species_name: str) -> Dict[str, Any]:
    """
    Classify species into categories based on species name using Gemini AI
    Uses the same categories as frontend badge system
    """
    # ADD THESE IMPORTS INSIDE THE FUNCTION IF NEEDED
    from datetime import datetime
    import logging
    import json
    
    logger = logging.getLogger(__name__)
    
    if not genai_configured:
        return {
            "status": "error",
            "error": "API configuration error. Please check your Gemini API key."
        }
    
    try:
        # Create the model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create detailed prompt for classification
        prompt = f"""
        Classify the species "{species_name}" into exactly ONE of these categories:
        
        - Birds: All bird species including eagles, owls, hornbills, parrots, penguins, etc.
        - Mammals: All mammal species including tigers, elephants, bears, whales, dolphins, primates, etc.
        - Amphibians: Frogs, toads, salamanders, newts, caecilians
        - Reptiles: Snakes, lizards, turtles, tortoises, crocodiles, alligators
        - Fish: All fish species including sharks, rays, bony fish, cartilaginous fish
        - Arachnids: Spiders, scorpions, ticks, mites
        - Plants: All plant species including trees, flowers, shrubs, grasses
        - Mollusks: Snails, slugs, clams, oysters, octopuses, squids
        - Insects: Butterflies, bees, ants, beetles, flies, mosquitoes
        
        Return ONLY a JSON response in this exact format:
        {{
            "category": "exact_category_name",
            "confidence": "high/medium/low",
            "scientific_class": "scientific classification if known"
        }}
        
        Choose the most specific and accurate category. If uncertain, use "Unknown".
        """
        
        # Generate classification
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        try:
            response_text = response.text.strip()
            
            # Clean up JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            
            classification_data = json.loads(response_text)
            
            # Validate response structure
            if 'category' not in classification_data:
                classification_data = {
                    "category": "Unknown",
                    "confidence": "low", 
                    "scientific_class": "Unknown"
                }
                
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parsing error in classification: {json_error}")
            logger.error(f"Raw response: {response.text}")
            classification_data = {
                "category": "Unknown",
                "confidence": "low",
                "scientific_class": "Unknown"
            }
        
        # Map to frontend badge categories
        frontend_categories = {
            'Birds': 'Birds',
            'Mammals': 'Mammals', 
            'Amphibians': 'Amphibians',
            'Reptiles': 'Reptiles',
            'Fish': 'Fish',
            'Arachnids': 'Arachnids',
            'Plants': 'Plants',
            'Mollusks': 'Mollusks',
            'Insects': 'Insects'
        }
        
        classified_category = classification_data.get('category', 'Unknown')
        final_category = frontend_categories.get(classified_category, 'Unknown')
        
        return {
            "status": "success",
            "classification": {
                "category": final_category,
                "original_category": classified_category,
                "confidence": classification_data.get('confidence', 'unknown'),
                "scientific_class": classification_data.get('scientific_class', 'Unknown'),
                "species_name": species_name
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in species classification: {e}")
        return {
            "status": "error",
            "error": str(e),
            "classification": {
                "category": "Unknown",
                "confidence": "low",
                "species_name": species_name
            }
        }