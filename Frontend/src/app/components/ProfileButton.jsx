import React from 'react';

const ProfileButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-emerald-500 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors duration-200 shadow-sm"
      aria-label="User Profile"
    >
      <svg
        className="w-6 h-6 text-emerald-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        ></path>
      </svg>
    </button>
  );
};

export default ProfileButton;