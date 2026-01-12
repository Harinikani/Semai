'use client';
import React from 'react';

// ===== COLOR CONFIGURATION =====
// Change these variables to customize the color scheme
const COLOR_CONFIG = {
  // Container background
  containerBg: 'bg-emerald-100',
  
  // Active tab styles
  activeBg: 'bg-emerald-500',
  activeText: 'text-white',
  activeShadow: 'shadow-md',
  
  // Inactive tab styles
  inactiveBg: 'bg-transparent',
  inactiveText: 'text-gray-800',
  
  // Hover styles
  hoverBg: 'hover:bg-emerald-200',
};

// Tab names can also be customized here
const TAB_NAMES = ['My Friends', 'Add Friends', 'Requests'];
// ===== END COLOR CONFIGURATION =====

const FriendsTab = ({ activeTab, setActiveTab }) => {
  return (
    <div className={`flex gap-1 rounded-xl p-1 ${COLOR_CONFIG.containerBg}`}>
      {TAB_NAMES.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
            activeTab === tab
              ? `${COLOR_CONFIG.activeBg} ${COLOR_CONFIG.activeText} ${COLOR_CONFIG.activeShadow}`
              : `${COLOR_CONFIG.inactiveBg} ${COLOR_CONFIG.inactiveText} ${COLOR_CONFIG.hoverBg}`
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default FriendsTab;