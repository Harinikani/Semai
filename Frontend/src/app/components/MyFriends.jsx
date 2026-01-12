import React, { useEffect, useState } from "react";
import UserAvatar from "./UserAvatar"; // Add this import


/* ===== COLOR CONFIGURATION ===== */
const COLOR_CONFIG = {
  headerFrom: "from-emerald-500",
  headerTo: "to-teal-500",
  headerText: "text-white",
  itemHover: "hover:bg-emerald-50",
  divider: "divide-emerald-100",
  avatarBorder: "border-emerald-200",
  pointsText: "text-emerald-600",
  nameText: "text-gray-800",
};
/* ===== END COLOR CONFIGURATION ===== */


const SORT_OPTIONS = {
  default: "a-z",
  options: ["a-z", "z-a", "highest-points", "lowest-points"],
};


const MyFriends = ({
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
  sortOption = SORT_OPTIONS.default,
  searchQuery = "",
  className = "",
}) => {
  const [friendsRaw, setFriendsRaw] = useState([]); // raw API response mapped to simple items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Fetch friends for current user
  useEffect(() => {
    let mounted = true;
    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token"); // adjust if you store token elsewhere
        const userId = localStorage.getItem('current_user_id');
        const res = await fetch(`${apiBaseUrl}/friendships/friends/${userId}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
        });


        if (!res.ok) {
          const msg = `Failed to fetch friends (${res.status})`;
          throw new Error(msg);
        }


        const data = await res.json();


        // API is expected to return an array of items like:
        // [{ friend_id, friend: { id, first_name, last_name, points, avatar }, accepted_at }, ...]
        // Map to flattened shape used by your component: { id, name, points, avatar }
        const mapped = (Array.isArray(data) ? data : []).map((item) => {
          const friendObj = item.friend || {}; // support both nested friend or minimal friend_id only
          const id = friendObj.id || item.friend_id || friendObj.friend_id || String(Math.random());
          const first = friendObj.first_name || friendObj.name || friendObj.first || "";
          const last = friendObj.last_name || friendObj.last || "";
          const name = (first + (last ? ` ${last}` : "")).trim() || friendObj.email || `User ${id}`;
          const points = friendObj.points ?? 0;

          return { id, name, points, raw: item };
        });


        if (mounted) {
          setFriendsRaw(mapped);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load friends");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };


    fetchFriends();
    return () => {
      mounted = false;
    };
  }, [apiBaseUrl]);


  // Filter and sort (same logic you had, applied to fetched data)
  const filteredFriends = friendsRaw.filter((friend) =>
    friend.name.toLowerCase().includes(String(searchQuery).toLowerCase()) ||
    String(friend.id).includes(String(searchQuery))
  );


  const sortedFriends = [...filteredFriends].sort((a, b) => {
    switch (sortOption) {
      case "a-z":
        return a.name.localeCompare(b.name);
      case "z-a":
        return b.name.localeCompare(a.name);
      case "highest-points":
        return b.points - a.points;
      case "lowest-points":
        return a.points - b.points;
      default:
        return 0;
    }
  });


  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-lg border border-emerald-200 ${className}`}>
      <div className={`bg-gradient-to-r ${COLOR_CONFIG.headerFrom} ${COLOR_CONFIG.headerTo} px-6 py-4`}>
        <h2 className={`text-lg font-bold ${COLOR_CONFIG.headerText}`}>Friends List</h2>
      </div>


      {loading ? (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-gray-500">Loading friends...</p>
        </div>
      ) : error ? (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : sortedFriends.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-gray-500">No friends found matching your search.</p>
        </div>
      ) : (
        <div className={`divide-y ${COLOR_CONFIG.divider}`}>
          {sortedFriends.map((friend) => (
            <div key={friend.id} className={`flex items-center justify-between px-6 py-4 ${COLOR_CONFIG.itemHover}`}>
              <div className="flex items-center gap-3">
                <UserAvatar size="md" />
                <span className={`font-semibold ${COLOR_CONFIG.nameText}`}>{friend.name}</span>
              </div>
              <span className={`font-bold ${COLOR_CONFIG.pointsText}`}>{friend.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default MyFriends;