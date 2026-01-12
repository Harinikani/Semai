"use client";
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraPlugin from './CameraPlugin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SpeciesScanner({ isOpen, onClose }) {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanData, setLastScanData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Reset everything when scanner opens
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setError(null);
      setLastScanData(null);
      setIsScanning(false);
      
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          setCurrentUser(userData);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
    }
  }, [isOpen]);

  const uploadToBackend = async (imageBlob, filename = 'captured-species.jpg') => {
    // Clear previous states
    setScanResult(null);
    setError(null);
    setLastScanData(null);
    setIsScanning(true);

    try {
      const token = localStorage.getItem('auth_token');
      const userDataStr = localStorage.getItem('user_data');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      let currentUserData = null;
      if (userDataStr) {
        try {
          currentUserData = JSON.parse(userDataStr);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }

      const formData = new FormData();
      formData.append('image', imageBlob, filename);

      console.log('📤 Sending image to backend...');

      const response = await fetch(`${API_BASE_URL}/scanned-species/scan-with-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📥 Backend response status:', response.status);

      if (response.status === 401) {
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Scan successful:', result);
      
      // SUCCESS - set scan result and clear error
      setLastScanData(result);
      setScanResult({
        species: result.species_data?.common_name || result.common_name || 'Unknown Species',
        confidence: 'High',
        scientific_name: result.species_data?.scientific_name || result.scientific_name,
        location: result.location || {},
        scanned_species_id: result.scanned_species_id || result.id,
        is_new_record: result.is_new_record || false,
        scanned_by: currentUserData ? (currentUserData.first_name || currentUserData.email) : 'You'
      });
      setError(null); // Clear any previous errors

      return result;

    } catch (err) {
      console.error("❌ Scan failed:", err);
      
      // ERROR - set error and clear scan result
      setError(err.message || "Scan failed. Please try again.");
      setScanResult(null); // Clear any previous results
      setLastScanData(null);
      
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const formatScanDataToAnimalData = (scanData) => {
      console.log('📸 Scan data for image:', scanData);
      
      // Determine the image URL - handle Dropbox vs Unsplash images
      let imageUrl;
      
      if (scanData.image_url) {
          if (scanData.image_url.includes('scanned_species_')) {
              // It's a Dropbox filename - construct the full URL using image endpoint
              imageUrl = `${API_BASE_URL}/scanned-species/image/animal/${scanData.image_url}`;
              console.log('🖼 Using Dropbox image URL:', imageUrl);
          } else if (scanData.image_url.includes('http')) {
              // It's already a full URL (Unsplash)
              imageUrl = scanData.image_url;
              console.log('🖼 Using Unsplash image URL:', imageUrl);
          } else {
              // Unknown format, use default
              imageUrl = getDefaultImage(scanData.species_data?.common_name || scanData.common_name);
              console.log('🖼 Using default image due to unknown format:', imageUrl);
          }
      } else {
          // No image URL provided, use default
          imageUrl = getDefaultImage(scanData.species_data?.common_name || scanData.common_name);
          console.log('🖼 Using default image (no URL):', imageUrl);
      }

      const threats = scanData.species_data?.threats || scanData.threats
        ? (Array.isArray(scanData.species_data?.threats || scanData.threats) 
            ? (scanData.species_data?.threats || scanData.threats)
            : [scanData.species_data?.threats || scanData.threats])
        : ['Threat information not available'];

      const conservation = scanData.species_data?.conservation || scanData.conservation
        ? (Array.isArray(scanData.species_data?.conservation || scanData.conservation) 
            ? (scanData.species_data?.conservation || scanData.conservation)
            : [scanData.species_data?.conservation || scanData.conservation])
        : ['Conservation information not available'];

      return {
        name: scanData.species_data?.common_name || scanData.common_name || 'Unknown Species',
        species: scanData.species_data?.scientific_name || scanData.scientific_name || 'Unknown',
        status: scanData.species_data?.endangered_status || scanData.endangered_status || 'Not Assessed',
        population: 'Population data not available',
        habitat: scanData.species_data?.habitat || scanData.habitat || 'Habitat information not available',
        threats: threats,
        conservation: conservation,
        description: scanData.species_data?.description || scanData.description || 'Description not available',
        fullDescription: scanData.species_data?.description || scanData.description || 'Detailed description not available.',
        location: scanData.location || {},
        scanned_species_id: scanData.scanned_species_id,
        species_id: scanData.species_id,
        image_url: imageUrl, // Use the properly formatted image URL
        scanned_at: scanData.scan_timestamp,
        is_new_record: scanData.is_new_record || false,
        scanned_by: currentUser ? (currentUser.first_name || currentUser.email) : 'Unknown User'
      };
  };

  const navigateWithData = (animalData) => {
    try {
      const queryParams = new URLSearchParams({
        data: encodeURIComponent(JSON.stringify(animalData))
      });
      router.push(`/animal?${queryParams.toString()}`);
      onClose();
    } catch (navError) {
      console.error('Navigation error:', navError);
      setError('Failed to navigate to animal page.');
    }
  };

  const handleViewAnimalPage = () => {
    if (lastScanData) {
      const animalData = formatScanDataToAnimalData(lastScanData);
      navigateWithData(animalData);
    } else {
      setError('No scan data available.');
    }
  };

  const handleCapture = useCallback(async (capturedImage) => {
    if (capturedImage.data) {
      await uploadToBackend(capturedImage.data);
    }
  }, []);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large');
      return;
    }

    await uploadToBackend(file, file.name);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLearnMoreAboutSpecies = useCallback(() => {
    if (scanResult && scanResult.species && scanResult.species !== 'Unknown') {
      const searchQuery = `${scanResult.species} (${scanResult.scientific_name}) species information`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      window.open(googleSearchUrl, '_blank');
    }
  }, [scanResult]);

  const handleClose = () => {
    setScanResult(null);
    setLastScanData(null);
    setError(null);
    setIsScanning(false);
    setCurrentUser(null);
    onClose();
  };

  useEffect(() => {
    if (scanResult && lastScanData) {
      console.log('🔄 Auto-navigating to animal page...');
      const animalData = formatScanDataToAnimalData(lastScanData);
      navigateWithData(animalData);
    }
  }, [scanResult, lastScanData]);

  // Determine which overlay to show (only one at a time)
  const getOverlayContent = () => {
    if (error) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorHeader}>
            <div style={styles.errorIcon}>❌</div>
            <div style={styles.errorTitle}>Scan Failed</div>
          </div>
          <div style={styles.errorText}>{error}</div>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.dismissButton}
              onClick={() => setError(null)}
            >
              Try Again
            </button>
            <button 
              style={styles.closeButton}
              onClick={handleClose}
            >
              Close Scanner
            </button>
          </div>
        </div>
      );
    }

    if (isScanning) {
      return (
        <div style={styles.scanningContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.scanningText}>
            Identifying species...
            <div style={styles.subText}>
              Analyzing image for {currentUser ? currentUser.first_name || currentUser.email : 'User'}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <CameraPlugin 
        isOpen={isOpen}
        onClose={handleClose}
        onCapture={handleCapture}
        onGalleryClick={handleGalleryClick}
        title="Species Scanner"
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Single overlay that shows only one state at a time */}
      {isOpen && (isScanning || scanResult || error) && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            {getOverlayContent()}
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
    pointerEvents: 'none',
  },
  overlayContent: {
    pointerEvents: 'auto',
  },
  scanningContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: '25px',
    borderRadius: '15px',
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(4, 120, 87, 0.3)',
    borderTop: '4px solid #047857',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  scanningText: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
  },
  subText: {
    fontSize: '12px',
    color: '#ccc',
    marginTop: '5px',
    fontWeight: 'normal',
  },
  resultContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '15px',
    padding: '25px',
    textAlign: 'center',
    maxWidth: '320px',
    backdropFilter: 'blur(10px)',
    border: '2px solid #047857',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  successIcon: {
    fontSize: '20px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#047857',
  },
  resultSpecies: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#047857',
    marginBottom: '5px',
  },
  scientificName: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '10px',
  },
  resultConfidence: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#047857',
    marginBottom: '8px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
  },
  locationInfo: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
  },
  databaseInfo: {
    fontSize: '12px',
    color: '#047857',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  viewAnimalButton: {
    background: '#047857',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  learnMoreButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dismissButton: {
    background: 'rgba(0, 0, 0, 0.1)',
    color: '#333',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  closeButton: {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  autoNavigateText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '15px',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    padding: '25px',
    borderRadius: '15px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    maxWidth: '300px',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
  },
  errorText: {
    marginBottom: '15px',
    fontSize: '16px',
  },
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}