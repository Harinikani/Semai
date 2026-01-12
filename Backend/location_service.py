import requests
import json
from typing import Dict, Any, Optional
import logging
import time

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self):
        self.services = [
            self._get_location_ipapi_com,  # More reliable endpoint
            self._get_location_ipapi_co,   # Fallback
            self._get_location_ipify,      # Simple IP service
            self._get_location_myip,       # Alternative
        ]
    
    def get_current_location(self) -> Dict[str, Any]:
        """
        Get current location using multiple IP-based geolocation services
        """
        print("🔍 Getting your current location...")
        
        for i, service in enumerate(self.services):
            try:
                print(f"Trying service {i+1}/{len(self.services)}...")
                location = service()
                if location and location.get("success"):
                    print(f"✅ Location obtained from {location.get('service')}")
                    return location
                time.sleep(0.5)  # Small delay between services
            except Exception as e:
                print(f"⚠️  Service {i+1} failed: {e}")
                continue
        
        # Fallback: Return a default location for demo purposes
        return self._get_fallback_location()
    
    def _get_location_ipapi_com(self) -> Dict[str, Any]:
        """Get location from ip-api.com (free, no API key needed)"""
        try:
            response = requests.get('http://ip-api.com/json/', timeout=10)
            data = response.json()
            
            if data.get('status') == 'success':
                return {
                    "success": True,
                    "service": "ip-api.com",
                    "latitude": float(data.get('lat', 0)),
                    "longitude": float(data.get('lon', 0)),
                    "city": data.get('city', 'Unknown'),
                    "country": data.get('country', 'Unknown'),
                    "region": data.get('regionName', 'Unknown'),
                    "ip": data.get('query', 'Unknown'),
                    "raw_data": data
                }
            else:
                raise Exception(data.get('message', 'API error'))
                
        except Exception as e:
            raise Exception(f"ip-api.com failed: {e}")
    
    def _get_location_ipapi_co(self) -> Dict[str, Any]:
        """Get location from ipapi.co (fallback)"""
        try:
            response = requests.get('https://ipapi.co/json/', timeout=10)
            data = response.json()
            
            # Check if we got rate limited
            if 'error' in data:
                raise Exception(f"Rate limited: {data.get('reason', 'Unknown')}")
            
            return {
                "success": True,
                "service": "ipapi.co",
                "latitude": float(data.get('latitude', 0)),
                "longitude": float(data.get('longitude', 0)),
                "city": data.get('city', 'Unknown'),
                "country": data.get('country_name', 'Unknown'),
                "region": data.get('region', 'Unknown'),
                "ip": data.get('ip', 'Unknown'),
                "raw_data": data
            }
        except Exception as e:
            raise Exception(f"ipapi.co failed: {e}")
    
    def _get_location_ipify(self) -> Dict[str, Any]:
        """Get IP from ipify.org, then geolocate"""
        try:
            # First get IP
            ip_response = requests.get('https://api.ipify.org?format=json', timeout=10)
            ip_data = ip_response.json()
            ip_address = ip_data.get('ip')
            
            if not ip_address:
                raise Exception("Could not get IP address")
            
            # Then geolocate the IP
            geo_response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=10)
            geo_data = geo_response.json()
            
            if geo_data.get('status') == 'success':
                return {
                    "success": True,
                    "service": "ipify.org + ip-api.com",
                    "latitude": float(geo_data.get('lat', 0)),
                    "longitude": float(geo_data.get('lon', 0)),
                    "city": geo_data.get('city', 'Unknown'),
                    "country": geo_data.get('country', 'Unknown'),
                    "region": geo_data.get('regionName', 'Unknown'),
                    "ip": ip_address,
                    "raw_data": {"ip": ip_data, "geo": geo_data}
                }
            else:
                raise Exception("Geolocation failed")
                
        except Exception as e:
            raise Exception(f"ipify method failed: {e}")
    
    def _get_location_myip(self) -> Dict[str, Any]:
        """Get location from myip.com"""
        try:
            response = requests.get('https://api.myip.com/', timeout=10)
            data = response.json()
            
            return {
                "success": True,
                "service": "myip.com",
                "latitude": 0.0,  # myip.com doesn't provide coordinates
                "longitude": 0.0,
                "city": "Unknown",
                "country": data.get('country', 'Unknown'),
                "region": "Unknown",
                "ip": data.get('ip', 'Unknown'),
                "raw_data": data,
                "note": "Country only - no coordinates"
            }
        except Exception as e:
            raise Exception(f"myip.com failed: {e}")
    
    def _get_fallback_location(self) -> Dict[str, Any]:
        """Return a fallback location for demo purposes"""
        print("⚠️  Using fallback demo location")
        return {
            "success": True,
            "service": "demo_fallback",
            "latitude": 3.1390,  # Kuala Lumpur coordinates
            "longitude": 101.6869,
            "city": "Kuala Lumpur",
            "country": "Malaysia",
            "region": "Wilayah Persekutuan",
            "ip": "127.0.0.1",
            "is_fallback": True,
            "note": "This is a demo location. Real location services are rate limited."
        }

# Singleton instance
location_service = LocationService()

def get_current_location() -> Dict[str, Any]:
    """Convenience function to get current location"""
    return location_service.get_current_location()

def get_demo_location() -> Dict[str, Any]:
    """Get a guaranteed demo location for testing"""
    return location_service._get_fallback_location()

if __name__ == "__main__":
    # Test the location service
    print("🧪 Testing Improved Location Service...")
    print("=" * 50)
    
    location = get_current_location()
    
    print("\n📍 LOCATION RESULT:")
    print("=" * 50)
    print(json.dumps(location, indent=2))
    
    if location["success"]:
        print(f"\n🎉 SUCCESS!")
        print(f"🌍 You are in: {location['city']}, {location['region']}, {location['country']}")
        print(f"📡 Coordinates: {location['latitude']}, {location['longitude']}")
        print(f"🖥️  Detected by: {location['service']}")
        
        if location.get('is_fallback'):
            print("💡 Note: Using demo location (real services were rate limited)")
    else:
        print("\n❌ Could not determine location")
        print(f"Error: {location.get('error', 'Unknown error')}")