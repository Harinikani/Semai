import React, { useState, useCallback, useEffect } from "react";
import SearchBar from "./SearchBar";
import ScanQR from "./ScanQR";
import InviteSection from "./InviteSection";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // set in env or leave empty for same origin

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AddFriendsTab = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [friendIds, setFriendIds] = useState(new Set()); // IDs of users already friends
  const userId = localStorage.getItem("current_user_id");

  // fetch current friends once on mount
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/friendships/friends/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });

        if (!res.ok) {
          console.warn(
            "Could not fetch friends:",
            res.status,
            await res.text()
          );
          return;
        }

        const data = await res.json();
        // Expecting an array of friend summaries or list of friend objects.
        // Normalize: extract friend_id or friend.id
        const ids = new Set();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (!item) continue;
            if (item.friend_id) ids.add(String(item.friend_id));
            else if (item.id) ids.add(String(item.id));
            else if (item.friend && item.friend.id)
              ids.add(String(item.friend.id));
          }
        } else if (Array.isArray(data.friendships)) {
          for (const f of data.friendships) {
            if (f.friend_id) ids.add(String(f.friend_id));
            else if (f.user_id && f.user_id !== userId)
              ids.add(String(f.user_id));
          }
        }
        setFriendIds(ids);
      } catch (err) {
        console.warn("fetchFriends error:", err);
      }
    };

    fetchFriends();
  }, [API_BASE, userId]);

  // Called by SearchBar (debounced in SearchBar)
  const onSearch = useCallback(
    async (q) => {
      setQuery(q);
      setError(null);

      if (!q || q.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchUrl = `${API_BASE}/users/search/?search=${q}`; // keep your endpoint shape
        const outgoingUrl = `${API_BASE}/friendships/requests/${userId}?direction=outgoing`;

        const [searchRes, outgoingRes] = await Promise.all([
          fetch(searchUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          }),
          fetch(outgoingUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          }),
        ]);

        // handle search response
        if (!searchRes.ok) {
          const text = await searchRes.text();
          throw new Error(text || `Search failed (${searchRes.status})`);
        }

        // handle outgoing response (if it fails we still continue but warn)
        if (!outgoingRes.ok) {
          console.warn(
            "Failed to fetch outgoing requests:",
            outgoingRes.status,
            await outgoingRes.text()
          );
        }

        // parse search body
        const searchContentType = searchRes.headers.get("content-type") || "";
        let searchData = [];
        if (searchContentType.includes("application/json")) {
          const parsed = await searchRes.json();
          if (Array.isArray(parsed)) searchData = parsed;
          else searchData = parsed.users ?? parsed.results ?? [];
        } else {
          console.warn("Search returned non-JSON content; treating as empty.");
          searchData = [];
        }

        // parse outgoing (pending) requests
        let outgoingData = [];
        try {
          const outgoingContentType =
            outgoingRes.headers.get("content-type") || "";
          if (
            outgoingRes.ok &&
            outgoingContentType.includes("application/json")
          ) {
            const parsed = await outgoingRes.json();
            if (Array.isArray(parsed)) outgoingData = parsed;
            else
              outgoingData =
                parsed.friendships ?? parsed.requests ?? parsed.results ?? [];
          } else {
            outgoingData = [];
          }
        } catch (err) {
          console.warn("Failed to parse outgoing requests response:", err);
          outgoingData = [];
        }

        // Build a set of requested IDs from outgoingData.
        const requestedIds = new Set();
        for (const fr of outgoingData) {
          if (!fr) continue;
          if (fr.friend_id) requestedIds.add(String(fr.friend_id));
          else if (fr.friend && fr.friend.id)
            requestedIds.add(String(fr.friend.id));
          else if (fr.id && fr.friend) requestedIds.add(String(fr.friend.id));
        }

        // Normalize search results and mark requested/added flags
        const normalized = searchData
          .map((u) => {
            const uid = String(u.id ?? u.user_id ?? u._id ?? "");
            return {
              ...u,
              id: uid,
              requested: requestedIds.has(uid),
              added: friendIds.has(uid),
            };
          })
          // remove current user from results
          .filter((u) => String(u.id) !== String(userId));

        setResults(normalized);

        // Put requested IDs into processingIds so the UI treats them as disabled/in-progress (merge)
        setProcessingIds((prev) => {
          const next = new Set(prev);
          for (const id of requestedIds) next.add(id);
          return next;
        });
      } catch (err) {
        console.error("search error:", err);
        setError(err.message ?? "Failed to search");
      } finally {
        setLoading(false);
      }
    },
    // dependencies
    [API_BASE, userId, friendIds]
  );

  const sendFriendRequest = async (friend_id) => {
    if (!friend_id) return;
    setProcessingIds((s) => new Set(s).add(String(friend_id)));

    try {
      const res = await fetch(`${API_BASE}/friendships/?user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          user_id: userId,
          friend_id: friend_id,
          status: "pending",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to send request (${res.status})`);
      }

      const payload = await res.json();
      console.log("friend request sent:", payload);

      // mark as requested in UI
      setResults((prev) =>
        prev.map((r) =>
          String(r.id) === String(friend_id) ? { ...r, requested: true } : r
        )
      );
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.add(String(friend_id));
        return next;
      });
    } catch (err) {
      console.error("sendFriendRequest:", err);
      setError("Failed to send friend request");
      // rollback processing flag
      setProcessingIds((prev) => {
        const c = new Set(prev);
        c.delete(String(friend_id));
        return c;
      });
    }
  };

  return (
    <div className="space-y-6">
      <SearchBar placeholder="Search by name or ID" onSearch={onSearch} />

      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2">Search results</h4>

        {loading && <p className="text-sm text-gray-500">Searching…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && results.length === 0 && query.trim().length > 0 && (
          <p className="text-sm text-gray-500">No users found</p>
        )}

        <div className="space-y-3 mt-3">
          {results.map((user) => {
            const isProcessing = processingIds.has(String(user.id));
            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium text-gray-800">
                    {user.first_name
                      ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                      : user.email}
                  </div>
                </div>

                <div>
                  <button
                    disabled={isProcessing || user.added}
                    onClick={() => sendFriendRequest(user.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      user.added
                        ? "bg-gray-300 cursor-default text-gray-700"
                        : isProcessing
                        ? "bg-green-300 cursor-not-allowed text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {user.added
                      ? "Added"
                      : isProcessing
                      ? user.requested
                        ? "Requested"
                        : "Sending…"
                      : "Add Friend"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex flex-col gap-4">
          <ScanQR />
          <InviteSection />
        </div>
      </div>
    </div>
  );
};

export default AddFriendsTab;
