// components/BigBox.jsx (Updated)
"use client";

import { ChevronRight } from "lucide-react";

const BigBox = ({
  title,
  actionText,
  onActionClick,
  badges = [],
  border,
  gradientFrom = "from-purple-50",
  gradientTo = "to-pink-50",
  children,
}) => {
  return (
    <div
      className={`
        ${border}
        bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-2xl p-5 mb-6`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <button
          onClick={onActionClick}
          className="text-emerald-600 text-sm font-medium flex items-center hover:text-emerald-700 transition-colors"
        >
          {actionText} <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Render badges if no children provided, otherwise render children */}
      {children ? (
        children
      ) : (
        <div className="flex justify-around">
          {badges.map((badge, index) => (
            <div key={index} className="text-center">
              <div
                className={`w-18 h-18 ${badge.color} rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm`}
              >
                {typeof badge.icon === "function" ? (
                  // Render as a React component (e.g., Lucide icon)
                  <badge.icon className="w-6 h-6 text-white" />
                ) : (
                  // RENDER EMOJI: Added 'leading-none' to ensure perfect vertical centering
                  <span
                    className="text-4xl **leading-none**"
                    role="img"
                    aria-label={`badge for ${badge.label}`}
                  >
                    {badge.icon}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">{badge.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BigBox;