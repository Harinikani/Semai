import React from "react";
import UserAvatar from "./UserAvatar";

const FriendRequestCard = ({ name = "Someone", onAccept, onDecline, disabled = false }) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <UserAvatar name={name} size="md" />
        <div>
          <h4 className="font-semibold text-gray-800">{name}</h4>
          <p className="text-sm text-gray-500">Wants to connect</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onAccept}
          disabled={disabled}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
            disabled ? "bg-green-300 cursor-not-allowed" : "bg-teal-500 hover:bg-green-600"
          }`}
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          disabled={disabled}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default FriendRequestCard;