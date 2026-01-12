const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchScannedSpecies = async () => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // FIX: Use backticks (`) instead of single quotes (')
  const response = await fetch(`${API_BASE_URL}/scanned-species/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // FIX: Use backticks here too
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scanned species: ${response.status}`);
  }

  return await response.json();
};

export const scanSpeciesWithImage = async (imageFile) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  // FIX: Use backticks here too
  const response = await fetch(`${API_BASE_URL}/scanned-species/scan-with-location`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // FIX: Use backticks here too
    },
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};