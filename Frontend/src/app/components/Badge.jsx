import { Lock } from 'lucide-react';
import React from 'react';

/**
 * Renders the circular badge icon itself, including the background color gradient 
 * and the content (either the icon emoji or the Lock icon).
 * * @param {object} props
 * @param {string} props.color - Tailwind gradient classes (e.g., 'from-amber-400 to-yellow-500').
 * @param {string} props.icon - The emoji or symbol representing the badge category.
 * @param {boolean} props.isLocked - Whether the badge is in a locked state.
 */
const Badge = ({ color, icon, isLocked }) => (
  // This div creates the circular shape using w-20, h-20, and rounded-full
  <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-4xl shadow-lg relative`}>
    {isLocked ? (
      // Display the lock icon when the badge is locked
      <Lock className="w-8 h-8 text-gray-500" />
    ) : (
      // Display the category icon when the badge is unlocked
      <span>{icon}</span>
    )}
  </div>
);

export default Badge;
