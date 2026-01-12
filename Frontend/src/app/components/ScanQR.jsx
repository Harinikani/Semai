import React, { useState } from "react";
import CameraPortal from "./CameraPortal";

const ScanQR = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
  };

  const handleCapture = (capturedImage) => {
    console.log("Captured QR code image:", capturedImage);
    // Handle the captured QR code image here
    // You can process the image to decode QR code or send it to your backend
    // Example: decodeQRCode(capturedImage.data);
  };

  return (
    <>
      <div
        className="flex items-center gap-4 bg-white w-full p-6 text-center shadow-lg
          border border-emerald-200 rounded-2xl
          transition-all duration-200 ease-in-out cursor-pointer
          hover:shadow-sm hover:scale-[1.02] 
          active:scale-[0.98]"
        style={{ minHeight: '133px' }}
        onClick={handleOpenCamera}
      >
        {/* Logo on the left */}
        <div
          className="flex-shrink-0 flex items-center justify-center bg-emerald-100"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
          }}
        >
          <svg
            className="text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              width: "32px",
              height: "32px",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>

        {/* Text content on the right - centered vertically */}
        <div className="flex-1 text-left">
          <h3
            className="font-semibold text-gray-800 mb-2"
            style={{
              fontSize: "18px",
              lineHeight: "28px",
            }}
          >
            Scan QR Code
          </h3>
          <p
            className="text-gray-600"
            style={{
              fontSize: "14px",
              lineHeight: "20px",
            }}
          >
            Tap to scan a friend's QR code
          </p>
        </div>
      </div>

      <CameraPortal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleCapture}
      />
    </>
  );
};

export default ScanQR;