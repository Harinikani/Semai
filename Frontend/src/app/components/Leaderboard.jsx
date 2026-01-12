// Leaderboard.jsx
"use client";
import React, { useState, useEffect } from 'react';
import UserAvatar from "./UserAvatar";

const Leaderboard = ({ data = null, className = "", showHeader = true, limit = 4 }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${API_BASE_URL}/users/rankings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const leaderboardData = await response.json();

        // Transform the data
        const transformedData = leaderboardData.map((user, index) => ({
          rank: index + 1,
          name: `${user.first_name} ${user.last_name}`.trim() || `User ${user.id.slice(0, 4)}`,
          points: user.points || 0,
          currency: user.currency || 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'User')}&background=random`,
          trend: "neutral",
          isCurrentUser: false,
          id: user.id
        }));

        setLeaderboardData(transformedData.slice(0, 4));
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
        setLeaderboardData(getDefaultData());
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const getDefaultData = () => {
    return [
      {
        rank: 1,
        name: "Alpha",
        points: 1250,
        currency: 150,
        avatar: "https://placehold.co/40x40/FFD700/ffffff?text=A",
        trend: "up",
        isCurrentUser: false
      },
      {
        rank: 2,
        name: "Beta",
        points: 980,
        currency: 320,
        avatar: "https://placehold.co/40x40/C0C0C0/ffffff?text=B",
        trend: "down",
        isCurrentUser: false
      },
      {
        rank: 3,
        name: "Charlie",
        points: 760,
        currency: 45,
        avatar: "https://placehold.co/40x40/CD7F32/ffffff?text=C",
        trend: "neutral",
        isCurrentUser: false
      },
      {
        rank: 4,
        name: "Delta",
        points: 650,
        currency: 280,
        avatar: "https://placehold.co/40x40/698b69/ffffff?text=D",
        trend: "neutral",
        isCurrentUser: false
      }
    ];
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500 text-base font-bold">↑</span>;
      case 'down':
        return <span className="text-red-500 text-base font-bold">↓</span>;
      default:
        return <span className="text-gray-400 text-base">—</span>;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
    } else if (rank === 2) {
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    } else if (rank === 3) {
      return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
    }
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className={`w-full bg-white rounded-2xl overflow-hidden border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          {showHeader && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4">
              <div className="h-6 bg-emerald-300 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-emerald-300 rounded w-1/2"></div>
            </div>
          )}
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center px-3 py-3 border-b border-gray-100">
              <div className="w-16">
                <div className="h-7 bg-gray-200 rounded-full w-7"></div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16">
                <div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full bg-white rounded-2xl overflow-hidden border border-gray-100 ${className}`}>
        {showHeader && (
          <div className="bg-gradient-to-r from-green-400 to-green-500 text-white py-3 px-4">
            <h2 className="text-lg font-bold">Achievement Leaderboard</h2>
            <p className="text-green-100 text-xs mt-0.5">Based on lifetime points</p>
          </div>
        )}
        <div className="p-4 text-center text-red-500">
          <p>Failed to load leaderboard</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayData = data || leaderboardData;

  return (
    <div className={`w-full bg-white rounded-2xl overflow-hidden border border-gray-100 ${className}`}>
      {showHeader && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4">
          <h2 className="text-lg font-bold">Weekly Leaderboard</h2>
          <p className="text-green-100 text-xs mt-0.5">Based on lifetime points</p>
        </div>
      )}
      
      <div className="overflow-hidden">
        <div className="w-full">
          {showHeader && (
            <div className="bg-gray-50 border-b border-gray-200 flex px-3 py-2">
              <div className="w-16 text-left font-semibold text-gray-700 text-sm">Rank</div>
              <div className="flex-1 text-left font-semibold text-gray-700 text-sm">User</div>
              <div className="w-16 text-right font-semibold text-gray-700 text-sm">Points</div>
            </div>
          )}
          
          <div className="divide-y divide-gray-100">
            {displayData.map((user) => (
              <div 
                key={user.rank} 
                className={`flex items-center px-3 py-3 transition-all duration-200 ${
                  user.isCurrentUser ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                {/* Rank Column */}
                <div className="w-16">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(user.rank)}`}>
                      {user.rank}
                    </div>
                    {getTrendIcon(user.trend)}
                  </div>
                </div>
                
                {/* User Column */}
                {/* // In Leaderboard.jsx, replace the avatar section with: */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserAvatar 
                    name={user.name} 
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium text-sm truncate block ${
                      user.isCurrentUser ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {user.name}
                    </span>
                    {user.isCurrentUser && (
                      <span className="text-blue-500 text-xs font-medium">You</span>
                    )}
                  </div>
                </div>
              </div>
                
                {/* Points Column */}
                <div className="w-16 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm">🏆</span>
                    <span className={`font-bold text-sm ${
                      user.isCurrentUser ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {user.points}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;