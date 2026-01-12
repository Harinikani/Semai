import React, { useEffect, useState } from "react";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // set in .env
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


const CommunityStats = () => {
  const [rank, setRank] = useState(null);
  const [points, setPoints] = useState(null);
  const [friendsCount, setFriendsCount] = useState(null);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // read user id from localStorage (your app sets this elsewhere)
  const userId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;


  useEffect(() => {
    if (!userId) {
      setError("User not signed in");
      setLoading(false);
      return;
    }


    let cancelled = false;


    const fetchAll = async () => {
      setLoading(true);
      setError(null);


      const profileUrl = `${API_BASE}/users/profile/${userId}`;
      const rankUrl = `${API_BASE}/users/rankings/${userId}`;
      const friendsUrl = `${API_BASE}/friendships/friends/${userId}`;


      try {
        const [profileRes, rankRes, friendsRes] = await Promise.all([
          fetch(profileUrl, { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }),
          fetch(rankUrl, { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }),
          fetch(friendsUrl, { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }),
        ]);


        // Profile
        if (!profileRes.ok) {
          const txt = await profileRes.text();
          throw new Error(`Profile error: ${profileRes.status} ${txt}`);
        }
        const profile = await safeJson(profileRes);


        // Rank
        let rankData = null;
        if (rankRes.ok) {
          rankData = await safeJson(rankRes);
        } else {
          console.warn("Failed to fetch rank:", rankRes.status, await rankRes.text());
        }


        // Friends
        let friendsData = [];
        if (friendsRes.ok) {
          friendsData = await safeJson(friendsRes);
          // many shapes: array or { friendships: [...] }
          if (!Array.isArray(friendsData) && Array.isArray(friendsData.friendships)) {
            friendsData = friendsData.friendships;
          }
        } else {
          console.warn("Failed to fetch friends:", friendsRes.status, await friendsRes.text());
        }


        if (cancelled) return;


        setPoints(profile?.points ?? 0);


        // rank endpoint expected to return { rank, id, ... } as per server code
        if (rankData && (rankData.rank || rankData.rank === 0)) {
          setRank(rankData.rank);
        } else {
          // fallback: if server returned list, try to find user
          if (Array.isArray(rankData)) {
            const entry = rankData.find((r) => String(r.id) === String(userId));
            setRank(entry?.rank ?? null);
          } else {
            setRank(null);
          }
        }


        setFriendsCount(Array.isArray(friendsData) ? friendsData.length : 0);
      } catch (err) {
        console.error("CommunityStats fetch error:", err);
        if (!cancelled) setError(String(err.message ?? err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };


    fetchAll();


    return () => {
      cancelled = true;
    };
  }, [API_BASE, userId]);


  // helper to safely parse JSON response
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };


  return (
    <div className="mt-6">
      <StatsCard
        loading={loading}
        error={error}
        rank={rank}
        points={points}
        friendsCount={friendsCount}
      />
    </div>
  );
};


const StatsCard = ({ loading, error, rank, points, friendsCount }) => (
  <div className="rounded-2xl bg-white p-6 shadow-lg border border-emerald-200">
    <h3 className="mb-2 font-semibold text-gray-800">Community Stats</h3>


    {loading ? (
      <p className="text-sm text-gray-500">Loading stats…</p>
    ) : error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : (
      <div className="space-y-2 text-sm">
        <StatItem label="Your Rank:" value={rank ? `#${rank}` : "—"} />
        <StatItem label="Total Points:" value={typeof points === "number" ? points.toLocaleString() : "—"} />
        <StatItem label="Friends:" value={typeof friendsCount === "number" ? `${friendsCount}` : "—"} />
      </div>
    )}
  </div>
);


const StatItem = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-emerald-600">{value}</span>
  </div>
);


export default CommunityStats;