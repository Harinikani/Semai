// CameraPlugin.jsx

'use client';

import { useState, useEffect, useRef } from 'react';

const CameraPlugin = ({ isOpen, onClose, onCapture, title = "Camera", onGalleryClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      initializeCamera();
    } else {
      closeCameraStream();
    }
  }, [isOpen]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      closeCameraStream();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream first
      if (streamRef.current) {
        closeCameraStream();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
            setCameraError('Failed to start camera preview');
          });
        };
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const closeCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    closeCameraStream();
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Ensure video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setCameraError('Camera not ready. Please try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          const capturedImage = { 
            type: 'camera', 
            data: blob, 
            url: imageUrl 
          };
          
          onCapture(capturedImage);
          console.log('Photo captured from camera');
        } else {
          setCameraError('Failed to capture photo');
        }
      }, 'image/jpeg', 0.9);
    } else {
      setCameraError('Camera not ready');
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    initializeCamera();
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        .camera-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 1001;
          font-family: 'Inter', sans-serif;
          padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        }

        .camera-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          max-width: 430px;
        }

        .camera-header {
          width: 100%;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          z-index: 1002;
        }

        .camera-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .camera-video-container {
          flex: 1;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          max-height: calc(100vh - 200px);
          max-height: calc(100dvh - 200px); /* Dynamic viewport for mobile browsers */
        }

        .camera-video {
          width: 100%;
          height: 100%;
          max-height: 70vh;
          object-fit: cover;
          border-radius: 20px;
          background-color: #000;
          transform: scale(${isAnimating ? '1' : '0.9'});
          opacity: ${isAnimating ? '1' : '0'};
          transition: all 0.3s ease-in-out;
          border: 2px solid #047857;
        }

        .error-container {
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          backdrop-filter: blur(10px);
          max-width: 300px;
          margin: 20px;
        }

        .error-message {
          margin-bottom: 15px;
          font-size: 16px;
        }

        .retry-button {
          background: white;
          color: #dc2626;
          border: none;
          border-radius: 25px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: #f0f0f0;
        }

        .camera-controls {
          width: 100%;
          padding: 30px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .left-controls {
          flex: 1;
          display: flex;
          justify-content: flex-start;
        }

        .center-controls {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .right-controls {
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }

        .gallery-button {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          width: 60px;
          height: 60px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          color: white;
          gap: 4px;
        }

        .gallery-button:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .gallery-icon {
          width: 24px;
          height: 24px;
          position: relative;
        }

        /* Proper gallery icon - stack of photos */
        .gallery-icon::before,
        .gallery-icon::after {
          content: '';
          position: absolute;
          border: 2px solid currentColor;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
        }

        .gallery-icon::before {
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          z-index: 2;
        }

        .gallery-icon::after {
          top: 6px;
          left: 6px;
          width: 16px;
          height: 16px;
          z-index: 1;
        }

        .gallery-label {
          font-size: 10px;
          font-weight: 500;
          color: white;
          margin-top: 2px;
        }

        .capture-button {
          background: linear-gradient(135deg, #047857, #065f46);
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 70px;
          height: 70px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 4px 15px rgba(4, 120, 87, 0.3);
        }

        .capture-button:hover {
          background: linear-gradient(135deg, #065f46, #064e3b);
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(4, 120, 87, 0.4);
        }

        .capture-button:active {
          transform: scale(0.95);
          box-shadow: 0 2px 10px rgba(4, 120, 87, 0.3);
        }

        .capture-button::before {
          content: '';
          width: 50px;
          height: 50px;
          background-color: white;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .capture-button:active::before {
          background-color: #f0f0f0;
        }

        /* Camera frame overlay */
        .camera-frame {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 85%;
          height: 70%;
          border: 2px solid #047857;
          border-radius: 15px;
          pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
        }

        .frame-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #047857;
          border-style: solid;
        }

        .corner-tl {
          top: -2px;
          left: -2px;
          border-width: 3px 0 0 3px;
          border-radius: 8px 0 0 0;
        }

        .corner-tr {
          top: -2px;
          right: -2px;
          border-width: 3px 3px 0 0;
          border-radius: 0 8px 0 0;
        }

        .corner-bl {
          bottom: -2px;
          left: -2px;
          border-width: 0 0 3px 3px;
          border-radius: 0 0 0 8px;
        }

        .corner-br {
          bottom: -2px;
          right: -2px;
          border-width: 0 3px 3px 0;
          border-radius: 0 0 8px 0;
        }

        /* Mobile-specific adjustments - adapts to all phone sizes */
        @media screen and (max-width: 430px) {
          .camera-overlay {
            padding: 0;
          }

          .camera-video {
            border-radius: 0;
            max-height: calc(100vh - 180px);
            max-height: calc(100dvh - 180px); /* Dynamic viewport for mobile browsers */
            border: none;
          }

          .camera-header {
            padding: 15px 20px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
          }

          .camera-controls {
            padding: 25px 20px;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          }

          .camera-frame {
            border-radius: 0;
            width: 100%;
            height: calc(100vh - 180px);
            height: calc(100dvh - 180px); /* Dynamic viewport for mobile browsers */
          }
        }

        /* Landscape mode adjustments - works on all phone orientations */
        @media screen and (orientation: landscape) {
          .camera-video-container {
            max-height: calc(100vh - 120px);
            max-height: calc(100dvh - 120px); /* Dynamic viewport for mobile browsers */
          }

          .camera-video {
            max-height: calc(100vh - 120px);
            max-height: calc(100dvh - 120px); /* Dynamic viewport for mobile browsers */
            border-radius: 15px;
          }

          .camera-header {
            padding: 10px 20px;
          }

          .camera-controls {
            padding: 15px 20px;
          }

          .capture-button {
            width: 60px;
            height: 60px;
          }

          .capture-button::before {
            width: 45px;
            height: 45px;
          }

          .gallery-button {
            width: 50px;
            height: 50px;
          }

          .gallery-icon {
            width: 20px;
            height: 20px;
          }

          .camera-frame {
            height: 80%;
            width: 70%;
          }
        }

        /* Safe area adjustments for modern phones */
        @supports(padding: max(0px)) {
          .camera-header {
            padding-top: max(20px, env(safe-area-inset-top));
            padding-left: max(20px, env(safe-area-inset-left));
            padding-right: max(20px, env(safe-area-inset-right));
          }
          
          .camera-controls {
            padding-bottom: max(30px, env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <div className="camera-overlay" onClick={handleOverlayClick}>
        <div className="camera-container">
          <div className="camera-header">
            <div className="camera-title">{title}</div>
            <button 
              className="close-button"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>
          
          <div className="camera-video-container">
            {cameraError ? (
              <div className="error-container">
                <div className="error-message">{cameraError}</div>
                <button className="retry-button" onClick={retryCamera}>
                  Retry Camera
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Camera frame overlay */}
                <div className="camera-frame">
                  <div className="frame-corner corner-tl"></div>
                  <div className="frame-corner corner-tr"></div>
                  <div className="frame-corner corner-bl"></div>
                  <div className="frame-corner corner-br"></div>
                </div>
              </>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {!cameraError && (
            <div className="camera-controls">
              <div className="left-controls">
                <button 
                  className="gallery-button"
                  onClick={onGalleryClick}
                  title="Choose from Gallery"
                >
                  <div className="gallery-icon"></div>
                  <span className="gallery-label">Gallery</span>
                </button>
              </div>
              
              <div className="center-controls">
                <button 
                  className="capture-button"
                  onClick={capturePhoto}
                  title="Capture Photo"
                />
              </div>
              
              <div className="right-controls">
                {/* Empty div for balance */}
                <div style={{ width: '60px' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CameraPlugin;