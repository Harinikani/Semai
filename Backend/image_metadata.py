import os
import base64
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from typing import Dict, Any, Optional, Tuple

# Import HEIC support
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_SUPPORT = True
except ImportError:
    HEIC_SUPPORT = False
    print("Warning: pillow-heif not installed. HEIC files will not be supported.")

class ImageMetadataExtractor:
    def __init__(self):
        pass
    
    def extract_metadata(self, image_data: bytes, image_format: str = "jpeg") -> Dict[str, Any]:
        """
        Extract metadata from image bytes
        Supports JPEG, PNG, HEIC, and other formats
        """
        try:
            # Determine file extension for temp file
            file_extension = self._get_file_extension(image_format)
            temp_filename = f'temp_image.{file_extension}'
            
            # Save bytes to temporary file for PIL to read
            with open(temp_filename, 'wb') as f:
                f.write(image_data)
            
            # Open image and extract EXIF data
            try:
                image = Image.open(temp_filename)
                exif_data = image._getexif()
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Cannot open image: {str(e)}",
                    "has_gps": False,
                    "format": image_format
                }
            finally:
                # Clean up temp file
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)
            
            if not exif_data:
                return {
                    "success": False,
                    "error": "No EXIF metadata found",
                    "has_gps": False,
                    "format": image_format
                }
            
            # Process EXIF data
            metadata = self._process_exif_data(exif_data)
            metadata["success"] = True
            metadata["format"] = image_format
            return metadata
            
        except Exception as e:
            # Clean up temp file in case of error
            temp_filename = f'temp_image.{self._get_file_extension(image_format)}'
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            return {
                "success": False,
                "error": f"Metadata extraction failed: {str(e)}",
                "has_gps": False,
                "format": image_format
            }
    
    def _get_file_extension(self, image_format: str) -> str:
        """Get appropriate file extension for the image format"""
        extension_map = {
            'jpeg': 'jpg',
            'jpg': 'jpg',
            'png': 'png',
            'heic': 'heic',
            'heif': 'heif',
            'webp': 'webp',
            'gif': 'gif',
            'bmp': 'bmp',
            'tiff': 'tiff',
            'tif': 'tiff'
        }
        return extension_map.get(image_format.lower(), 'jpg')
    
    def extract_metadata_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata directly from file path
        """
        try:
            with open(file_path, 'rb') as f:
                image_data = f.read()
            
            # Get file extension from path
            file_extension = file_path.split('.')[-1].lower() if '.' in file_path else 'jpg'
            
            return self.extract_metadata(image_data, file_extension)
            
        except Exception as e:
            return {
                "success": False,
                "error": f"File reading failed: {str(e)}",
                "has_gps": False
            }
    
    def _process_exif_data(self, exif_data: Dict) -> Dict[str, Any]:
        """Process raw EXIF data into readable format"""
        metadata = {
            "has_gps": False,
            "gps_coordinates": None,
            "camera_info": {},
            "image_info": {},
            "date_taken": None,
            "all_exif_data": {}  # Store all available EXIF data
        }
        
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            metadata["all_exif_data"][tag_name] = str(value)
            
            # Extract GPS data
            if tag_name == "GPSInfo":
                gps_data = self._extract_gps_data(value)
                if gps_data:
                    metadata["gps_coordinates"] = gps_data
                    metadata["has_gps"] = True
            
            # Extract camera information
            elif tag_name in ["Make", "Model", "Software", "ExposureTime", "FNumber", "ISOSpeedRatings", "FocalLength"]:
                metadata["camera_info"][tag_name] = str(value)
            
            # Extract image information
            elif tag_name in ["DateTime", "DateTimeOriginal", "DateTimeDigitized"]:
                metadata["date_taken"] = str(value)
            elif tag_name in ["ImageWidth", "ImageHeight", "Orientation"]:
                metadata["image_info"][tag_name] = value
        
        return metadata
    
    def _extract_gps_data(self, gps_info: Dict) -> Optional[Dict[str, float]]:
        """Extract and convert GPS coordinates to decimal format"""
        try:
            gps_data = {}
            
            for key, value in gps_info.items():
                gps_tag = GPSTAGS.get(key, key)
                gps_data[gps_tag] = value
            
            # Extract latitude
            if 'GPSLatitude' in gps_data and 'GPSLatitudeRef' in gps_data:
                lat = self._convert_to_decimal_degrees(
                    gps_data['GPSLatitude'], 
                    gps_data['GPSLatitudeRef']
                )
                gps_data['latitude'] = lat
            
            # Extract longitude
            if 'GPSLongitude' in gps_data and 'GPSLongitudeRef' in gps_data:
                lon = self._convert_to_decimal_degrees(
                    gps_data['GPSLongitude'], 
                    gps_data['GPSLongitudeRef']
                )
                gps_data['longitude'] = lon
            
            # Return simplified coordinates if available
            if 'latitude' in gps_data and 'longitude' in gps_data:
                return {
                    "latitude": gps_data['latitude'],
                    "longitude": gps_data['longitude'],
                    "latitude_ref": gps_data.get('GPSLatitudeRef', ''),
                    "longitude_ref": gps_data.get('GPSLongitudeRef', ''),
                    "altitude": gps_data.get('GPSAltitude', None),
                    "timestamp": gps_data.get('GPSTimeStamp', None)
                }
            
            return None
            
        except Exception as e:
            print(f"GPS extraction error: {e}")
            return None
    
    def _convert_to_decimal_degrees(self, degrees_minutes_seconds: Tuple, direction: str) -> float:
        """Convert GPS coordinates from degrees/minutes/seconds to decimal"""
        try:
            # Handle different tuple formats
            if isinstance(degrees_minutes_seconds[0], tuple):
                # Sometimes it's nested tuples
                degrees = degrees_minutes_seconds[0][0] / degrees_minutes_seconds[0][1] if isinstance(degrees_minutes_seconds[0], tuple) else degrees_minutes_seconds[0]
                minutes = degrees_minutes_seconds[1][0] / degrees_minutes_seconds[1][1] if isinstance(degrees_minutes_seconds[1], tuple) else degrees_minutes_seconds[1]
                seconds = degrees_minutes_seconds[2][0] / degrees_minutes_seconds[2][1] if isinstance(degrees_minutes_seconds[2], tuple) else degrees_minutes_seconds[2]
            else:
                degrees, minutes, seconds = degrees_minutes_seconds
            
            decimal_degrees = float(degrees) + (float(minutes) / 60.0) + (float(seconds) / 3600.0)
            
            # Adjust for direction (N/S, E/W)
            if direction in ['S', 'W']:
                decimal_degrees = -decimal_degrees
            
            return round(decimal_degrees, 6)
        except Exception as e:
            raise ValueError(f"Invalid GPS coordinates: {e}")

# Example usage and testing
if __name__ == "__main__":
    extractor = ImageMetadataExtractor()
    
    print("=== Testing Image Metadata Extraction ===")
    print(f"HEIC Support: {HEIC_SUPPORT}")
    
    # Test with different image formats
    test_files = [
        "test_image.jpg",
        "test_image.heic",
        "test_image.png"
    ]
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"\n--- Testing {test_file} ---")
            metadata = extractor.extract_metadata_from_file(test_file)
            
            if metadata["success"]:
                print(f"✅ Success: {metadata['format']}")
                if metadata["has_gps"]:
                    gps = metadata["gps_coordinates"]
                    print(f"📍 GPS: {gps['latitude']}, {gps['longitude']}")
                if metadata["date_taken"]:
                    print(f"📅 Date: {metadata['date_taken']}")
                if metadata["camera_info"]:
                    print(f"📷 Camera: {metadata['camera_info']}")
            else:
                print(f"❌ Failed: {metadata['error']}")
        else:
            print(f"⚠️  Test file not found: {test_file}")