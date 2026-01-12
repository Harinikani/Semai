import React, { useEffect, useState } from "react";
import FriendRequestCard from "./FriendsRequestCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const userId = localStorage.getItem('current_user_id');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/friendships/requests/${userId}?direction=incoming`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to fetch (${res.status})`);
      }

      const data = await res.json();
      setRequests(data.friendships ?? []);
    } catch (err) {
      console.error("fetchRequests:", err);
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateFriendshipStatus = async (id, newStatus) => {
    setProcessingIds((s) => new Set(s).add(id));

    const prev = requests;
    setRequests((rs) => rs.filter((r) => String(r.id) !== String(id)));

    try {
      const res = await fetch(`${API_BASE}/friendships/update?user_id=${userId}&friendship_id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ user_id:userId, friendship_id:id,  status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to ${newStatus} (${res.status})`);
      }

      await res.json();
    } catch (err) {
      console.error("updateFriendshipStatus:", err);
      setError(err.message || `Failed to ${newStatus}`);
      setRequests(prev);
    } finally {
      setProcessingIds((s) => {
        const copy = new Set(s);
        copy.delete(id);
        return copy;
      });
    }
  };

  const handleAccept = (id) => updateFriendshipStatus(id, "accepted");
  const handleDecline = (id) => updateFriendshipStatus(id, "rejected");

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-emerald-200">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
        <h2 className="text-lg font-bold text-white">Friend Requests</h2>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="divide-y divide-emerald-100">
          {requests.map((req) => (
            <FriendRequestCard
              key={req.id}
              name={req.user?.first_name ? `${req.user.first_name} ${req.user.last_name ?? ""}`.trim() : req.friend?.first_name ?? req.friend?.email ?? "Unknown"}
              onAccept={() => handleAccept(req.id)}
              onDecline={() => handleDecline(req.id)}
              disabled={processingIds.has(String(req.id))}
            />
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center text-sm">
          <p className="text-gray-500">No pending requests</p>
        </div>
      )}
    </div>
  );
};

export default RequestsTab;