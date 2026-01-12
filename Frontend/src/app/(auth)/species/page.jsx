"use client";


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import SearchBar from '@/app/components/SearchBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://semai-backend3-375407363105.us-central1.run.app/';

// Debug: Log the API base URL to verify it's loaded correctly
if (typeof window !== 'undefined') {
  console.log('🔍 API_BASE_URL:', API_BASE_URL);
  console.log('🔍 process.env.NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
}


export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAllHistorySheetOpen, setIsAllHistorySheetOpen] = useState(false);
  const [scannedSpecies, setScannedSpecies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    fetchScannedSpecies();
  }, []);

  
  const getDefaultImage = (speciesName = '') => {
    const defaultImages = {
      'hornbill': 'hornbill.jfif',
      'rhinoceros hornbill': 'rhinoceros_hornbill.jfif',
      'blue-ringed octopus': 'blue_ringed_octopus.jfif',
      'poison dart frog': 'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=400&h=300&fit=crop',
      'sea turtle': 'sea_turtle.jpg',
      'orangutan': 'orangutan.jpg',
      'bengal tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop',
      'bald eagle': 'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=400&h=300&fit=crop',
      'green turtle': 'green_turtle.jpg',
      'oriental pied hornbill': 'oriental_pied_hornbill.jfif',
      'blue-throated bee-eater': 'blue_throated_bee_eater.jfif',
      'malayan tiger': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=300&fit=crop',
      'asian elephant': 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=300&fit=crop',
      'sun bear': 'Sun-bear.jpg'
    };




    const key = speciesName ? String(speciesName).trim().toLowerCase() : '';
    const fallback = '/semai-elephant-error.png';
    return defaultImages[key] || fallback;
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchScannedSpecies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get token from both storage locations
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      console.log('🔐 Auth token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // FIX: Add trailing slash to prevent redirect
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const apiUrl = `${baseUrl}/scanned-species/`; // ← ADD TRAILING SLASH HERE
      
      console.log('🌐 Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 404) {
          throw new Error('Endpoint not found. Please check the API URL.');
        }
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.status === 'success' && result.data) {
        const transformedData = transformScannedSpeciesData(result.data);
        setScannedSpecies(transformedData);
      } else {
        throw new Error(result.error || 'Failed to load scanned species');
      }
    } catch (err) {
      console.error('❌ Error fetching scanned species:', err);
      setError(err.message);
      setScannedSpecies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchScannedSpecies();
  };

  const transformScannedSpeciesData = (scannedData) => {
    if (!scannedData || !Array.isArray(scannedData)) {
      console.warn('Invalid scanned data:', scannedData);
      return [];
    }

    // Use the same base URL logic as in fetchScannedSpecies
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

    return scannedData.map((item) => {
      // Handle image URLs correctly - use Cloud Run URL, not localhost
      let imageUrl = item.image_url;
      
      console.log('🖼 Original image URL from API:', imageUrl);
      
      // FIX: Replace any localhost:8000 URLs with the correct base URL
      if (imageUrl && imageUrl.includes('localhost:8000')) {
        imageUrl = imageUrl.replace(/http:\/\/localhost:8000/g, baseUrl);
        console.log('🖼 Replaced localhost:8000 with base URL:', imageUrl);
      }
      // If it's a GCP filename (starts with scanned_species_), construct the full URL
      else if (imageUrl && imageUrl.startsWith('scanned_species_')) {
        imageUrl = `${baseUrl}/scanned-species/image/animal/${imageUrl}`;
        console.log('🖼 Constructed GCP image URL:', imageUrl);
      }
      // If it's already a full URL (like Unsplash), use it as-is (but only if it's not localhost)
      else if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost:8000')) {
        console.log('🖼 Using existing full URL:', imageUrl);
        // Keep it as is
      }
      // If it's a relative path, construct full URL
      else if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${baseUrl}${imageUrl}`;
        console.log('🖼 Constructed relative path URL:', imageUrl);
      }
      // If no image URL or it's a placeholder, use generic fallback
      else if (!imageUrl || imageUrl.includes('/images/')) {
        imageUrl = getDefaultImage(item.common_name);
        console.log('🖼 Using fallback image:', imageUrl);
      }

      return {
        id: item.id,
        name: item.common_name,
        title: item.common_name || 'Unknown Species',
        image: imageUrl,
        location: item.location || 'Location not recorded',
        scannedAt: item.created_at,
        scientificName: item.scientific_name,
        endangeredStatus: item.endangered_status,
        species_id: item.species_id,
        verified: item.verified
      };
    });
  };


  const handleSearch = (query) => {
    setSearchQuery(query);
  };


  const handleSpeciesClick = (species) => {
    // Navigate to animal page with scanned species data
    const queryParams = new URLSearchParams({
      scannedSpeciesId: species.id,
      title: species.title,
      image: species.image,
      location: species.location
    });
    
    if (species.scientificName) {
      queryParams.append('scientificName', species.scientificName);
    }
    if (species.endangeredStatus) {
      queryParams.append('endangeredStatus', species.endangeredStatus);
    }
    
    router.push(`/animal?${queryParams.toString()}`);
  };


  const handleViewAllHistory = () => {
    setIsAllHistorySheetOpen(true);
  };


  // Filter species based on search query
  const filteredSpecies = scannedSpecies.filter(species =>
    species.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    species.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (species.scientificName && species.scientificName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredSpecies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSpecies = filteredSpecies.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Smooth scroll to top of Recent History section
    document.getElementById('recent-history')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };


  // Get status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('critically endangered')) return 'bg-red-500 text-white';
    if (statusLower.includes('endangered')) return 'bg-orange-500 text-white';
    if (statusLower.includes('vulnerable')) return 'bg-yellow-500 text-white';
    if (statusLower.includes('near threatened')) return 'bg-blue-500 text-white';
    if (statusLower.includes('least concern')) return 'bg-green-500 text-white';
    return 'bg-gray-100 text-gray-800';
  };

  // Render species item
  const renderSpeciesItem = (species) => (
    <div 
      key={species.id}
      onClick={() => handleSpeciesClick(species)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-50 to-blue-50">
        <img
          src={species.image}
          alt={species.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            // Fallback to generic image if the main image fails
            e.target.src = getDefaultImage(species.name);
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Status Badge */}
        {species.endangeredStatus && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${getStatusBadgeColor(species.endangeredStatus)}`}>
              {species.endangeredStatus}
            </span>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-xl mb-1" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)'}}>
            {species.title}
          </h3>
          {species.scientificName && (
            <p className="text-white/90 text-sm italic" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)'}}>
              {species.scientificName}
            </p>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Malaysia</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Scanned {formatDate(species.scannedAt)}</span>
        </div>

        {/* View Details Button */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-emerald-600 group-hover:text-emerald-700 font-medium text-sm">
            <span>View Details</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
  
  useEffect(() => {
    // Check if we're online
    if (!navigator.onLine) {
      setError('You appear to be offline. Please check your internet connection.');
    }
  }, []);

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all font-medium"
        >
          ← Previous
        </button>
        
        <div className="flex items-center gap-2">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                •••
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[44px] h-11 px-4 rounded-xl border-2 transition-all font-semibold ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                    : 'border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all font-medium"
        >
          Next →
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans">
        <div className="max-w-md mx-auto pb-20">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Species</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="pt-2 px-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SearchBar 
                placeholder="Search by name or location"
                onSearch={handleSearch}
              />
            </div>
          </div>

          <div className="px-6 pt-6">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Scanned Species</h2>
              <div className="space-y-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <Navigation />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans">
      <div className="max-w-md mx-auto pb-20">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Species</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="pt-2 px-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SearchBar 
              placeholder="Search by name or location"
              onSearch={handleSearch}
            />
          </div>
        </div>

        <div className="px-6 pt-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-800 font-semibold mb-1">Connection Error</h4>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setError(null)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Recent History with Modern Cards */}
          <section id="recent-history" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Scanned Species
                </h2>
                {filteredSpecies.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredSpecies.length} {filteredSpecies.length === 1 ? 'species' : 'species'} found
                  </p>
                )}
              </div>
            </div>

            {filteredSpecies.length === 0 ? (
              <div className="text-center py-16 bg-white/50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-gray-400 text-5xl mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No scan history available</h3>
                <p className="text-gray-600 text-sm">Your scanned species will appear here</p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedSpecies.map((species) => renderSpeciesItem(species))}
                </div>
                <Pagination />
              </>
            )}
          </section>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Sheet for All History */}
      <Sheet open={isAllHistorySheetOpen} onOpenChange={setIsAllHistorySheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-gray-800">All Scan History</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 overflow-y-auto pb-8 px-4">
            {filteredSpecies.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No matching scans' : 'No scan history'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Start scanning wildlife to build your collection!'
                  }
                </p>
              </div>
            ) : (
              filteredSpecies.map((species) => renderSpeciesItem(species))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}