import React from 'react';

const RectangleButton = ({ onClick, text, variant = "primary", className = "" }) => {
  const baseClasses = "flex items-center justify-center gap-2 w-full p-4 rounded-3xl font-semibold shadow-xl transition-all duration-300 transform active:scale-95 border-none cursor-pointer focus:outline-none focus:ring-4";
  
  const variantClasses = {
    primary: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-300",
    secondary: "bg-white text-emerald-800 border-2 border-emerald-500 hover:bg-emerald-50 focus:ring-emerald-300 text-2xl sm:text-3xl"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      <span>{text}</span>
    </button>
  );
};

export default RectangleButton;