"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const BackButton = ({ to }) => {
  const router = useRouter();

  const handleClick = () => {
    if (to) {
      router.push(to);   // Go to the given link
    } else {
      router.back();     // Go back to previous page
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center p-2 rounded-full border-2 border-emerald-500 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors duration-200 shadow-sm"
    >
      <ChevronLeft size={24} />
    </button>
  );
};

export default BackButton;