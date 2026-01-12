"use client";


import React, { useState, useEffect, Suspense } from 'react';
import BigBox from '@/app/components/BigBox';
import AccordionItem from "@/app/components/AccordionItem";
import { useRouter, useSearchParams } from 'next/navigation';


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://semai-backend3-375407363105.us-central1.run.app';

const AnimalCardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDescriptionSheetOpen, setIsDescriptionSheetOpen] = useState(false);
  const [animalData, setAnimalData] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animalClass, setAnimalClass] = useState("Unknown");
  const [allBadgesData, setAllBadgesData] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Add this function to fetch animal class directly from database
const fetchAnimalClassFromDatabase = async (speciesId) => {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    
    // Fetch species details which should include animal_class_id
    const speciesUrl = `${baseUrl}/scanned-species/species/${speciesId}/`;
    
    console.log('🦴 Fetching animal class for species:', speciesId);
    
    const response = await fetch(speciesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data.animal_class_id) {
        // Now fetch the animal class name using the animal_class_id
        const animalClass = await fetchAnimalClassName(result.data.animal_class_id);
        return animalClass;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching animal class from database:', error);
    return null;
  }
};

// Function to get animal class name from animal_class_id
const fetchAnimalClassName = async (animalClassId) => {
  try {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    
    // You'll need to create this endpoint in your backend
    const animalClassUrl = `${baseUrl}/api/animal-class/${animalClassId}/`;
    
    const response = await fetch(animalClassUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      return result.data?.class_name || 'Wildlife';
    }
    
    return 'Wildlife';
  } catch (error) {
    console.error('❌ Error fetching animal class name:', error);
    return 'Wildlife';
  }
};

  // Improved animal class determination
  const determineAnimalClass = async (speciesData) => {
    console.log("🦴 Determining animal class...");

    try {
      // Method 1: Try to get from database using species_id
      if (speciesData.species_id) {
        console.log("🎯 Using species_id to fetch animal class:", speciesData.species_id);
        const animalClass = await fetchAnimalClassFromDatabase(speciesData.species_id);
        if (animalClass) {
          console.log("✅ Animal class from database:", animalClass);
          return animalClass;
        }
      }

      // Method 2: Try to get from scanned data
      if (scannedData?.species_id) {
        console.log("🎯 Using scanned species_id:", scannedData.species_id);
        const animalClass = await fetchAnimalClassFromDatabase(scannedData.species_id);
        if (animalClass) {
          console.log("✅ Animal class from scanned data:", animalClass);
          return animalClass;
        }
      }

      // Method 3: Fallback to badges-based classification
      if (allBadgesData.length > 0 && speciesData.name) {
        console.log("🔄 Falling back to badges-based classification");
        const className = findAnimalClassFromBadges(speciesData.name, allBadgesData);
        if (className && className !== "Wildlife") {
          console.log("✅ Animal class from badges:", className);
          return className;
        }
      }

      // Final fallback
      console.log("🦘 Using default classification: Wildlife");
      return "Wildlife";

    } catch (error) {
      console.error("❌ Error determining animal class:", error);
      return "Wildlife";
    }
  };
  // Helper function to get default images - SAME AS HISTORY PAGE
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

  // Helper function to get population info
  const getPopulationInfo = (endangeredStatus) => {
    if (!endangeredStatus) return 'Population status unknown';


    const status = endangeredStatus.toLowerCase();
    if (status.includes('critically endangered')) return 'Very few remain in the wild';
    if (status.includes('endangered')) return 'Population is declining rapidly';
    if (status.includes('vulnerable')) return 'Population is vulnerable';
    if (status.includes('near threatened')) return 'Population is relatively stable';
    if (status.includes('least concern')) return 'Population is healthy';
    return 'Population status unknown';
  };

  // Helper function to get detailed description based on species
  const getDetailedDescription = (title, scientificName, endangeredStatus) => {
    const baseDescriptions = {
      'Rhinoceros Hornbill': `The ${title} (${scientificName}) is a magnificent bird found in the rainforests of Southeast Asia. Known for its impressive casque and vibrant colors, this species plays a vital role in forest ecosystems as a seed disperser.


These remarkable birds form lifelong pairs and demonstrate extraordinary family dedication. The female seals herself inside a tree cavity for months during nesting, while the male tirelessly delivers food through a small slit.


${endangeredStatus ? `Conservation Status: ${endangeredStatus}` : ''}


The Rhinoceros Hornbill faces threats from deforestation and hunting, but conservation efforts are helping protect these iconic birds.`,


      'Blue Ringed Octopus': `The ${title} (${scientificName}) is one of the ocean's most fascinating creatures. Despite its small size, this master of disguise carries enough venom to be potentially dangerous to humans.


When threatened, it transforms from sandy camouflage to brilliant blue rings in milliseconds, serving as a warning to potential predators. Found in tidal pools and coral reefs, it represents nature's paradox: breathtaking beauty concealing potent defense mechanisms.


${endangeredStatus ? `Conservation Status: ${endangeredStatus}` : ''}


While not currently endangered, habitat damage and collection for the aquarium trade pose threats to local populations.`,


      'Orangutan': `The ${title} (${scientificName}) shares 97% of our DNA, displaying remarkable intelligence and emotional depth. These "people of the forest" are found only in the rainforests of Borneo and Sumatra.


Young orangutans learn survival skills from their mothers for up to 8 years—the longest childhood dependency of any animal besides humans. Their thoughtful problem-solving and tool use reveal a profound consciousness that continues to amaze researchers.


${endangeredStatus ? `Conservation Status: ${endangeredStatus}` : ''}


These gentle giants face severe threats from palm oil deforestation and illegal pet trade, making conservation efforts critically important.`,


      'Rafflesia': `The ${title} (${scientificName}) is the world's largest flower, producing blooms over 3 feet wide weighing up to 15 pounds. This parasitic plant has no leaves, stems, or roots, living entirely within its host vine.


Its infamous corpse-like smell attracts carrion flies for pollination, creating one of nature's most bizarre reproductive strategies. Each flower takes months to develop and blooms for only a few days.


${endangeredStatus ? `Conservation Status: ${endangeredStatus}` : ''}


Habitat destruction and low reproduction rates threaten this unique plant, found only in specific rainforest regions of Southeast Asia.`
    };


    return baseDescriptions[title] || `The ${title} ${scientificName ? `(${scientificName})` : ''} is a fascinating species that plays an important role in its ecosystem.


${endangeredStatus ? `Conservation Status: ${endangeredStatus}` : 'Conservation status information is currently being updated.'}


This species represents the incredible biodiversity of our planet and highlights the importance of wildlife conservation efforts. Each creature, no matter how small or large, contributes to the delicate balance of nature.`;
  };


  // Helper function to get habitat information
  const getHabitatInfo = (title) => {
    const habitatInfo = {
      'Rhinoceros Hornbill': 'Tropical rainforests of Southeast Asia, particularly in Malaysia, Indonesia, and Thailand. Prefers tall, mature trees for nesting and fruiting trees for feeding.',
      'Blue Ringed Octopus': 'Tidal pools, coral reefs, and sandy bottoms in the Pacific and Indian Oceans. Often found hiding in shells, crevices, or buried in sand.',
      'Orangutan': 'Tropical rainforests of Borneo and Sumatra, spending most of their lives in the canopy layer where they find food and build nests.',
      'Rafflesia': 'Undergrowth of primary rainforests in Borneo and Sumatra, specifically growing on Tetrastigma vines in shaded, humid conditions.',
      'Bengal Tiger': 'Tropical forests, mangroves, and grasslands across India, Bangladesh, Nepal, and Bhutan.',
      'Sea Turtle': 'Coral reefs, seagrass beds, and open ocean waters in tropical and subtropical regions worldwide.'
    };


    return habitatInfo[title] || 'This species inhabits various ecosystems and plays a crucial role in maintaining ecological balance. Specific habitat details are recorded when species are scanned through the camera feature.';
  };


  // Helper function to get threats information
  const getThreatsInfo = (title) => {
    const threatsInfo = {
      'Rhinoceros Hornbill': ['Deforestation and habitat loss', 'Hunting for feathers and casques', 'Illegal pet trade', 'Forest fragmentation'],
      'Blue Ringed Octopus': ['Habitat damage from coastal development', 'Collection for aquarium trade', 'Water pollution', 'Climate change affecting coral reefs'],
      'Orangutan': ['Palm oil plantation expansion', 'Illegal pet trade', 'Forest fires', 'Habitat fragmentation'],
      'Rafflesia': ['Habitat destruction', 'Low reproduction rates', 'Specific host vine requirements', 'Tourism pressure'],
      'Bengal Tiger': ['Poaching for skins and bones', 'Habitat loss and fragmentation', 'Human-wildlife conflict', 'Prey depletion'],
      'Sea Turtle': ['Plastic pollution and marine debris', 'Fishing net bycatch', 'Beach development destroying nesting sites', 'Climate change affecting sex ratios']
    };


    return threatsInfo[title] || ['Habitat loss and degradation', 'Climate change impacts', 'Human-wildlife conflict', 'Illegal wildlife trade'];
  };


  // Helper function to get conservation efforts
  const getConservationInfo = (title) => {
    const conservationInfo = {
      'Rhinoceros Hornbill': ['Protected forest reserves', 'Community conservation programs', 'Nest box installation', 'Anti-poaching patrols'],
      'Blue Ringed Octopus': ['Marine protected areas', 'Public education about venom risks', 'Sustainable tourism guidelines', 'Coastal habitat protection'],
      'Orangutan': ['Forest conservation and rehabilitation', 'Anti-poaching units', 'Wildlife rescue centers', 'Sustainable palm oil initiatives'],
      'Rafflesia': ['Protected reserves establishment', 'Propagation research programs', 'Eco-tourism management', 'Habitat restoration'],
      'Bengal Tiger': ['Protected tiger reserves', 'Anti-poaching patrols', 'Community-based conservation', 'Wildlife corridor establishment'],
      'Sea Turtle': ['Protected nesting beaches', 'Fishing gear modifications', 'Hatchery programs', 'Plastic pollution reduction']
    };


    return conservationInfo[title] || ['Habitat protection and restoration', 'Research and monitoring programs', 'Community education and engagement', 'International conservation agreements'];
  };

  const fetchAllBadgesData = async () => {
    try {
      console.log("🔄 Fetching badges data for animal classification...");

      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");

      // FIX: Ensure we're using HTTPS and correct base URL
      let baseUrl = API_BASE_URL;
      
      // Ensure HTTPS and remove trailing slashes
      baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
      baseUrl = baseUrl.replace(/^http:\/\//, 'https://'); // Force HTTPS
      
      console.log('🌐 Using base URL:', baseUrl);

      // CORRECT ENDPOINT - based on your API documentation
      const badgesUrl = `${baseUrl}/api/badges/`;
      
      console.log('🎯 Using correct badges endpoint:', badgesUrl);

      try {
        const response = await fetch(badgesUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          // REMOVE credentials to fix CORS issue with wildcard origin
          // credentials: 'include', // ← COMMENT THIS OUT
          mode: 'cors'
        });

        console.log("📡 Badges API response status:", response.status);

        if (response.ok) {
          const badgesData = await response.json();
          console.log("✅ Badges data loaded successfully:", badgesData);
          setAllBadgesData(badgesData);
          return badgesData;
        } else {
          console.warn(`⚠️ Badges API returned status ${response.status}`);
          throw new Error(`Badges API returned ${response.status}`);
        }
      } catch (error) {
        console.warn(`❌ Network error for badges endpoint:`, error.message);
        throw error;
      }

    } catch (error) {
      console.error("❌ Critical error fetching badges data:", error);
      
      // Use comprehensive fallback badges data
      const fallbackBadges = [
        {
          category: "Mammals",
          discovered: ["Tiger", "Lion", "Elephant", "Bear", "Orangutan", "Panther"],
          undiscovered: ["Panda", "Kangaroo", "Dolphin", "Whale"]
        },
        {
          category: "Birds", 
          discovered: ["Eagle", "Hornbill", "Parrot", "Owl"],
          undiscovered: ["Penguin", "Flamingo", "Ostrich", "Swan"]
        },
        {
          category: "Reptiles",
          discovered: ["Snake", "Turtle", "Lizard", "Crocodile"],
          undiscovered: ["Alligator", "Iguana", "Chameleon"]
        },
        {
          category: "Amphibians",
          discovered: ["Frog", "Toad"],
          undiscovered: ["Salamander", "Newt"]
        },
        {
          category: "Fish",
          discovered: ["Shark", "Salmon"],
          undiscovered: ["Tuna", "Goldfish", "Clownfish"]
        },
        {
          category: "Invertebrates",
          discovered: ["Butterfly", "Octopus"],
          undiscovered: ["Spider", "Crab", "Lobster"]
        },
        {
          category: "Unknown",
          discovered: [],
          undiscovered: []
        }
      ];
      
      console.log("🦘 Using fallback badges data");
      setAllBadgesData(fallbackBadges);
      return fallbackBadges;
    }
  };

  // IMPROVED: Use AI classification instead of hardcoded matching
  const findAnimalClassFromBadges = async (speciesName, badgesData) => {
    if (!speciesName) {
      console.log("🦘 No species name, using default 'Unknown'");
      return "Unknown";
    }

    console.log("🔍 AI Classifying species:", speciesName);

    try {
      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      
      // Call the new classification endpoint
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const classificationUrl = `${baseUrl}/scanned-species/classify-species`;
      
      const response = await fetch(classificationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ species_name: speciesName })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success') {
          const aiCategory = result.data.category;
          console.log("✅ AI Classification result:", aiCategory);
          return aiCategory;
        }
      }
      
      // Fallback to frontend classification if AI fails
      console.warn("❌ AI classification failed, using frontend fallback");
      return findAnimalClassFallback(speciesName, badgesData);
      
    } catch (error) {
      console.error("❌ Error calling classification API:", error);
      // Fallback to frontend classification
      return findAnimalClassFallback(speciesName, badgesData);
    }
  };

  // Keep the original fallback function for backup
  const findAnimalClassFallback = (speciesName, badgesData) => {
    if (!badgesData.length) return "Unknown";
    
    const cleanSpeciesName = speciesName.toLowerCase().trim();

    for (const badge of badgesData) {
      const foundInDiscovered = badge.discovered?.find((species) => {
        const cleanBadgeSpecies = species.toLowerCase().trim();
        return (
          cleanBadgeSpecies.includes(cleanSpeciesName) ||
          cleanSpeciesName.includes(cleanBadgeSpecies) ||
          cleanBadgeSpecies === cleanSpeciesName
        );
      });

      const foundInUndiscovered = badge.undiscovered?.find((species) => {
        const cleanBadgeSpecies = species.toLowerCase().trim();
        return (
          cleanBadgeSpecies.includes(cleanSpeciesName) ||
          cleanSpeciesName.includes(cleanBadgeSpecies) ||
          cleanBadgeSpecies === cleanSpeciesName
        );
      });

      if (foundInDiscovered || foundInUndiscovered) {
        console.log("🎯 Found species in animal class (fallback):", badge.category);
        return badge.category;
      }
    }

    return "Unknown";
  };

  const handleRetryBadges = async () => {
    console.log("🔄 Retrying badges data fetch...");
    const badgesData = await fetchAllBadgesData();
    if (badgesData.length) {
      setAllBadgesData(badgesData);
    }
  };

  // UPDATED: Animal class determination
  useEffect(() => {
    const determineAndSetAnimalClass = async () => {
      if (animalData || scannedData) {
        console.log("🦴 Starting animal class determination...");
        
        const speciesData = {
          name: animalData?.name,
          species_id: animalData?.species_id || scannedData?.species_id
        };

        const className = await determineAnimalClass(speciesData);
        console.log("🎯 Final animal class:", className);
        setAnimalClass(className);
      }
    };

    determineAndSetAnimalClass();
  }, [animalData, scannedData, allBadgesData]);

  // UPDATED: Main data loading
  useEffect(() => {
    const loadAnimalData = async () => {
      setIsLoading(true);
      setError(null);


      // Get data from URL parameters
      const dataParam = searchParams.get('data');
      const scannedSpeciesId = searchParams.get('scannedSpeciesId');
      const speciesId = searchParams.get('speciesId');


      // Handle basic data from history page
      const title = searchParams.get('title');
      const image = searchParams.get('image');
      const location = searchParams.get('location');
      const scientificName = searchParams.get('scientificName');
      const endangeredStatus = searchParams.get('endangeredStatus');


      try {
        // Pre-fetch badges data for animal classification
        await fetchAllBadgesData();

        if (scannedSpeciesId && title) {
          console.log('Loading basic data from history page:', { title, scannedSpeciesId });

          const decodedTitle = decodeURIComponent(title);
          const decodedScientificName = scientificName ? decodeURIComponent(scientificName) : 'Unknown Species';
          const decodedEndangeredStatus = endangeredStatus ? decodeURIComponent(endangeredStatus) : 'Unknown';

          // Try to use the actual image from URL parameter, otherwise fetch from API
          let decodedImage = image ? decodeURIComponent(image) : null;

          // If no image from URL, try to fetch the actual scanned image from API
          if (!decodedImage) {
            try {
              const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
              const response = await fetch(`/scanned-species/${scannedSpeciesId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                  decodedImage = result.data.image_url;
                  console.log('📸 Retrieved actual image from API:', decodedImage);
                }
              }
            } catch (error) {
              console.warn('Could not fetch scanned image:', error);
            }
          }

          const decodedLocation = location ? decodeURIComponent(location) : 'Location not specified';

          const basicAnimalData = {
            name: decodedTitle,
            species: decodedScientificName,
            status: decodedEndangeredStatus,
            animal_class: "Unknown", // ← ADD THIS for history page items
            image_url: decodedImage, // Use the actual image
            location: "Malaysia",
            description: `The ${decodedTitle} is a fascinating species that plays an important role in its ecosystem. This information comes from your wildlife scan.`,
            fullDescription: getDetailedDescription(decodedTitle, decodedScientificName, decodedEndangeredStatus),
            habitat: getHabitatInfo(decodedTitle),
            threats: getThreatsInfo(decodedTitle),
            conservation: getConservationInfo(decodedTitle),
            population: getPopulationInfo(decodedEndangeredStatus)
          };

          console.log('🖼 Final animal data with image:', basicAnimalData);
          setAnimalData(basicAnimalData);
          setIsLoading(false);
          return;
        }


        // Handle scanned species ID from API
        if (scannedSpeciesId) {
          await fetchScannedSpeciesData(scannedSpeciesId);
        } else if (speciesId) {
          // Direct species ID - fetch species details directly
          await fetchSpeciesDetails(speciesId);
        } else if (dataParam) {
          // Handle scan result data (from camera scan)
          try {
            const decodedData = decodeURIComponent(dataParam);
            const parsedData = JSON.parse(decodedData);
            // Ensure image_url uses default image if not provided
            if (!parsedData.image_url) {
              parsedData.image_url = getDefaultImage(parsedData.name);
            }
            setAnimalData(parsedData);
          } catch (error) {
            console.error('Error parsing animal data:', error);
            setError('Invalid animal data format');
          }
        } else {
          // No parameters - show error
          setError('No animal data provided');
        }
      } catch (err) {
        console.error('Error loading animal data:', err);
        setError('Failed to load animal data');
      } finally {
        setIsLoading(false);
      }
    };


    loadAnimalData();
  }, [searchParams]);

  const fetchScannedSpeciesData = async (scannedSpeciesId) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      // FIX: Use proper URL construction
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const apiUrl = `${baseUrl}/scanned-species/${scannedSpeciesId}/`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scanned species data');
      }

      const result = await response.json();

      if (result.status === 'success') {
        setScannedData(result.data);
        // Now fetch the species details
        await fetchSpeciesDetails(result.data.species_id);
      } else {
        throw new Error(result.error || 'Failed to load scanned species data');
      }
    } catch (error) {
      console.error('Error fetching scanned species:', error);
      throw error;
    }
  };

  const fetchSpeciesDetails = async (speciesId) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      // FIX: Use proper URL construction
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      
      // Try the scanned-species species endpoint first (more reliable)
      let apiUrl = `${baseUrl}/scanned-species/species/${speciesId}/`;
      
      console.log('🌐 Fetching species details from:', apiUrl);

      let response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If scanned-species endpoint fails, try wildlife API as fallback
        console.log('🔄 Trying wildlife API as fallback...');
        apiUrl = `${baseUrl}/api/wildlife/species/${speciesId}/`;
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch species details');
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Transform the API data to match our component structure
        const transformedData = transformSpeciesData(result.data);
        setAnimalData(transformedData);
      } else {
        throw new Error(result.error || 'Failed to load species details');
      }
    } catch (error) {
      console.error('Error fetching species details:', error);
      throw error;
    }
  };
  
  const transformSpeciesData = (apiData) => {
    // Transform the database fields to match our component structure
    let imageUrl;

    // FIX: Use proper base URL for image construction
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

    if (apiData.image_url) {
      console.log('🖼 Original image URL from API:', apiData.image_url);
      
      let processedImageUrl = apiData.image_url;
      
      // FIX: Replace any localhost:8000 URLs with the correct base URL
      if (processedImageUrl.includes('localhost:8000')) {
        processedImageUrl = processedImageUrl.replace(/http:\/\/localhost:8000/g, baseUrl);
        console.log('🖼 Replaced localhost:8000 with base URL:', processedImageUrl);
        imageUrl = processedImageUrl;
      }
      // If it's a GCP filename (starts with scanned_species_), construct the full URL
      else if (processedImageUrl.startsWith('scanned_species_')) {
        processedImageUrl = `${baseUrl}/scanned-species/image/animal/${processedImageUrl}`;
        console.log('🖼 Constructed GCP image URL:', processedImageUrl);
        imageUrl = processedImageUrl;
      }
      // If it's already a full URL (like Unsplash), use it as-is (but only if it's not localhost)
      else if (processedImageUrl.startsWith('http') && !processedImageUrl.includes('localhost:8000')) {
        console.log('🖼 Using existing full URL:', processedImageUrl);
        imageUrl = processedImageUrl;
      }
      // If it's a relative path, construct full URL
      else if (processedImageUrl.startsWith('/')) {
        imageUrl = `${baseUrl}${processedImageUrl}`;
        console.log('🖼 Constructed relative path URL:', imageUrl);
      }
      // Unknown format, use default
      else {
        imageUrl = getDefaultImage(apiData.common_name);
        console.log('🖼 Using default image due to unknown format:', imageUrl);
      }
    } else {
      // No image URL provided, use default
      imageUrl = getDefaultImage(apiData.common_name);
      console.log('🖼 Using default image (no URL):', imageUrl);
    }

    // DEBUG: Check what the backend returns
    console.log("🔍 Backend API data received:", {
      common_name: apiData.common_name,
      animal_class: apiData.animal_class,
      all_fields: Object.keys(apiData)
    });

    return {
      // Basic info
      name: apiData.common_name,
      species: apiData.scientific_name,
      status: apiData.endangered_status,

      // ✅ ADD THIS: Preserve animal_class from backend
      animal_class: apiData.animal_class || "Unknown",

      // Story and descriptions
      description: apiData.description || `The ${apiData.common_name} is a fascinating species with unique characteristics.`,
      fullDescription: apiData.description || getDetailedDescription(apiData.common_name, apiData.scientific_name, apiData.endangered_status),

      // Habitat information
      habitat: apiData.habitat || getHabitatInfo(apiData.common_name),

      // Threats - convert string to array if needed
      threats: Array.isArray(apiData.threats) ? apiData.threats :
        apiData.threats ? [apiData.threats] :
          getThreatsInfo(apiData.common_name),

      // Conservation efforts - convert string to array if needed
      conservation: Array.isArray(apiData.conservation) ? apiData.conservation :
        apiData.conservation ? [apiData.conservation] :
          getConservationInfo(apiData.common_name),

      // Additional fields from database
      population: getPopulationInfo(apiData.endangered_status),

      // Image handling
      image_url: imageUrl,

      // Keep original API data for reference
      api_response: apiData.api_response,
      animal_class_id: apiData.animal_class_id
    };
  };

  //
  const formatLocation = () => {
    return 'Malaysia';
  };

  const getStatusBadgeColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('critically endangered')) return 'bg-red-500';
    if (statusLower.includes('endangered')) return 'bg-orange-500';
    if (statusLower.includes('vulnerable')) return 'bg-yellow-500';
    if (statusLower.includes('near threatened')) return 'bg-blue-500';
    if (statusLower.includes('least concern')) return 'bg-green-500';
    return 'bg-gray-500';
  };


  const handleBackClick = () => {
    router.back();
  };


  const handleExpandableOpen = (section) => {
    console.log(`${section} section opened`);
  };


  const handleExpandableClose = (section) => {
    console.log(`${section} section closed`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading animal data...</p>
        </div>
      </div>
    );
  }


  if (error || !animalData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <p className="text-gray-600 mb-4">{error || 'Animal data not found.'}</p>
          <button
            onClick={handleBackClick}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="max-w-md mx-auto min-h-screen pb-20">

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/species">Species</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{animalData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Image Section with parallax effect */}
        <div className="relative w-full h-80 overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 z-10"></div>
          {/* Image with ken burns effect */}
          <div className={`absolute inset-0 transition-all duration-700 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
            {animalData.image_url ? (
              <img
                src={animalData.image_url}
                alt={animalData.name}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  // Fallback to default image if the current one fails
                  e.target.src = getDefaultImage(animalData.name);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500">
                <span className="text-9xl">🐆</span>
              </div>
            )}
          </div>

          {/* Scan timestamp for history items */}
          {scannedData && (
            <div className="absolute bottom-4 left-4 z-20">
              <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                Scanned: {new Date(scannedData.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Main Content Card with floating effect */}
        <div className="relative -mt-8 animate-fade-in">
          <div className="rounded-3xl overflow-hidden">
            {/* Header Section */}
            <div className="px-6 pt-6 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1 leading-tight">
                {animalData.name}
              </h1>
              <p className="text-gray-600 text-sm italic mb-3">{animalData.species}</p>

              {/* Badges with pill design */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  {animalClass}
                </span>

                <span className={`inline-flex items-center gap-1.5 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md ${getStatusBadgeColor(animalData.status)}`}>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  {animalData.status || "Status Unknown"}
                </span>
              </div>

              {/* Location with icon */}
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                📍 {formatLocation()}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            {/* Accordion Sections */}
            <div className="p-6 space-y-3">
              {/* Description */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <AccordionItem
                  title="Description"
                  onOpen={() => handleExpandableOpen("Description")}
                  onClose={() => handleExpandableClose("Description")}
                  bgColor="bg-gradient-to-br from-emerald-50 to-teal-50"
                  borderColor="border-emerald-200"
                  hoverBorderColor="hover:border-emerald-300"
                  titleColor="text-emerald-800"
                  descriptionColor="text-emerald-700"
                  chevronColor="text-emerald-500"
                  chevronHoverColor="group-hover:text-emerald-600"
                  closeButtonBg="bg-gradient-to-r from-emerald-500 to-teal-500"
                  closeButtonHoverBg="hover:shadow-lg"
                  textHoverColor="group-hover:text-emerald-800"
                  preview={animalData.description}
                  buttonTextColor="text-emerald-700"
                >
                  <div className="space-y-4">
                    <div className="pb-3">
                      <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                        {animalData.fullDescription}
                      </p>
                    </div>
                  </div>
                </AccordionItem>
              </div>

              {/* Habitat */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <AccordionItem
                  title="Habitat"
                  onOpen={() => handleExpandableOpen("Habitat")}
                  onClose={() => handleExpandableClose("Habitat")}
                  bgColor="bg-gradient-to-br from-amber-50 to-yellow-50"
                  borderColor="border-amber-200"
                  hoverBorderColor="hover:border-amber-300"
                  titleColor="text-amber-800"
                  descriptionColor="text-amber-700"
                  chevronColor="text-amber-500"
                  chevronHoverColor="group-hover:text-amber-600"
                  closeButtonBg="bg-gradient-to-r from-amber-500 to-yellow-500"
                  closeButtonHoverBg="hover:shadow-lg"
                  textHoverColor="group-hover:text-amber-800"
                >
                  <div className="space-y-2 mb-2">
                    <div className="pb-3">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {animalData.habitat}
                      </p>
                    </div>
                  </div>
                </AccordionItem>
              </div>

              {/* Major Threats */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <AccordionItem
                  title="Major Threats"
                  onOpen={() => handleExpandableOpen("Threats")}
                  onClose={() => handleExpandableClose("Threats")}
                  bgColor="bg-gradient-to-br from-rose-50 to-red-50"
                  borderColor="border-rose-200"
                  hoverBorderColor="hover:border-rose-300"
                  titleColor="text-rose-800"
                  descriptionColor="text-rose-700"
                  chevronColor="text-rose-500"
                  chevronHoverColor="group-hover:text-rose-600"
                  closeButtonBg="bg-gradient-to-r from-rose-500 to-red-500"
                  closeButtonHoverBg="hover:shadow-lg"
                  textHoverColor="group-hover:text-rose-800"
                >
                  <div className="space-y-2 mb-2">
                    {animalData.threats.map((threat, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-rose-100 transform transition-all duration-200 hover:shadow-md hover:border-rose-200"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-rose-500 to-red-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="text-gray-700 text-base leading-relaxed flex-1">
                          {threat}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </div>

              {/* Conservation Efforts */}
              <div className="transform transition-all duration-300 hover:scale-[1.01]">
                <AccordionItem
                  title="Conservation Efforts"
                  onOpen={() => handleExpandableOpen("Conservation")}
                  onClose={() => handleExpandableClose("Conservation")}
                  bgColor="bg-gradient-to-br from-sky-50 to-blue-50"
                  borderColor="border-sky-200"
                  hoverBorderColor="hover:border-sky-300"
                  titleColor="text-sky-800"
                  descriptionColor="text-sky-700"
                  chevronColor="text-sky-500"
                  chevronHoverColor="group-hover:text-sky-600"
                  closeButtonBg="bg-gradient-to-r from-sky-500 to-blue-500"
                  closeButtonHoverBg="hover:shadow-lg"
                  textHoverColor="group-hover:text-sky-800"
                >
                  <div className="space-y-2 mb-2">
                    {animalData.conservation.map((effort, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-sky-100 transform transition-all duration-200 hover:shadow-md hover:border-sky-200"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-gray-700 text-base leading-relaxed flex-1">
                          {effort}
                        </span>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

const AnimalCard = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AnimalCardContent />
    </Suspense>
  );
};

export default AnimalCard;