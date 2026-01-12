import React from 'react';

const FriendsStats = ({ friendsCount }) => {
  return (
    <div className="mb-4 pt-4 px-4">
      <div className="text-lg font-semibold text-gray-700">
        Friends: <span className="text-emerald-600">{friendsCount}</span>
      </div>
    </div>
  );
};

export default FriendsStats;