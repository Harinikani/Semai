"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

// Main App component
const Page = () => {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const selectQuiz = (type) => {
    setSelectedQuiz(type);

    // Navigate to the quiz page after a short delay
    setTimeout(() => {
      if (type === "general") {
        router.push("/quiz/general_quiz");
      } else {
        router.push("/quiz/specific_quiz");
      }
    }, 1500);
  };

  // Function to render the main selection options
  const renderQuizOptions = () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* General Knowledge Quiz Button */}
      <button
        className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 
                   text-2xl font-bold text-gray-800 cursor-pointer 
                   shadow-lg border-2 border-green-200 transition-all duration-300 
                   ease-in-out hover:shadow-xl hover:border-green-300 
                   hover:from-green-100 hover:to-emerald-200 
                   focus:outline-none focus:ring-4 focus:ring-green-200"
        onClick={() => selectQuiz("general")}
        aria-label="Start General Knowledge Quiz"
      >
        <div className="flex flex-col items-center">
          General Knowledge
          <div className="text-lg font-normal text-gray-600 mt-3">
            General questions about animals
          </div>
        </div>
      </button>

      {/* Specific Topic Quiz Button */}
      <button
        className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-8 
                   text-2xl font-bold text-gray-800 cursor-pointer 
                   shadow-lg border-2 border-amber-200 transition-all duration-300 
                   ease-in-out hover:shadow-xl hover:border-amber-300 
                   hover:from-amber-100 hover:to-orange-200 
                   focus:outline-none focus:ring-4 focus:ring-amber-200"
        onClick={() => selectQuiz("specific")}
        aria-label="Start Specific Topic Quiz"
      >
        <div className="flex flex-col items-center">
          Specific Topic Quiz
          <div className="text-lg font-normal text-gray-600 mt-3">
            Focus on what animals you have discovered
          </div>
        </div>
      </button>
    </div>
  );

  // Function to render the loading/confirmation message
  const renderConfirmation = () => (
    <div className="p-10 bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl shadow-xl border-2 border-green-200 animate-pulse">
      <div className="flex flex-col items-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">
          {selectedQuiz === "general"
            ? "Loading General Knowledge Quiz..."
            : "Preparing Specific Quiz..."}
        </p>
        <p className="text-lg text-gray-600 mb-4">
          Get ready to test your knowledge!
        </p>
        <svg
          className="animate-spin h-10 w-10 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto pb-20">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Quiz</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Choose your challenge and test your knowledge
          </h1>
        </div> */}

        {/* Centered content card */}
        <div className="flex flex-col items-center justify-center text-center w-full max-w-lg p-6">
          {/* Conditional rendering based on selection state */}
          {selectedQuiz ? renderConfirmation() : renderQuizOptions()}

          {/* Footer text */}
          <p className="mt-8 text-gray-500 text-sm">
            Select a quiz type to begin your learning journey
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
