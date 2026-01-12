const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://semai-backend3-375407363105.us-central1.run.app';

// Main apiCall function
export const apiCall = async (url, config = {}) => {
  const fullUrl = `${BASE_URL}${url}`;
  
  console.log('API Call:', fullUrl, config);
  
  try {
    const response = await fetch(fullUrl, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      credentials: 'include', // Important for authentication cookies
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
    
  } catch (error) {
    console.error('API Call failed:', {
      url: fullUrl,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`API call to ${url} failed: ${error.message}`);
  }
};