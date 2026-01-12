// profile/page.jsx
"use client";

import ExpandableBox from '../../components/ExpandableBox';
import EditButton from '../../components/EditButton';
import InputBox from '../../components/InputBox';
import SmallBox from '../../components/SmallBox';
import SectionDivider from '@/app/components/SectionDivider';
import { Calendar22 } from '../../components/Calander';
import { useRouter } from 'next/navigation';
import { Award, Trophy, Leaf, ChevronRight, X, Trash2, LogOut, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import AvatarIcon from '../../components/AvatarIcon';
import ActionSheet from '../../components/ActionSheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

// Add this line
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define all badge categories (same as badges page)
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

// --- UTILITY FUNCTION FOR BADGE LOGIC ---
const getBadgeLevel = (discoveredCount, total) => {
  // Use COUNT-based thresholds (same as badges page)
  if (discoveredCount >= 11) return { level: 'Gold', value: 3 };
  if (discoveredCount >= 6) return { level: 'Silver', value: 2 };
  if (discoveredCount >= 1) return { level: 'Bronze', value: 1 };
  return { level: 'Locked', value: 0 };
};

// --- NEW HELPER FUNCTION for BigBox COLOR MAPPING ---
const getSimpleBadgeColorClass = (level) => {
  switch (level) {
    case 'Gold':
      return 'bg-gradient-to-br from-yellow-200 to-yellow-500 text-white drop-shadow-sm';
    case 'Silver':
      return 'bg-gradient-to-br from-gray-200 to-gray-400 text-white drop-shadow-sm';
    case 'Bronze':
      return 'bg-gradient-to-br from-amber-200 to-amber-800 text-white drop-shadow-sm';
    case 'Locked':
    default:
      return 'bg-gray-200 text-gray-500';
  }
};

const ProfilePage = () => {
  const router = useRouter();

  /* --- STATE MANAGEMENT --- */
  const [editingField, setEditingField] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* State for user profile data - NOW WITH SEPARATE FIRST/LAST NAME */
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    email: "",
  });

  /* NEW: State for user stats */
  const [userStats, setUserStats] = useState({
    speciesIdentified: 0,
    leaderboardRank: 0,
  });

  /* State for password change form data */
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* State to control visibility of the password edit inputs */
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  /* --- NEW STATES FOR AVATAR FUNCTIONALITY --- */
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  /* --- NEW: STATE FOR BADGES DATA --- */
  const [badges, setBadges] = useState([]);
  const [topBadges, setTopBadges] = useState([]);

  /* --- FETCH BADGES DATA --- */
  const fetchBadges = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        console.log('No auth token found for badges fetch');
        return;
      }

      console.log('🔄 Fetching badges for profile...');
      
      // ✅ FIX: Use the correct endpoint with trailing slash
      const response = await fetch(`${API_BASE_URL}/api/badges/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile badges data received:', data);
        setBadges(data);
        
        // Process and set top badges
        const processedBadges = processBadgesForProfile(data);
        setTopBadges(processedBadges);
        
        // NEW: Log badge summary
        const earnedCount = processedBadges.filter(b => b.isEarned).length;
        console.log(`📊 Badge Summary: ${earnedCount} earned, ${processedBadges.length} total displayed`);
      } else {
        console.log('❌ Failed to fetch badges for profile:', response.status);
        // Fallback: set empty array to avoid errors
        setTopBadges([]);
      }
    } catch (error) {
      console.log('❌ Network error fetching badges:', error);
      // Fallback: set empty array to avoid errors
      setTopBadges([]);
    }
  };

  const processBadgesForProfile = (apiBadges) => {
    if (!apiBadges || !Array.isArray(apiBadges)) {
      console.log('No valid badges data to process');
      return [];
    }

    const mergedBadges = ALL_BADGE_CATEGORIES.map(category => {
      // Find matching badge from API (case-insensitive)
      const apiBadge = apiBadges.find(badge => 
        badge.category.toLowerCase() === category.category.toLowerCase()
      );
      
      if (apiBadge) {
        // Use API data if available
        const progress = getBadgeLevel(apiBadge.discoveredSpecies, apiBadge.totalSpecies);
        const percentage = apiBadge.totalSpecies > 0 ? (apiBadge.discoveredSpecies / apiBadge.totalSpecies) * 100 : 0;
        const colorClass = getSimpleBadgeColorClass(progress.level);
        
        return {
          ...category,
          // Use API data
          totalSpecies: apiBadge.totalSpecies,
          discoveredSpecies: apiBadge.discoveredSpecies,
          discovered: apiBadge.discovered || [],
          undiscovered: apiBadge.undiscovered || [],
          // Progress information
          sortValue: progress.value,
          percentage: percentage,
          color: colorClass,
          label: category.category,
          icon: category.icon,
          isEarned: apiBadge.discoveredSpecies > 0,
          // Add component type for rendering
          iconType: 'emoji'
        };
      } else {
        // Return locked badge if no API data
        return {
          ...category,
          discoveredSpecies: 0,
          discovered: [],
          undiscovered: [],
          sortValue: 0,
          percentage: 0,
          color: getSimpleBadgeColorClass('Locked'),
          label: category.category,
          icon: category.icon,
          isEarned: false,
          iconType: 'emoji'
        };
      }
    });

    // Get earned badges and sort them
    const earnedBadges = mergedBadges.filter(badge => badge.isEarned);
    const sortedEarnedBadges = [...earnedBadges].sort((a, b) => {
      if (b.sortValue !== a.sortValue) {
        return b.sortValue - a.sortValue;
      }
      return b.percentage - a.percentage;
    });

    // SIMPLE APPROACH: Always show exactly 3 items
    let topBadges = [];
    
    if (earnedBadges.length >= 3) {
      // User has 3+ badges - show top 3 earned
      topBadges = sortedEarnedBadges.slice(0, 3);
    } else {
      // User has less than 3 badges - show earned badges + "Explore More" locked badge
      topBadges = [...sortedEarnedBadges];
      
      // Add "Explore More" as a locked badge - USING LOCK COMPONENT
      const exploreMoreBadge = {
        id: 'explore-more',
        category: 'Locked',
        label: 'Locked',
        icon: <Lock className="w-6 h-6 text-gray-500" />, // FIXED: Use JSX component, not string
        color: getSimpleBadgeColorClass('Locked'),
        isEarned: false,
        isExploreMore: true,
        totalSpecies: 0,
        discoveredSpecies: 0,
        percentage: 0,
        sortValue: 0,
        iconType: 'component' // Mark as component type
      };
      
      // Fill remaining slots with "Explore More"
      while (topBadges.length < 3) {
        topBadges.push(exploreMoreBadge);
      }
    }
    
    console.log('🎯 Top badges for profile:', {
      earned: earnedBadges.length,
      finalDisplay: topBadges.map(b => ({ 
        category: b.category, 
        earned: b.isEarned 
      }))
    });
    
    return topBadges;
  };



  /* --- HANDLE EXPLORE MORE CLICK --- */
  const handleExploreMoreClick = () => {
    // You can customize this action - here are some options:
    
    // Option 1: Navigate to scanning page
    // router.push('/scan');
    
    // Option 2: Navigate to badges page to see all categories
    router.push('/badges');
    
    // Option 3: Show a modal with exploration tips
    // setShowExploreModal(true);
    
    console.log('🔍 Explore More clicked - encouraging user to discover more species');
  };

  /* --- NEW: FETCH USER STATS FUNCTION --- */
  const fetchUserStats = async (userId, authToken) => {
    try {
      console.log("📊 Fetching user stats for profile...");

      // Fetch scanned species count
      const scannedSpeciesRes = await fetch(
        `${API_BASE_URL}/scanned-species/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      let speciesIdentified = 0;
      if (scannedSpeciesRes.ok) {
        const scannedData = await scannedSpeciesRes.json();
        speciesIdentified = scannedData.count || 0;
        console.log("✅ Species identified:", speciesIdentified);
      }

      // Fetch user rank
      let leaderboardRank = 0;
      try {
        const rankRes = await fetch(
          `${API_BASE_URL}/users/rankings/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (rankRes.ok) {
          const rankData = await rankRes.json();
          leaderboardRank = rankData.rank || 0;
          console.log("✅ Leaderboard rank:", leaderboardRank);
        }
      } catch (rankError) {
        console.warn("⚠️ Could not fetch user rank:", rankError);
      }

      // Update stats state
      setUserStats({
        speciesIdentified,
        leaderboardRank,
      });

      console.log("📊 Final profile stats:", {
        speciesIdentified,
        leaderboardRank,
      });
    } catch (error) {
      console.error("❌ Error fetching user stats:", error);
    }
  };

  /* --- FETCH USER DATA ON COMPONENT MOUNT --- */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem("user_data");
        const authToken = localStorage.getItem("auth_token");
        const userId = localStorage.getItem("current_user_id");

        console.log("🔄 Loading profile data:", {
          storedUserData,
          authToken,
          userId,
        });

        if (storedUserData && authToken && userId) {
          const user = JSON.parse(storedUserData);

          // Format the data for the profile - NOW WITH SEPARATE FIRST/LAST NAME
          setProfileData({
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            birthday: user.birthday
              ? new Date(user.birthday).toLocaleDateString()
              : "Not set",
            email: user.email || "",
          });

          setUserData(user);

          if (user.profile_picture) {
            // ✅ FIX: Construct the URL properly
            const profileImageUrl = `${API_BASE_URL}/users/profile-picture/${user.profile_picture}`;
            setProfileImage(profileImageUrl);
            console.log("✅ Loaded profile picture from GCP:", profileImageUrl);
          } else {
            setProfileImage(null); // Clear any previous image
            console.log("ℹ️ No profile picture found for user");
          }

          console.log("✅ User profile data loaded:", user);

          setUserData(user);
          console.log("✅ User profile data loaded:", user);

          // Fetch additional stats
          await fetchUserStats(userId, authToken);

          // Fetch badges data
          await fetchBadges();
        } else {
          console.log("❌ No user data found, redirecting to login");
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("❌ Error loading user data:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  /* --- NAVIGATION & ACTION HANDLERS --- */

  const handleBackClick = () => {
    router.back();
  };

  const handleEdit = (field) => {
    setEditingField(field);
  };

  /* UPDATED: Handle saving profile data with separate first/last name */
  const handleSave = async (field, value) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("current_user_id");

      if (!authToken || !userId) {
        alert("Please log in again");
        router.push("/login");
        return;
      }

      // Prepare update data based on field
      let updateData = {};
      if (field === "firstName") {
        updateData = { first_name: value };
      } else if (field === "lastName") {
        updateData = { last_name: value };
      } else if (field === "birthday") {
        updateData = { birthday: value };
      }

      console.log("📤 Updating profile:", updateData);

      // Call the backend API to update user profile - FIXED URL
      const response = await fetch(`${API_BASE_URL}/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update local state
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Update stored user data in localStorage
      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        if (field === "firstName") {
          user.first_name = value;
        } else if (field === "lastName") {
          user.last_name = value;
        } else if (field === "birthday") {
          user.birthday = value;
        }
        localStorage.setItem("user_data", JSON.stringify(user));
        setUserData(user);
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setEditingField(null);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* UPDATED: Handle password change with backend integration */
  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      const authToken = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("current_user_id");

      if (!authToken || !userId) {
        alert("Please log in again");
        return;
      }

      console.log("📤 Changing password...");

      // FIXED URL
      const response = await fetch(`${API_BASE_URL}/users/password/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to change password");
      }

      const result = await response.json();

      alert("Password changed successfully!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsEditingPassword(false);
    } catch (error) {
      console.error("❌ Error changing password:", error);
      alert(`Error changing password: ${error.message}`);
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditingPassword(false);
  };

  const handleProfileSheetClose = () => {
    setEditingField(null);
  };

  const handleAccountSheetClose = () => {
    setIsEditingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  /* UPDATED: Handle delete account with proper backend integration */
  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        const authToken = localStorage.getItem("auth_token");
        const userId = localStorage.getItem("current_user_id");

        if (!authToken || !userId) {
          alert("Please log in again");
          return;
        }

        console.log("🗑️ Deleting account...");

        // FIXED URL
        const response = await fetch(
          `${API_BASE_URL}/users/account/${userId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("Account deleted:", result);

          // Clear localStorage
          localStorage.removeItem("auth_token");
          localStorage.removeItem("current_user_id");
          localStorage.removeItem("user_data");

          alert("Account deleted successfully!");
          router.push("/login");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        alert(`Error deleting account: ${error.message}`);
      }
    }
  };

  const handleViewAllBadges = () => {
    router.push("/badges");
  };

  const handleManageFriendsClick = () => {
    router.push("/friends");
  };

  /* UPDATED: Handle logout properly */
  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      console.log("Logging out user...");

      // Clear authentication data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user_id");
      localStorage.removeItem("user_data");

      // Redirect to login
      router.push("/login");
    }
  };

  /* --- NEW HANDLERS FOR AVATAR FUNCTIONALITY --- */
  const handleAvatarClick = () => {
    setIsActionSheetOpen(true);
  };

  const handleActionSheetClose = () => {
    setIsActionSheetOpen(false);
  };
  
  const uploadProfilePicture = async (imageBlob) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const userId = localStorage.getItem("current_user_id");

      if (!authToken || !userId) {
        alert("Please log in again");
        return;
      }

      const formData = new FormData();
      formData.append("image", imageBlob, "profile-picture.jpg");

      console.log("📤 Uploading profile picture...");

      const response = await fetch(`${API_BASE_URL}/users/profile-picture/${userId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload profile picture");
      }

      const result = await response.json();
      console.log("🔄 Upload result:", result);
      
      // ✅ FIX: Update profile image URL immediately
      if (result.profile_picture) {
        const newImageUrl = `${API_BASE_URL}/users/profile-picture/${result.profile_picture}`;
        setProfileImage(newImageUrl);
        console.log("✅ Updated profile image URL:", newImageUrl);
      }

      // ✅ FIX: Update localStorage
      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        user.profile_picture = result.profile_picture;
        localStorage.setItem("user_data", JSON.stringify(user));
        setUserData(user);
      }

      console.log("✅ Profile picture uploaded successfully");
      return result;
      
    } catch (error) {
      console.error("❌ Error uploading profile picture:", error);
      alert(`Error uploading profile picture: ${error.message}`);
      throw error;
    }
  };

  
  const handleImageSelected = async (imageData) => {
    if (imageData && imageData.data) {
      try {
        setIsLoading(true);
        console.log("🖼️ Processing selected image...");
        
        // ✅ FIX: Call the upload function directly
        await uploadProfilePicture(imageData.data);
        
        console.log("✅ Profile image updated successfully");
      } catch (error) {
        console.error("❌ Failed to upload profile picture:", error);
        alert("Failed to upload profile picture. Please try again.");
      } finally {
        setIsLoading(false);
        setIsActionSheetOpen(false); // Close the action sheet
      }
    }
  };

  /* --- CLICK HANDLERS FOR STATS BOXES --- */
  const handleSpeciesIdentifiedClick = () => {
    router.push('/species');
  };

  const handleLeaderboardRankClick = () => {
    router.push('/leaderboard');
  };

  /* --- UPDATED UTILITY FUNCTION FOR RENDERING PROFILE FIELDS --- */
  const renderField = (field, label, value, editable = true) => {
    const isEditing = editingField === field;

    if (isEditing) {
      if (field === "birthday") {
        return (
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-2 flex-1">
              <span className="font-medium text-gray-500 w-20">{label}:</span>
              <div className="flex-1">
                <Calendar22
                  value={value}
                  onChange={(newValue) =>
                    setProfileData((prev) => ({ ...prev, [field]: newValue }))
                  }
                  onSave={(newValue) => handleSave(field, newValue)}
                />
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      }

      return (
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2 flex-1">
            <span className="font-medium text-gray-500 w-20">{label}:</span>
            <div className="flex-1">
              <InputBox
                value={value}
                onChange={(newValue) =>
                  setProfileData((prev) => ({ ...prev, [field]: newValue }))
                }
                autoFocus
              />
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center py-3">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-500 w-20">{label}:</span>
          <span className="text-gray-800 font-semibold">
            {value || "Not set"}
          </span>
        </div>
        {editable && <EditButton onClick={() => handleEdit(field)} />}
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user data
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  /* --- MAIN COMPONENT RENDER --- */
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto pb-20">
        {/* Header Section with Back Button */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Profile Summary Section: Avatar, Name, Email, and Stats */}
        <div className="px-6 pb-0">
          <div className="text-center mb-1">
            {/* User Avatar */}
            <div className="relative mx-auto mb-4 flex items-center justify-center">
              {isLoading ? (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-emerald-400">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : profileImage ? (
                <div
                  className="w-24 h-24 rounded-full bg-cover bg-center shadow-lg cursor-pointer border-2 border-emerald-400"
                  style={{ backgroundImage: `url(${profileImage})` }}
                  onClick={handleAvatarClick}
                />
              ) : (
                <AvatarIcon
                  onClick={handleAvatarClick}
                  buttonSize="w-24 h-24"
                  iconSize="w-12 h-12"
                  backgroundColor="bg-gradient-to-br from-emerald-500 to-teal-500"
                  hoverColor="hover:from-emerald-500 hover:to-teal-600"
                  textColor="text-white"
                  className="shadow-lg"
                />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {`${profileData.firstName || ""} ${
                profileData.lastName || ""
              }`.trim() || "User"}
            </h1>
            <p className="text-gray-600">{profileData.email}</p>
          </div>

          {/* Top Badges Box - WITH EXPLORE MORE FEATURE */}
          <div className="mb-6">
            <SectionDivider 
              title="Your Top Badges:"
              actionText="View All Badges"
              onActionClick={handleViewAllBadges}
              badges={topBadges}
              border=""
              gradientFrom="from-gray-100"
              gradientTo="to-gray-50"
              onExploreMoreClick={handleExploreMoreClick}
            />
            
            
          </div>

          {/* Small Statistic Boxes - NOW CLICKABLE WITH NAVIGATION */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Species Identified - Clickable to History Page */}
            <div 
              onClick={handleSpeciesIdentifiedClick}
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200 active:scale-95"
            >
              <SmallBox 
                icon={Leaf}
                border="border border-pink-500"
                gradientFrom="from-pink-50"
                gradientTo="to-gray-50"
                iconColor="text-pink-300"
                title="Species Identified"
                value={userStats.speciesIdentified.toString()}
              />
            </div>
            
            {/* Leaderboard Rank - Clickable to Leaderboard Page */}
            <div 
              onClick={handleLeaderboardRankClick}
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200 active:scale-95"
            >
              <SmallBox 
                icon={Trophy}
                border="border border-yellow-500"
                gradientFrom="from-yellow-50"
                gradientTo="to-pink-50"
                iconColor="text-amber-300"
                title="Leaderboard Rank"
                value={userStats.leaderboardRank > 0 ? `#${userStats.leaderboardRank}` : "N/A"}
              />
            </div>
          </div>
        </div>

        {/* --- MAIN MENU AND SETTINGS SECTION --- */}
        <div className="px-6">
          {/* --- Navigation Button: Manage Friends --- */}
          <div
            onClick={handleManageFriendsClick}
            className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-300 overflow-hidden mb-4 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between p-4 hover:bg-emerald-100 transition-colors group">
              <span className="text-gray-800 font-semibold text-lg group-hover:text-emerald-700 transition-colors">
                Manage Friends
              </span>
              <ChevronRight className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </div>

          {/* Expandable Box: Profile Information (Now with First/Last Name) */}
          <ExpandableBox
            title="Profile Information"
            onClose={handleProfileSheetClose}
          >
            <div className="space-y-2 text-sm text-gray-600">
              {renderField("email", "Email", profileData.email, false)}
              {renderField("firstName", "First Name", profileData.firstName)}
              {renderField("lastName", "Last Name", profileData.lastName)}
              {renderField("birthday", "Birthday", profileData.birthday)}

              {/* Save/Cancel Buttons for Profile Information Edit */}
              {editingField && (
                <div className="flex justify-center space-x-3 pt-2 mt-2">
                  <button
                    onClick={() =>
                      handleSave(editingField, profileData[editingField])
                    }
                    className="py-2 px-4 rounded-lg font-semibold transition-colors 
                               border-2 border-emerald-500 text-gray-800 bg-white hover:bg-emerald-50"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="py-2 px-4 rounded-lg font-semibold transition-colors 
                               border-2 border-red-500 text-gray-800 bg-white hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {!editingField}
            </div>
          </ExpandableBox>

          {/* Expandable Box: Account Settings (Opens Sheet) */}
          <ExpandableBox
            title="Account Settings"
            onClose={handleAccountSheetClose}
          >
            <div className="space-y-6 text-sm text-gray-600">
              {/* Password Section */}
              <div className="space-y-4">
                {!isEditingPassword ? (
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-500">
                        Password:
                      </span>
                      <span className="text-gray-800 font-semibold">
                        ••••••••
                      </span>
                    </div>
                    <EditButton onClick={() => setIsEditingPassword(true)} />
                  </div>
                ) : (
                  <div className="relative -mt-4">
                    {/* Block for editing password */}

                    {/* Absolute positioned cancel button */}
                    {/* <div className="absolute top-0 right-0 z-10">
                      <button
                        onClick={handleCancelPassword}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Cancel password edit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div> */}

                    {/* Password Input fields */}
                    <div className="py-2">
                      <InputBox
                        label="Current Password"
                        value={passwordData.currentPassword}
                        type="password"
                        onChange={(value) =>
                          handlePasswordChange("currentPassword", value)
                        }
                        placeholder="Enter your current password"
                        autoFocus
                      />
                      <InputBox
                        label="New Password"
                        value={passwordData.newPassword}
                        type="password"
                        onChange={(value) =>
                          handlePasswordChange("newPassword", value)
                        }
                        placeholder="Enter your new password"
                      />
                      <InputBox
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        type="password"
                        onChange={(value) =>
                          handlePasswordChange("confirmPassword", value)
                        }
                        placeholder="Enter your new password again"
                      />
                    </div>

                    {/* Save/Cancel buttons for password change */}
                    <div className="flex justify-center space-x-3 pt-2 mt-2">
                      <button
                        onClick={handleSavePassword}
                        className="py-2 px-4 rounded-lg font-semibold transition-colors 
                                   border-2 border-emerald-500 text-gray-800 bg-white hover:bg-emerald-50"
                      >
                        Save Password
                      </button>
                      <button
                        onClick={handleCancelPassword}
                        className="py-2 px-4 rounded-lg font-semibold transition-colors 
                                   border-2 border-red-500 text-gray-800 bg-white hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isEditingPassword}
              </div>

              {/* Delete Account Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <h3 className="font-semibold text-red-600 mb-1">
                    Danger Zone
                  </h3>
                  <p className="text-gray-500 text-xs">
                    Once you delete your account, it cannot be recovered.
                  </p>
                </div>

                {/* Delete Account Button */}
                <div className="mx-4">
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full py-3 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </ExpandableBox>

          {/* --- Action Button: Log Out --- */}
          <div
            onClick={handleLogout}
            className="w-full bg-gray-100 rounded-2xl shadow-sm border border-gray-300 overflow-hidden mb-4 hover:border-red-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
              <span className="text-red-600 font-semibold text-lg group-hover:text-red-700 transition-colors">
                Log Out
              </span>
              <LogOut className="text-red-400 group-hover:text-red-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* ActionSheet Component for Profile Picture Selection */}
      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleActionSheetClose}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};

export default ProfilePage;
