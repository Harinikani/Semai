"use client";

import { Edit } from 'lucide-react';

const EditButton = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors 
               border border-gray-300 hover:border-gray-400" 
    // ^^^ Add border classes here
  >
    <Edit size={16} />
  </button>
);

export default EditButton;