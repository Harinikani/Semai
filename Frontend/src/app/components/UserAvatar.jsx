// components/UserAvatar.jsx
'use client';

const UserAvatar = ({ 
  user = null,
  name = "",
  size = "md",
  className = ""
}) => {
  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
    xl: "w-14 h-14"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <div className={`
      ${sizeClass}
      bg-gradient-to-r from-blue-500 to-teal-500
      font-semibold rounded-full shadow-lg
      flex items-center justify-center text-white
      ${className}
    `}>
      <svg 
        className={iconSize}
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
  );
};

export default UserAvatar;