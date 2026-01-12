"use client";

import ProfileButton from "@/app/components/ProfileButton";
import SmallBox from "@/app/components/SmallBox";
import { useRouter } from "next/navigation";
import {
  Bird,
  Calendar,
  Star,
  Coins,
  ChevronRight,
  BookOpen,
  Brain,
  Zap,
  Trophy,
  Award,
  Users,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const Dashboard = () => {
  const router = useRouter();
  const [factIndex, setFactIndex] = useState(0);
  const [displayedFactIndex, setDisplayedFactIndex] = useState(0);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    speciesCount: 0,
    userRank: 0,
    badgesCount: 0
  });

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

  const [latestSpecies, setLatestSpecies] = useState(null);
  const intervalRef = useRef(null);
  const [isFactAnimatingOut, setIsFactAnimatingOut] = useState(false);

  const funFacts = [
    "Sea turtles always swim back to the same beach where they were born to lay their eggs!",
    "Some sea turtles can hold their breath for up to 5 hours underwater.",
    "The temperature of the sand determines the gender of sea turtle hatchlings.",
    "Hornbills are known as 'farmers of the forest' because they help disperse seeds.",
    "A hornbill's casque amplifies their calls which can be heard up to 1 km away.",
  ];

  const randomFact = funFacts[displayedFactIndex];
  const ANIMATION_DURATION = 300;

  // Function to format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Function to format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const fetchUserProfile = async (userId, token) => {
    try {
      console.log("📤 Fetching user profile for ID:", userId);
      
      // Validate inputs
      if (!userId || !token) {
        console.error("❌ Missing user ID or token");
        throw new Error("Missing authentication data");
      }

      const res = await fetch(`${API_BASE_URL}/users/profile/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error(`❌ HTTP error! status: ${res.status}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const userData = await res.json();
      console.log("✅ User profile fetched:", userData);
      setUserData(userData);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      
      // Use stored data as fallback
      const storedUser = JSON.parse(localStorage.getItem("user_data") || '{}');
      setUserData({
        id: userId,
        currency: storedUser.currency || 0,
        first_name: storedUser.first_name || "User",
        email: storedUser.email || ""
      });
    }
  };

  // Fetch user stats AND latest scanned species from backend
  const fetchUserStats = async (userId, token) => {
    try {
      console.log("📊 Fetching user stats...");

      // Fetch scanned species count AND data
      const scannedSpeciesRes = await fetch(`${API_BASE_URL}/scanned-species/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let speciesCount = 0;
      let scannedSpeciesData = [];

      if (scannedSpeciesRes.ok) {
        const scannedData = await scannedSpeciesRes.json();
        speciesCount = scannedData.count || 0;
        scannedSpeciesData = scannedData.data || [];
        console.log("✅ Scanned species count:", speciesCount);
        console.log("✅ Scanned species data:", scannedSpeciesData);

        // Get the latest scanned species
        if (scannedSpeciesData.length > 0) {
          const latest = scannedSpeciesData[0];
          console.log("🖼 Latest species image_url from API:", latest.image_url);

          // FIX: Transform image_url to full Cloud Run URL
          const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          let imageUrl = latest.image_url;
          
          // FIX: Replace any localhost:8000 URLs with the correct base URL
          if (imageUrl && imageUrl.includes('localhost:8000')) {
            imageUrl = imageUrl.replace(/http:\/\/localhost:8000/g, baseUrl);
            console.log("✅ Replaced localhost:8000 with base URL:", imageUrl);
          }
          // If it's a GCP filename (starts with scanned_species_), construct the full URL
          else if (imageUrl && imageUrl.startsWith('scanned_species_')) {
            imageUrl = `${baseUrl}/scanned-species/image/animal/${imageUrl}`;
            console.log("✅ Transformed image URL:", imageUrl);
          }
          // If it's already a full URL (but not localhost), use it as-is
          else if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost:8000')) {
            console.log("✅ Using existing full URL:", imageUrl);
          }
          // If it's a relative path, construct full URL
          else if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${baseUrl}${imageUrl}`;
            console.log("✅ Constructed relative path URL:", imageUrl);
          }
          // If no image URL, use fallback
          else if (!imageUrl) {
            imageUrl = getDefaultImage(latest.common_name);
            console.log("🔄 Using fallback image:", imageUrl);
          }

          setLatestSpecies({
            id: latest.id,
            title: latest.common_name || 'Unknown Species',
            image: imageUrl,
            location: latest.location || 'Location not recorded',
            scannedAt: latest.created_at,
            scientificName: latest.scientific_name,
            endangeredStatus: latest.endangered_status,
            species_id: latest.species_id,
            verified: latest.verified
          });
        }
      }

      // Fetch user rank
      let userRank = 0;
      try {
        const rankRes = await fetch(`${API_BASE_URL}/users/rankings/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (rankRes.ok) {
          const rankData = await rankRes.json();
          userRank = rankData.rank || 0;
          console.log("✅ User rank:", userRank);
        }
      } catch (rankError) {
        console.warn("⚠️ Could not fetch user rank:", rankError);
      }

      // Fetch badges progress summary
      let badgesCount = 0;
      try {
        const badgesRes = await fetch(`${API_BASE_URL}/api/badges/progress/summary`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (badgesRes.ok) {
          const badgesData = await badgesRes.json();
          badgesCount = badgesData.unlockedBadges || 0;
          console.log("✅ Unlocked badges:", badgesCount);
        }
      } catch (badgesError) {
        console.warn("⚠️ Could not fetch badges:", badgesError);
      }

      // Update stats state
      setStats({
        speciesCount,
        userRank,
        badgesCount
      });

      console.log("📊 Final stats:", { speciesCount, userRank, badgesCount });

    } catch (error) {
      console.error("❌ Error fetching user stats:", error);
    }
  };

  // Enhanced refresh function
  const refreshAllData = async () => {
    try {
      setIsRefreshing(true);
      const authToken = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("current_user_id");

      if (authToken && userId) {
        console.log("🔄 Refreshing all user data...");
        await fetchUserProfile(userId, authToken);
        await fetchUserStats(userId, authToken);
        console.log("✅ Data refresh complete");
      }
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    await refreshAllData();
  };

  // NEW: Handle click on latest species - navigate to animal page
  const handleLatestSpeciesClick = () => {
    if (latestSpecies) {
      const queryParams = new URLSearchParams({
        scannedSpeciesId: latestSpecies.id,
        title: latestSpecies.title,
        image: latestSpecies.image,
        location: latestSpecies.location
      });

      if (latestSpecies.scientificName) {
        queryParams.append('scientificName', latestSpecies.scientificName);
      }
      if (latestSpecies.endangeredStatus) {
        queryParams.append('endangeredStatus', latestSpecies.endangeredStatus);
      }

      router.push(`/animal?${queryParams.toString()}`);
    }
  };

  // NEW: Handle view details for empty state
  const handleViewDetails = () => {
    router.push("/species");
  };

  // Initialize data on component mount
  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("user_data");
    const authToken = localStorage.getItem("auth_token");
    const userId = localStorage.getItem("current_user_id");

    console.log("🔄 Loading user data:", { storedUserData, authToken, userId });

    const initializeData = async () => {
      if (storedUserData) {
        try {
          const user = JSON.parse(storedUserData);
          setUserData(user);
          console.log("✅ User data loaded:", user);
        } catch (error) {
          console.error("❌ Error parsing user data:", error);
        }
      }

      if (authToken && userId) {
        // If we have token but no user data, fetch from backend
        if (!storedUserData) {
          await fetchUserProfile(userId, authToken);
        }
        // Always fetch stats
        await fetchUserStats(userId, authToken);
      } else {
        // No user logged in, redirect to login
        console.log("❌ No user data found, redirecting to login");
        router.push("/login");
        return;
      }

      // Initialize with a random index for the first load
      const initialIndex = Math.floor(Math.random() * funFacts.length);
      setFactIndex(initialIndex);
      setDisplayedFactIndex(initialIndex);
      setIsLoading(false);
    };

    initializeData();
  }, [router]);

  // AUTO-REFRESH FUNCTIONALITY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("🔄 Page became visible, refreshing user data...");
        refreshAllData();
      }
    };

    const handleFocus = () => {
      console.log("🔄 Page gained focus, refreshing user data...");
      refreshAllData();
    };

    // Refresh when navigating back to home
    const handleRouteChange = (url) => {
      if (url === '/' || url.includes('/home')) {
        console.log("🔄 Navigated to home, refreshing data...");
        refreshAllData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    // Listen for route changes
    if (router.events) {
      router.events.on('routeChangeComplete', handleRouteChange);
    }

    // Refresh data when component mounts
    refreshAllData();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (router.events) {
        router.events.off('routeChangeComplete', handleRouteChange);
      }
    };
  }, [router]);

  // Simple solution - also refresh every time component mounts
  useEffect(() => {
    console.log("🔄 Homepage mounted, refreshing data...");
    refreshAllData();
  }, []);

  // NEW FUNCTION: Handles the transition logic
  const animateAndGoToNextFact = () => {
    // 1. Start the fade-out animation
    setIsFactAnimatingOut(true);

    // 2. Schedule the fact text to change AFTER the animation duration
    const factChangeTimer = setTimeout(() => {
      // Calculate the new fact index
      setFactIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % funFacts.length;
        // Update the displayed fact index to the new value
        setDisplayedFactIndex(newIndex);
        return newIndex;
      });

      // 3. Schedule the fade-in animation to start AFTER the text has changed
      const fadeInTimer = setTimeout(() => {
        setIsFactAnimatingOut(false);
      }, 50);

      return () => clearTimeout(fadeInTimer);
    }, ANIMATION_DURATION);

    return () => clearTimeout(factChangeTimer);
  };

  // 💡 Function to handle the click on the trivia card
  const handleTriviaClick = () => {
    // Clear the automatic interval when the user clicks
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Use the new animate function
    animateAndGoToNextFact();

    // Restart the interval
    intervalRef.current = setInterval(() => {
      animateAndGoToNextFact();
    }, 6000);
  };

  // Cycling trivia - Updated useEffect to use the new animation function
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up the new interval and store its ID in the ref
    intervalRef.current = setInterval(() => {
      animateAndGoToNextFact();
    }, 6000);

    // Clear the interval when the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [funFacts.length]);

  const handleRedeemPoints = () => {
    router.push("/rewards");
  };

  const handleEarnMorePoints = () => {
    router.push("/learn");
  };

  const handleSpeciesClick = () => {
    router.push("/species");
  };

  const handleRankClick = () => {
    router.push("/leaderboard");
  };

  const handleBadgesClick = () => {
    router.push("/badges");
  };

  const handleFlashCardsClick = () => {
    router.push("/flash-card");
  };

  const handleQuizClick = () => {
    router.push("/quiz");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user data
  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Please Log In
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view this page.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Refresh Loading Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-emerald-500 h-1 w-full">
            <div className="bg-emerald-300 h-1 animate-pulse"></div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto min-h-screen pb-20 px-2">
        {/* Header with Profile Button */}
        <div className="pt-3 px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome Back, {userData.first_name || "User"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {userData.email || "Ready to explore?"}
            </p>
          </div>
          <ProfileButton onClick={() => router.push("/profile")} />
        </div>

        {/* Main Content */}
        <div className="px-6 pt-3">
          {/* Daily Trivia Card */}
          <div className="mb-6 flex items-start space-x-0.5 h-50">
            {/* Mascot Section */}
            <div className="flex flex-col items-center flex-shrink-0 my-auto">
              <img
                src={isFactAnimatingOut ? "/semai-elephant-trivia.png" : "/semai-elephant-trivia2.png"}
                alt="SEMAI Elephant"
                className="w-32 h-32 object-contain"
              />
            </div>

            {/* Speech Bubble */}
            <button
              key={factIndex}
              onClick={handleTriviaClick}
              className={`
              relative text-left
              bg-gradient-to-br from-yellow-50 to-pink-50
              border border-yellow-500
              rounded-2xl p-4 shadow-sm flex-1 my-auto max-h-full
              cursor-pointer
              transition-all duration-300 ease-in-out
              ${isFactAnimatingOut
                  ? "scale-90 opacity-0"
                  : "scale-100 opacity-100"
                }
            `.replace(/\s+/g, " ").trim()}
            >
              {/* Speech bubble tail - Border */}
              <div
                className="absolute left-0 top-1/2 -translate-x-3 w-0 h-0
                border-t-[10px] border-t-transparent
                border-b-[10px] border-b-transparent
                border-r-[12px]
                border-r-yellow-500"
              ></div>

              {/* Speech bubble tail - Fill */}
              <div
                className="absolute left-0 top-101/200 -translate-x-[11px] w-0 h-0
                border-t-[9px] border-t-transparent
                border-b-[9px] border-b-transparent
                border-r-[12px]
                border-r-yellow-50"
              ></div>

              {/* Content */}
              <h3 className="text-base font-bold text-gray-900 mb-1 italic">
                Did you know?
              </h3>
              <p className="text-gray-900 text-base leading-7 italic">
                "{randomFact}"
              </p>
              <div className="absolute bottom-2 right-2 p-1 rounded-full group-hover:bg-yellow-200 transition-colors">
                <ChevronRight className="w-4 h-4 text-yellow-600" />
              </div>
            </button>
          </div>

          {/* Species, Rank, Badges Buttons - NOW SYNCED WITH DATABASE */}
          <div className="flex justify-between items-center mb-6 px-5 py-3 border-b border-t border-gray-100">
            <button
              onClick={handleSpeciesClick}
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center mb-1">
                <Users className="w-4 h-4 text-emerald-500 mr-2" />
                <span className="text-lg font-bold text-gray-900">
                  {formatNumber(stats.speciesCount)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Species
                </span>
                <span className="text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">
                  &gt;
                </span>
              </div>
            </button>

            <button
              onClick={handleRankClick}
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center mb-1">
                <Trophy className="w-4 h-4 text-amber-500 mr-2" />
                <span className="text-lg font-bold text-gray-900">
                  {stats.userRank > 0 ? `#${formatNumber(stats.userRank)}` : "N/A"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-900 group-hover:text-amber-600 transition-colors">
                  Rank
                </span>
                <span className="text-sm text-gray-900 group-hover:text-amber-600 transition-colors">
                  &gt;
                </span>
              </div>
            </button>

            <button
              onClick={handleBadgesClick}
              className="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="flex items-center mb-1">
                <Award className="w-4 h-4 text-pink-500 mr-2" />
                <span className="text-lg font-bold text-gray-900">
                  {formatNumber(stats.badgesCount)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-900 group-hover:text-purple-600 transition-colors">
                  Badges
                </span>
                <span className="text-sm text-gray-900 group-hover:text-purple-600 transition-colors">
                  &gt;
                </span>
              </div>
            </button>
          </div>

          {/* Your Discoveries Card*/}
          <div
            className="
            bg-gradient-to-br from-emerald-50 to-gray-50
            border border-emerald-300
            rounded-2xl p-4 px-6 mb-6 text-gray-900 shadow-sm"
          >
            <h2 className="text-lg font-bold mb-3">Your Discoveries</h2>

            {latestSpecies ? (
              // Show latest scanned species
              <div
                className="flex items-start space-x-4 mb-4 cursor-pointer"
                onClick={handleLatestSpeciesClick}
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-emerald-200">
                  <img
                    src={latestSpecies.image}
                    alt={latestSpecies.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = getDefaultImage(latestSpecies.title);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {latestSpecies.title}
                  </h2>
                  {/* {latestSpecies.scientificName && (
                    <p className="text-sm text-gray-500 italic">{latestSpecies.scientificName}</p>
                  )} */}
                  <div className="flex mt-1 space-x-2 text-gray-500">
                    <span className="text-sm">📍 {latestSpecies.location}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Scanned on {formatDate(latestSpecies.scannedAt)}
                  </p>
                </div>
              </div>
            ) : (
              // Show empty state if no scans yet
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bird className="w-10 h-10 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    No Discoveries Yet
                  </h2>
                  <p className="text-sm text-gray-500">Start scanning wildlife to build your collection!</p>
                  <div className="flex mt-1 space-x-2 text-gray-500">
                    <span className="text-sm">Scan your first species</span>
                  </div>
                </div>
              </div>
            )}

            {/* CENTERED View Details Button */}
            <div className="flex justify-end">
              <button
                onClick={latestSpecies ? handleLatestSpeciesClick : handleViewDetails}
                className="flex items-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
              >
                {latestSpecies ? "View Details" : "Start Scanning"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Discovery Currency Card */}
          <div
            className="
          bg-gradient-to-br from-emerald-50 to-gray-50
          border border-emerald-300
          rounded-2xl p-4 px-6 mb-6 text-gray-900 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Discovery Coins</h2>
              <Coins className="w-6 h-6" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatNumber(userData.currency || 0)} coins
                </div>
              </div>
              <button
                onClick={handleRedeemPoints}
                className="
                  bg-gradient-to-br from-gray-50 to-gray-50
                  border border-emerald-500
                  py-2 px-4 rounded-lg font-semibold transition-colors
                  text-emerald-600 text-sm"
              >
                Redeem
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleEarnMorePoints}
                className="flex items-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors"
              >
                Earn More Coins
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Flash Cards and Quiz Boxes */}
          {/* <div className="grid grid-cols-2 gap-4 mt-6">
            <SmallBox
              icon={BookOpen}
              border="border border-yellow-500"
              gradientFrom="from-yellow-50"
              gradientTo="to-pink-50"
              iconColor="text-amber-300"
              title="Flash Cards"
              value="Learn"
              onClick={handleFlashCardsClick}
            />

            <SmallBox
              icon={Brain}
              border="border border-pink-500"
              gradientFrom="from-pink-50"
              gradientTo="to-gray-50"
              iconColor="text-pink-300"
              title="Quiz"
              value="Challenge"
              onClick={handleQuizClick}
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;