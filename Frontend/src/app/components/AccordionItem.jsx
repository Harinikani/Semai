"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const AccordionItem = ({
  title,
  children,
  preview, // Optional preview content
  showViewMore = true, // Toggle to show/hide "View more" button
  onOpen,
  onClose,
  bgColor = "bg-gray-50",
  borderColor = "border-gray-200",
  hoverBorderColor = "hover:border-gray-300",
  titleColor = "text-gray-800",
  chevronColor = "text-gray-400",
  chevronHoverColor = "group-hover:text-gray-600",
  buttonTextColor = "text-gray-800",
  closeButtonBg = "bg-red-500",
  closeButtonHoverBg = "bg-red-500",
  buttonHoverColor = "hover:text-blue-800",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      if (newState && onOpen) {
        onOpen(title);
      } else if (!newState && onClose) {
        onClose(title);
      }
      return newState;
    });
  };

  // The 'max-height' CSS property is key for a smooth slide-down transition.
  // We use the ref to dynamically get the content's full height.
  const contentHeight = isOpen
    ? contentRef.current
      ? contentRef.current.scrollHeight
      : "auto"
    : 0;

  // Note: 'h-auto' or 'max-h-none' must be used when open to avoid cutting off content,
  // but for a smooth transition, we calculate the max-height value.
  // Using a fixed large number like 500px might work if your content height is consistent,
  // but calculating scrollHeight is more robust.

  return (
    <div
      className={`rounded-xl shadow-md border ${borderColor} ${bgColor} overflow-hidden transition-all duration-300 ease-in-out group`}
    >
      {/* Header/Title - Clickable Area */}
      <button
        className={`w-full flex justify-between items-center p-4 ${bgColor} ${hoverBorderColor} transition-colors`}
        onClick={toggleOpen}
      >
        <h3 className={`text-lg font-semibold ${titleColor} transition-colors`}>
          {title}
        </h3>
        {/* Chevron Icon - Rotates when open */}
        <ChevronDown
          className={`h-5 w-5 ${chevronColor} transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          } ${chevronHoverColor}`}
        />
      </button>

      {/* Preview Content - Shows when closed (optional) */}
      {!isOpen && preview && (
        <div className="px-4">
          <div className="pb-3">
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line line-clamp-3">
              {preview}
            </p>
          </div>
          {showViewMore && (
            <div className="flex justify-center">
              <button
                onClick={toggleOpen}
                className={`p-4 text-sm font-medium ${buttonTextColor} ${buttonHoverColor} transition-colors`}
              >
                View Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Content Area - Slides down */}
      <div
        ref={contentRef}
        // Tailwind class for smooth transition on max-height
        style={{ maxHeight: isOpen ? `${contentHeight}px` : "0px" }}
        className={`transition-[max-height] duration-500 ease-in-out overflow-hidden`}
      >
        <div className="px-4">
          {/* Padding is applied inside the transitioning div to avoid padding issues */}
          {children}
        </div>
        <div className="flex justify-center">
          <button
            onClick={toggleOpen}
            className={`px-12 py-3 mb-2 ${closeButtonBg} text-white font-semibold rounded-xl ${closeButtonHoverBg} transition-colors shadow-sm`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccordionItem;
