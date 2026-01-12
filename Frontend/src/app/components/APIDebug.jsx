"use client";

import { useState } from 'react';
import { testAPI, scannedSpeciesAPI } from '@/lib/api';

export default function APIDebug() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await testAPI.testConnection();
      setDebugInfo(result);
    } catch (error) {
      setDebugInfo({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testScannedSpecies = async () => {
    setLoading(true);
    try {
      const result = await scannedSpeciesAPI.getAll();
      setDebugInfo({ success: true, data: result });
    } catch (error) {
      setDebugInfo({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">API Debug</h3>
      <div className="space-x-2 mb-4">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Test Species API
        </button>
        <button 
          onClick={testScannedSpecies}
          disabled={loading}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Test Scanned Species API
        </button>
      </div>
      
      {debugInfo && (
        <div className={`p-3 rounded text-sm ${debugInfo.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}