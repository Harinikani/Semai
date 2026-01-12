"use client";

import { Home, BookOpen, Camera, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SpeciesScanner from "./SpeciesScanner"; // Adjust path as needed

const navItems = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: BookOpen, label: "Learn", href: "/learn" },
  { icon: Camera, label: "Scan", href: "#" },
  { icon: Trophy, label: "Rewards", href: "/rewards" },
  { icon: Users, label: "Friends", href: "/friends" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isScanButton = item.label === "Scan";

            if (isScanButton) {
              return (
                <button
                  key={item.label}
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-1 flex flex-col items-center gap-0.5 -mt-4"
                >
                  <div
                    className="hover:opacity-90 transition-all rounded-full p-3 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500"
                    // style={{ backgroundColor: "var(--main-color)" }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-black mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                  isActive
                    ? "text-green-600"
                    : "text-black hover:text-green-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium text-black">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Species Scanner Modal Overlay */}
      <SpeciesScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}