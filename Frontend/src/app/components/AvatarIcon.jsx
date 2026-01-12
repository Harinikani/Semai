'use client';

const AvatarIcon = ({ 
  onClick, 
  className = "",
  // FREE SIZE CONTROLS - Customize at page.js level
  buttonSize = "w-10 h-10",  // Button background size
  iconSize = "w-10 h-10",    // Icon size
  // COLOR CONTROLS
  backgroundColor = "bg-blue-500",
  hoverColor = "hover:bg-blue-600",
  textColor = "text-white"
}) => {
  
  return (
    <button 
      onClick={onClick}
      className={`
        ${buttonSize}
        ${backgroundColor} ${hoverColor} ${textColor}
        font-semibold rounded-full shadow-lg transition-colors duration-200 
        flex items-center justify-center 
        ${className}
      `}
    >
      <svg 
        className={iconSize}
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </button>
  );
};

export default AvatarIcon;