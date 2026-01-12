"use client";
import BadgeCard from "@/app/components/BadgeCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose 
} from '@/components/ui/sheet';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/Breadcrumb';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define all badge categories that should be displayed
const ALL_BADGE_CATEGORIES = [
  { id: 'birds', category: 'Birds', icon: '🐦', totalSpecies: 742 },
  { id: 'mammals', category: 'Mammals', icon: '🐾', totalSpecies: 286 },
  { id: 'amphibians', category: 'Amphibians', icon: '🐸', totalSpecies: 242 },
  { id: 'reptiles', category: 'Reptiles', icon: '🦎', totalSpecies: 567 },
  { id: 'fish', category: 'Fish', icon: '🐠', totalSpecies: 1951 },
  { id: 'arachnids', category: 'Arachnids', icon: '🕷️', totalSpecies: 950 },
  { id: 'plants', category: 'Plants', icon: '🌿', totalSpecies: 100 },
  { id: 'mollusks', category: 'Mollusks', icon: '🐌', totalSpecies: 378 },
  { id: 'insects', category: 'Insects', icon: '🦋', totalSpecies: 1000 }
];

const BadgesPage = () => {
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch badges from backend
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Starting badges API call...');
        
        const response = await fetch(`${API_BASE_URL}/api/badges/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend badges data:', data);
          setBadges(data); // Use backend data directly
        } else {
          const errorText = await response.text();
          console.log('❌ API failed with status:', response.status);
          setError(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.log('❌ Network error:', error);
        setError(`Network Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  // NEW: Enhance badges data with AI classification (same as animal page)
  const enhanceBadgesWithAIClassification = async (badgesData) => {
    if (!badgesData || !badgesData.length) return badgesData;

    try {
      console.log("🤖 Enhancing badges with AI classification...");
      
      const enhancedBadges = await Promise.all(
        badgesData.map(async (badge) => {
          // For each discovered species, use AI classification to ensure correct animal class
          const classifiedDiscovered = await Promise.all(
            (badge.discovered || []).map(async (speciesName) => {
              const animalClass = await classifySpeciesWithAI(speciesName);
              return {
                name: speciesName,
                animal_class: animalClass
              };
            })
          );

          return {
            ...badge,
            discovered: classifiedDiscovered,
            // Ensure the badge category matches the AI classification
            verified_category: await verifyBadgeCategory(badge.category, classifiedDiscovered)
          };
        })
      );

      console.log("✅ Enhanced badges with AI:", enhancedBadges);
      return enhancedBadges;

    } catch (error) {
      console.error("❌ Error enhancing badges with AI:", error);
      return badgesData; // Return original data if AI fails
    }
  };

  // NEW: AI Classification function (same as animal page)
  const classifySpeciesWithAI = async (speciesName) => {
    if (!speciesName) return "Unknown";

    console.log("🔍 AI Classifying species:", speciesName);

    try {
      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      
      // Call the classification endpoint (same as animal page)
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
          console.log("✅ AI Classification result for", speciesName, ":", aiCategory);
          return aiCategory;
        }
      }
      
      // Fallback to frontend classification if AI fails
      console.warn("❌ AI classification failed for", speciesName, ", using frontend fallback");
      return classifySpeciesFallback(speciesName);
      
    } catch (error) {
      console.error("❌ Error calling classification API for", speciesName, ":", error);
      return classifySpeciesFallback(speciesName);
    }
  };

  // Fallback classification (similar to animal page)
  const classifySpeciesFallback = (speciesName) => {
    const cleanName = speciesName.toLowerCase().trim();
    
    // Bird patterns (Shoebill should match here)
    const birdKeywords = ['bird', 'eagle', 'owl', 'hawk', 'hornbill', 'parrot', 'penguin', 'flamingo', 'sparrow', 'crow', 'raven', 'pigeon', 'duck', 'goose', 'swan', 'stork', 'heron', 'kingfisher', 'woodpecker', 'hummingbird', 'shoebill'];
    if (birdKeywords.some(keyword => cleanName.includes(keyword))) return "Birds";

    // Mammal patterns
    const mammalKeywords = ['tiger', 'lion', 'elephant', 'bear', 'wolf', 'fox', 'deer', 'monkey', 'ape', 'gorilla', 'chimpanzee', 'orangutan', 'whale', 'dolphin', 'bat', 'rodent', 'squirrel', 'rabbit', 'kangaroo', 'koala'];
    if (mammalKeywords.some(keyword => cleanName.includes(keyword))) return "Mammals";

    // Reptile patterns
    const reptileKeywords = ['snake', 'lizard', 'turtle', 'tortoise', 'crocodile', 'alligator', 'gecko', 'iguana', 'chameleon', 'dinosaur'];
    if (reptileKeywords.some(keyword => cleanName.includes(keyword))) return "Reptiles";

    // Amphibian patterns
    const amphibianKeywords = ['frog', 'toad', 'salamander', 'newt'];
    if (amphibianKeywords.some(keyword => cleanName.includes(keyword))) return "Amphibians";

    // Fish patterns
    const fishKeywords = ['fish', 'shark', 'salmon', 'tuna', 'trout', 'goldfish', 'clownfish', 'eel', 'ray', 'stingray'];
    if (fishKeywords.some(keyword => cleanName.includes(keyword))) return "Fish";

    // Insect patterns
    const insectKeywords = ['butterfly', 'bee', 'ant', 'beetle', 'ladybug', 'dragonfly', 'mosquito', 'fly', 'grasshopper', 'cricket'];
    if (insectKeywords.some(keyword => cleanName.includes(keyword))) return "Insects";

    return "Unknown";
  };

  // Verify badge category matches AI classification
  const verifyBadgeCategory = async (badgeCategory, discoveredSpecies) => {
    if (!discoveredSpecies.length) return badgeCategory;

    // Check if all species in this badge actually belong to this category
    const mismatches = discoveredSpecies.filter(species => 
      species.animal_class && species.animal_class.toLowerCase() !== badgeCategory.toLowerCase()
    );

    if (mismatches.length > 0) {
      console.warn(`⚠️ Category mismatch in ${badgeCategory}:`, mismatches);
      // You could implement automatic category correction here
    }

    return badgeCategory;
  };

  // Helper function to calculate progress to next level
  const getProgressToNextLevel = (discoveredCount) => {
    if (discoveredCount >= 11) {
      return { text: "Gold level achieved!", progress: 100 };
    } else if (discoveredCount >= 6) {
      const neededForGold = 11 - discoveredCount;
      return { text: `${neededForGold} more for Gold`, progress: Math.round((discoveredCount / 11) * 100) };
    } else if (discoveredCount >= 1) {
      const neededForSilver = 6 - discoveredCount;
      return { text: `${neededForSilver} more for Silver`, progress: Math.round((discoveredCount / 6) * 100) };
    } else {
      return { text: "Discover your first species!", progress: 0 };
    }
  };

  // Helper function with COUNT-based thresholds
  const getBadgeLevel = (discoveredCount, total) => {
    if (discoveredCount >= 11) return { 
      level: 'Gold', 
      color: 'from-yellow-200 to-yellow-500 drop-shadow-sm', 
      textColor: 'text-amber-600', 
      bgColor: 'bg-yellow-50' 
    };
    if (discoveredCount >= 6) return { 
      level: 'Silver', 
      color: 'from-gray-200 to-gray-400 drop-shadow-sm', 
      textColor: 'text-gray-600', 
      bgColor: 'bg-gray-50' 
    };
    if (discoveredCount >= 1) return { 
      level: 'Bronze', 
      color: 'from-amber-200 to-amber-800 drop-shadow-sm', 
      textColor: 'text-orange-600', 
      bgColor: 'bg-amber-50' 
    };
    return { 
      level: 'Locked', 
      color: 'from-gray-200 to-gray-300', 
      textColor: 'text-gray-400', 
      bgColor: 'bg-gray-100' 
    };
  };

  // Merge API badges with all categories - ENHANCED VERSION
  const mergedBadges = ALL_BADGE_CATEGORIES.map(category => {
    // Find matching badge from API (case-insensitive)
    const apiBadge = badges.find(badge => 
      badge.category.toLowerCase() === category.category.toLowerCase() ||
      (badge.verified_category && badge.verified_category.toLowerCase() === category.category.toLowerCase())
    );
    
    console.log(`🔍 Matching ${category.category}:`, { 
      foundInAPI: !!apiBadge,
      discoveredSpecies: apiBadge?.discoveredSpecies,
      verifiedCategory: apiBadge?.verified_category
    });

    if (apiBadge) {
      // Use API data if available
      const progressInfo = getProgressToNextLevel(apiBadge.discoveredSpecies);
      
      // Extract just species names for display (maintain AI classification data internally)
      const discoveredSpeciesNames = Array.isArray(apiBadge.discovered) 
        ? apiBadge.discovered.map(species => typeof species === 'object' ? species.name : species)
        : [];

      return {
        ...category,
        // Use API data for species counts and lists
        totalSpecies: apiBadge.totalSpecies,
        discoveredSpecies: apiBadge.discoveredSpecies,
        discovered: discoveredSpeciesNames,
        undiscovered: apiBadge.undiscovered || [],
        // Progress information
        progressText: progressInfo.text,
        progressPercentage: progressInfo.progress,
        // Keep our predefined icon
        icon: category.icon,
        // Store AI classification data for debugging
        _aiEnhanced: true
      };
    } else {
      // Return locked badge if no API data
      return {
        ...category,
        discoveredSpecies: 0,
        discovered: [],
        undiscovered: [],
        progressText: "Discover your first species!",
        progressPercentage: 0,
        _aiEnhanced: false
      };
    }
  });

  // Sort badges: unlocked first (by percentage), then locked badges
  const sortedBadges = [...mergedBadges].sort((a, b) => {
    if (a.discoveredSpecies > 0 && b.discoveredSpecies > 0) {
      const percentageA = (a.discoveredSpecies / a.totalSpecies) * 100;
      const percentageB = (b.discoveredSpecies / b.totalSpecies) * 100;
      return percentageB - percentageA;
    }
    if (a.discoveredSpecies > 0 && b.discoveredSpecies === 0) return -1;
    if (a.discoveredSpecies === 0 && b.discoveredSpecies > 0) return 1;
    return 0;
  });

  console.log('🎯 Final merged badges:', sortedBadges);

  const handleBadgeClick = (badge) => {
    // Only allow clicking on unlocked badges
    if (badge.discoveredSpecies > 0) {
      setSelectedBadge(badge);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading badges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-2">Failed to load badges</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto pb-20">

        {/* Header */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Badges</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Badges Grid */}
        <div className="px-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            {sortedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={handleBadgeClick}
                isLocked={badge.discoveredSpecies === 0}
                progressText={badge.progressText}
                progressPercentage={badge.progressPercentage}
              />
            ))}
          </div>
        </div>

        {/* Badge Details Sheet - Only for unlocked badges */}
        <Sheet open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
          <SheetContent side="bottom" className="p-0 bg-white border border-emerald-100 max-w-[430px] mx-auto h-[80vh]">
            {selectedBadge && selectedBadge.discoveredSpecies > 0 && (
              <div className="flex flex-col h-full p-6 max-w-[430px] mx-auto w-full bg-white">
                <SheetHeader className="text-left border-b border-emerald-100 pb-4 mb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBadgeLevel(selectedBadge.discoveredSpecies, selectedBadge.totalSpecies).color} flex items-center justify-center text-3xl shadow-lg`}>
                      {selectedBadge.icon}
                    </div>
                    <div>
                      <SheetTitle className="text-emerald-700 text-2xl font-bold">{selectedBadge.category}</SheetTitle>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getBadgeLevel(selectedBadge.discoveredSpecies, selectedBadge.totalSpecies).textColor} ${getBadgeLevel(selectedBadge.discoveredSpecies, selectedBadge.totalSpecies).bgColor} border border-current`}>
                        {getBadgeLevel(selectedBadge.discoveredSpecies, selectedBadge.totalSpecies).level} Badge
                      </div>
                    </div>
                  </div>
                  {/* Show progress to next level */}
                  <SheetDescription className="text-emerald-600">
                    {selectedBadge.discoveredSpecies} species discovered
                  </SheetDescription>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {getProgressToNextLevel(selectedBadge.discoveredSpecies).text}
                    </p>
                  </div>
                </SheetHeader>
                
                <div className="py-2 flex-grow overflow-y-auto">
                  {/* Discovered Species */}
                  <div>
                    <h3 className="font-bold text-lg text-emerald-700 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Discovered ({selectedBadge.discovered.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedBadge.discovered.map((species, idx) => (
                        <div key={idx} className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <p className="text-gray-800 font-medium">✓ {species}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-emerald-100">
                  <SheetClose asChild>
                    <button className="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                      Close
                    </button>
                  </SheetClose>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default BadgesPage;