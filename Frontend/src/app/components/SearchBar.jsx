import React, { useState, useEffect, useRef } from "react";

const SearchBar = ({ placeholder = "Search by name or ID", onSearch, debounceMs = 400 }) => {
  const [value, setValue] = useState("");
  const timeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setValue(v);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSearch?.(v);
    }, debounceMs);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        value={value}
        type="text"
        placeholder={placeholder}
        className="shadow-sm w-full pl-10 pr-4 py-2 bg-gray-50 border border-emerald-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        onChange={handleInputChange}
      />
    </div>
  );
};

export default SearchBar;