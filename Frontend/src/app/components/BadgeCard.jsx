import React from "react";
import Badge from "./Badge";

/**
 * Renders the entire interactive card containing the Badge component, progress, and status.
 */
const BadgeCard = ({ badge, onClick, progressText, progressPercentage }) => {
  // Defensive check for missing badge prop
  if (!badge) {
    console.warn("BadgeCard rendered without a 'badge' prop.");
    return null;
  }

  // Logic to determine the badge level and associated colors - COUNT BASED
  const getBadgeLevel = (discoveredCount) => {
    if (discoveredCount >= 11)
      return {
        level: "Gold",
        color: "from-yellow-200 to-yellow-500 drop-shadow-sm",
        textColor: "text-amber-600",
        bgColor: "bg-yellow-50",
      };
    if (discoveredCount >= 6)
      return {
        level: "Silver",
        color: "from-gray-200 to-gray-400 drop-shadow-sm",
        textColor: "text-gray-600",
        bgColor: "bg-gray-50",
      };
    if (discoveredCount >= 1)
      return {
        level: "Bronze",
        color: "from-amber-200 to-amber-800 drop-shadow-sm",
        textColor: "text-orange-600",
        bgColor: "bg-amber-50",
      };
    return {
      level: "Locked",
      color: "from-gray-200 to-gray-300",
      textColor: "text-gray-400",
      bgColor: "bg-gray-100",
    };
  };

  const { level, color, textColor, bgColor } = getBadgeLevel(
    badge.discoveredSpecies
  );
  const isLocked = level === "Locked";

  return (
    <button
      onClick={() => !isLocked && onClick(badge)}
      className={`${bgColor} rounded-2xl px-auto py-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${
        isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {/* Using the imported Badge component */}
      <Badge color={color} icon={badge.icon} isLocked={isLocked} />

      {/* Category Name */}
      <h3 className="font-bold text-gray-800 text-center mb-1">
        {badge.category}
      </h3>

      {/* Level Badge */}
      <div
        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${textColor} ${bgColor} border border-current mx-auto mb-2`}
      >
        {level}
      </div>

      {/* Progress - UPDATED: Removed total species count and percentage */}
      {!isLocked && (
        <>
          <p className="text-sm text-gray-600 text-center mb-2">
            {badge.discoveredSpecies} species discovered
          </p>
          <div className="px-5">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {progressText}
          </p>
        </>
      )}
      {isLocked && (
        <p className="text-sm text-gray-500 text-center mt-1">
          Discover your first species!
        </p>
      )}
    </button>
  );
};

export default BadgeCard;
