"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, Brain , BookOpen} from "lucide-react";
import PageHeader from "@/app/components/PageHeader";
import Image from "next/image";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/Breadcrumb';

export default function LearnPage() {
  const router = useRouter();

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
              <BreadcrumbPage>Learn</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* <div className="mx-auto max-w-2xl">
          <PageHeader
            title="Explore wildlife facts"
            subtitle="Test your knowledge and earn points"
          />
        </div> */}

        

        {/* Illustration Placeholder */}
        {/* <div className={"max-w-xs mb-1 mx-auto animate-fade-in"}>
          <div className="relative aspect-square overflow-hidden">
            <Image
              src="/semai-elephant-study.png"
              alt="Explore wildlife facts"
              fill
              className="object-contain"
            />
          </div>
        </div> */}

        {/* Main Content */}
        <div className="py-2 px-6">
          {/* Flash Cards Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/flash-card")}
              className="w-full bg-gradient-to-br from-yellow-50 to-pink-50 border border-amber-300 rounded-2xl p-4 px-6 shadow-sm flex items-center justify-between hover:bg-yellow-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-xl text-gray-800">
                    Flash Cards
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Swipe and learn about wildlife
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-amber-500" />
            </button>
          </div>

          {/* Quizzes Button */}
          <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 px-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-xl text-gray-800">Quizzes</h3>
                <p className="text-gray-600 text-sm">Test your wildlife knowledge</p>
              </div>
            </div>

            {/* General Quiz Option */}
            <button
              onClick={() => router.push("/quiz/general_quiz")}
              className="w-full text-left bg-emerald-100/70 hover:bg-emerald-200/90 transition-all duration-200 rounded-xl p-3 px-4 flex items-center justify-between mb-3 active:scale-[0.99]"
            >
              <div>
                <h4 className="font-semibold text-lg text-gray-800">General Quiz</h4>
                <p className="text-gray-600 text-sm">Covers general species</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-600" />
            </button>

            {/* Specific Quiz Option */}
            <button
              onClick={() => router.push("/quiz/specific_quiz")}
              className="w-full text-left bg-teal-100/70 hover:bg-teal-200/90 transition-all duration-200 rounded-xl p-3 px-4 flex items-center justify-between active:scale-[0.99]"
            >
              <div>
                <h4 className="font-semibold text-lg text-gray-800">Specific Quiz</h4>
                <p className="text-gray-600 text-sm">Covers discovered species</p>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-600" />
            </button>
          </div>
            {/* Books */}
            <div className="mb-6">
            <button
              onClick={() => router.push("/books")}
              className="w-full bg-gradient-to-br from-pink-50 to-pink-50 border border-pink-300 rounded-2xl p-4 px-6 shadow-sm flex items-center justify-between hover:bg-yellow-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-xl text-gray-800">
                    Books
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get educational books
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-pink-400" />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}