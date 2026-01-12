"use client";

import { useState } from 'react';
import { Edit } from 'lucide-react';

const InputBox = ({ label, type = "text", value, onChange, placeholder, required=false, autoFocus=false }) => {
  const [currentValue, setCurrentValue] = useState(value || "");

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
    if (onChange) {
      onChange(e.target.value); // pass value up to parent
    }
  };

  return (
    <div className="flex flex-col py-2">
      <label className="text-gray-800 font-semibold mb-1">{label}</label>
      <input 
        type={type}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-md px-3 py-2 bg-transparent outline-none border border-emerald-300 focus:border-emerald-500 transition-colors text-gray-600"
      />
    </div>
  );
};

export default InputBox;
