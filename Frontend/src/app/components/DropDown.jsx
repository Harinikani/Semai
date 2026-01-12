'use client';
import { useState, useRef, useEffect } from 'react';

// ===== COLOR CONFIGURATION =====
// Change these variables to customize the color scheme
const COLOR_CONFIG = {
  // Button styles
  buttonBorder: 'border-emerald-200',
  buttonBg: 'bg-gray-50',
  buttonText: 'text-gray-700',
  buttonHover: 'hover:bg-emerald-50',
  buttonFocus: 'focus:ring-emerald-500',
  
  // Dropdown styles
  dropdownBg: 'bg-gray-50',
  dropdownBorder: 'ring-emerald-200',
  dropdownShadow: 'shadow-lg',
  
  // Option styles
  optionText: 'text-gray-700',
  optionHover: 'hover:bg-emerald-50',
  
  // Icon color (using currentColor which inherits from text color)
  iconColor: 'currentColor',
};

// Dropdown options (can be customized)
const DROPDOWN_OPTIONS = [
  { value: 'a-z', label: 'Sort by: A-Z' },
  { value: 'z-a', label: 'Sort by: Z-A' },
  { value: 'highest-points', label: 'Sort by: Highest Points' },
  { value: 'lowest-points', label: 'Sort by: Lowest Points' }
];

// Default selected option
const DEFAULT_OPTION = 'Sort by: A-Z';
// ===== END COLOR CONFIGURATION =====

export default function DropDown({ onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(DEFAULT_OPTION);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option) => {
    setSelectedOption(option.label);
    setIsOpen(false);
    onSortChange?.(option.value);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border ${COLOR_CONFIG.buttonBorder} ${COLOR_CONFIG.buttonBg} px-4 py-2 text-sm font-medium ${COLOR_CONFIG.buttonText} shadow-sm ${COLOR_CONFIG.buttonHover} focus:outline-none focus:ring-2 ${COLOR_CONFIG.buttonFocus}`}
      >
        {selectedOption}
        <svg className={`h-4 w-4`} fill="none" stroke={COLOR_CONFIG.iconColor} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full z-10 mt-1 w-48 rounded-lg ${COLOR_CONFIG.dropdownBg} py-1 ${COLOR_CONFIG.dropdownShadow} ring-1 ${COLOR_CONFIG.dropdownBorder}`}>
          {DROPDOWN_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option)}
              className={`block w-full px-4 py-2 text-left text-sm ${COLOR_CONFIG.optionText} ${COLOR_CONFIG.optionHover}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}