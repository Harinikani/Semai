"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ONBOARDING_SLIDES = [
  {
    icon: "📷",
    title: "Welcome to SEMAI",
    description:
      "Our aim is to 'semai' (to cultivate) appreciation of nature through education and gamification.",
    image: "/semai-elephant-hi.png",
  },
  {
    icon: "🔎",
    title: "Identify Wildlife",
    description:
      "Snap photos and discover animals around you with AI-powered identification.",
    image: "/semai-elephant-snap.png",
  },
  {
    icon: "🏆",
    title: "Learn Through Play",
    description:
      "Explore facts about wildlife, then challenge yourself with games and earn rewards!",
    image: "/semai-elephant-learn.png",
  },
  {
    icon: "🌏",
    title: "Make Real Impact",
    description:
      "Help protect endangered species by reporting sightings and contributing to conservation efforts.",
    image: "/semai-elephant-happy.png",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState("right");

  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.push("/login");
    } else {
      setDirection("right");
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push("/login");
  };

  const handleDotClick = (index) => {
    setDirection(index > currentSlide ? "right" : "left");
    setCurrentSlide(index);
  };

  // Swipe handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < ONBOARDING_SLIDES.length - 1) {
      setDirection("right");
      setCurrentSlide((prev) => prev + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setDirection("left");
      setCurrentSlide((prev) => prev - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div
      className={`${geistSans.className} min-h-screen bg-gray-50 flex flex-col transition-all duration-500`}
      style={{ minHeight: '100vh', minHeight: '100dvh' }}
    >
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-full transition-all duration-200 bg-gray-100"
        >
          Skip
        </button>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-4 pb-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: 0 }}
      >
        {/* Illustration Placeholder */}
        <div 
          key={`image-${currentSlide}`}
          className={`w-full mb-6 animate-slide-${direction}`}
          style={{ maxWidth: '320px' }}
        >
          <div className="relative w-full" style={{ paddingBottom: '100%' }}>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-contain"
              priority={currentSlide === 0}
            />
          </div>
        </div>

        {/* Text Content */}
        <div 
          key={`text-${currentSlide}`}
          className={`text-center w-full px-2 animate-slide-${direction}`}
          style={{ maxWidth: '400px', minHeight: '120px' }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {slide.title}
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pb-6 px-4" style={{ flexShrink: 0 }}>
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-emerald-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full mx-auto block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg text-base"
          style={{ maxWidth: '400px' }}
        >
          {isLastSlide ? "Get Started" : "Next"}
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-right {
          from {
            opacity: 0.3;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-left {
          from {
            opacity: 0.3;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-right {
          animation: slide-right 0.6s cubic-bezier(0.2, 0, 0.2, 1);
        }

        .animate-slide-left {
          animation: slide-left 0.6s cubic-bezier(0.2, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}