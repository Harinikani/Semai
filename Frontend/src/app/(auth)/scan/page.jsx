// page.jsx
'use client';
import React, { useState } from 'react';
import SpeciesScanner from '@/app/components/SpeciesScanner';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(true);
  const router = useRouter();

  const handleCloseScanner = () => {
    setIsScannerOpen(false);
    router.push('/animal'); // Navigate to /animal when closed
  };

  return (
    <SpeciesScanner 
      isOpen={isScannerOpen}
      onClose={handleCloseScanner}
    />
  );
}