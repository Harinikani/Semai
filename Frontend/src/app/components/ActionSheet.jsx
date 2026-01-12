// ActionSheet.jsx (Updated with CameraPortal)

'use client';

import { useState, useEffect, useRef } from 'react';
import CameraPortal from './CameraPortal';

const ActionSheet = ({ isOpen, onClose, onImageSelected }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setIsCameraOpen(false);
      setSelectedImage(null);
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleTakePhoto = () => {
    setIsCameraOpen(true);
  };

  const handleCameraCapture = (image) => {
    setSelectedImage(image);
    setIsCameraOpen(false);
    console.log('Photo captured from CameraPlugin');
  };

  const handleCameraClose = () => {
    setIsCameraOpen(false);
  };

  const handleSelectPhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please select an image under 10MB.');
        return;
      }
      
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage({ type: 'file', data: file, url: imageUrl });
      
      console.log('Photo selected from file system');
    }
    
    event.target.value = '';
  };

  const handleOptionClick = (option) => {
    if (option === 'Take new photo') {
      handleTakePhoto();
    } else if (option === 'Select photo') {
      handleSelectPhoto();
    }
  };

  const uploadImageToServer = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Upload successful (simulated)!');
    alert('Image uploaded successfully (simulated)!');
  };

  const handleUpload = async () => {
    if (selectedImage) {
      if (onImageSelected) {
        onImageSelected(selectedImage); 
      }
      
      await uploadImageToServer(selectedImage.data);
      handleClose(); 
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        .action-sheet-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
        }

        .action-sheet {
          background-color: #e0e0e0;
          width: 100%;
          max-width: 400px;
          border-radius: 20px 20px 0 0;
          padding: 8px;
          box-sizing: border-box;
          transform: translateY(${isAnimating ? '0' : '100%'});
          transition: transform 0.3s ease-in-out;
        }

        .image-preview-container {
          background-color: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 10px;
          text-align: center;
        }

        .preview-image {
          width: 100%;
          max-width: 300px;
          height: auto;
          border-radius: 8px;
          background-color: #000;
        }

        .image-controls {
          margin-top: 15px;
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .control-button {
          background-color: #047857; /* Darker emerald */
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background-color: #065f46; /* Even darker emerald on hover */
        }

        .control-button.danger {
          background-color: #dc2626; /* Darker red */
        }

        .control-button.danger:hover {
          background-color: #b91c1c;
        }

        .control-button.success {
          background-color: #047857; /* Darker emerald for success */
        }

        .control-button.success:hover {
          background-color: #065f46;
        }

        .action-sheet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border-radius: 12px;
          overflow: hidden;
          background-color: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .action-sheet-item {
          padding: 16px;
          text-align: center;
          font-size: 18px;
          cursor: pointer;
          color: #047857; /* Darker emerald color */
          font-weight: 500;
          border-bottom: 1px solid #f3f4f6;
          transition: all 0.2s ease-in-out;
        }

        .action-sheet-item:last-child {
          border-bottom: none;
        }

        .action-sheet-item:hover {
          background-color: #ecfdf5; /* Light emerald background on hover */
          color: #065f46; /* Even darker emerald on hover */
        }
        
        .action-sheet-item:active {
          background-color: #d1fae5; /* Slightly darker emerald background */
        }

        .cancel-button {
          width: 100%;
          margin-top: 10px;
          padding: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #047857; /* Darker emerald color */
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease-in-out;
        }

        .cancel-button:hover {
          background-color: #ecfdf5; /* Light emerald background */
          color: #065f46; /* Even darker emerald on hover */
        }
        
        .cancel-button:active {
          background-color: #d1fae5;
        }

        .hidden-input {
          display: none;
        }

        .image-info {
          margin-top: 10px;
          font-size: 14px;
          color: #6b7280;
        }

        .preview-title {
          color: #374151;
          margin-bottom: 12px;
        }
      `}</style>

      <CameraPortal 
        isOpen={isCameraOpen}
        onClose={handleCameraClose}
        onCapture={handleCameraCapture}
      />

      <div className="action-sheet-overlay" onClick={handleOverlayClick}>
        <div className="action-sheet">
          {selectedImage ? (
            <div className="image-preview-container">
              <h3 className="preview-title">
                {selectedImage.type === 'camera' ? 'Captured Photo' : 'Selected Photo'}
              </h3>
              <img 
                src={selectedImage.url} 
                alt="Preview" 
                className="preview-image"
              />
              <div className="image-info">
                Source: {selectedImage.type === 'camera' ? 'Camera' : 'File System'}
              </div>
              <div className="image-controls">
                <button 
                  className="control-button success"
                  onClick={handleUpload}
                >
                  Upload
                </button>
                <button 
                  className="control-button danger"
                  onClick={handleRetake}
                >
                  Retake
                </button>
              </div>
            </div>
          ) : (
            <ul className="action-sheet-list">
              <li 
                className="action-sheet-item"
                onClick={() => handleOptionClick('Take new photo')}
              >
                Take new photo
              </li>
              <li 
                className="action-sheet-item"
                onClick={() => handleOptionClick('Select photo')}
              >
                Select photo
              </li>
            </ul>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden-input"
          />
          
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default ActionSheet;