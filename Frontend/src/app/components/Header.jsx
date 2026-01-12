// components/Header.jsx
"use client";

import { usePathname } from "next/navigation";
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  
  // Set title based on current route
  const getTitle = () => {
    if (pathname === '/login') return 'Login';
    if (pathname === '/register') return 'Register';
    if (pathname === '/rewards') return 'Rewards';
    if (pathname === '/profile') return 'Profile';
    if (pathname === '/badges') return 'Badges';
    if (pathname === '/home') return 'Home';
    if (pathname === '/species') return 'Species';
    if (pathname === '/learn') return 'Learn';
    if (pathname === '/flash-card') return 'Flash Card';
    if (pathname === '/quiz') return 'Quiz';
    if (pathname === '/quiz/general_quiz') return 'General Quiz';
    if (pathname === '/quiz/specific_quiz') return 'Specific Quiz';
    if (pathname === '/animal') return 'Animal';
    if (pathname === '/social') return 'Social';
    if (pathname === '/friends') return 'Friends';
    if (pathname === '/leaderboard') return 'Leaderboard';
    if (pathname === '/books') return 'Books';
    return 'App'; // default
  };

  return (
    <header className="
    bg-gradient-to-r from-emerald-500 to-teal-500
    border border-emerald-300
    sticky top-0 z-10 px-4 pt-[max(0.2rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between px-2 max-w-screen-xl mx-auto">
        {/* Logo without any background container */}
        <div>
        <Link href="/home">
          <img 
            src="/mascot.png"
            alt="App Mascot"
            className="w-19 h-19 cursor-pointer hover:opacity-80 transition-opacity" // Removed drop-shadow-lg if it had background
          />
        </Link>
        </div>
        
        {/* Dynamic Title (Center) */}
        <div className="welcome-container">
          <h1 className="welcome-text">
            {getTitle()}
          </h1>
        </div>
        
        {/* Spacer (Right) */}
        <div className="w-19 h-19"> {/* Same size as logo for balance */}
        </div>
      </div>
    </header>
  );
}