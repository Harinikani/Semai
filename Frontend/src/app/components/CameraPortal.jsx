// /src/components/CameraPortal.jsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CameraPlugin from './CameraPlugin';

const CameraPortal = ({ isOpen, onClose, onCapture, title = "Camera", onGalleryClick }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <CameraPlugin 
      isOpen={isOpen} 
      onClose={onClose} 
      onCapture={onCapture} 
      title={title}
      onGalleryClick={onGalleryClick}
    />,
    document.body
  );
};

export default CameraPortal;