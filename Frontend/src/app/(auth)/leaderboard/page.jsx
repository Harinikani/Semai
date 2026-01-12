"use client";

import { Inter } from 'next/font/google'
import AvatarIcon from '@/app/components/AvatarIcon'
import Leaderboard from '@/app/components/Leaderboard'
import { useState, useEffect } from 'react'
import { Crown } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

const inter = Inter({ subsets: ['latin'] })

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetch(`${apiUrl}/users/rankings`);
        if (response.ok) {
          const data = await response.json();
          setTopUsers(data);
        }
      } catch (error) {
        console.error('Error fetching top users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

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
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="px-6 w-full bg-gray-50 p-0 flex flex-col">
          {/* Header with Back Button and Title in same row */}
          <div className="items-center justify-between mb-6 pt-4">
            
            {/* Header Text */}
            <div className="text-center flex-1 mx-4">
              <h3 className="font-bold text-gray-600 text-xl">Top performers this week</h3>
            </div>
            
            {/* Empty spacer for balance - same width as back button */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
          
          {/* Top 3 Users Podium - Mobile Optimized */}
          {!loading && topUsers.length >= 3 && (
            <div className="flex justify-between items-end mb-8 mt-4 px-2">
              
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1 transform hover:scale-105 transition-transform duration-300">
                <div className="relative mb-2">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold px-2 py-1 rounded-full z-10 text-xs min-w-[2rem] text-center">
                    2nd
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur-sm opacity-60"></div>
                    <AvatarIcon 
                      buttonSize="w-12 h-12"  
                      iconSize="w-5 h-5"      
                      backgroundColor="bg-gradient-to-r from-gray-300 to-gray-400"
                      hoverColor="hover:from-gray-400 hover:to-gray-500"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-xs mb-1 truncate max-w-[80px]">
                    {topUsers[1]?.name || 'User 2'}
                  </h3>
                  <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    <span className="text-xs">🏆</span> {topUsers[1]?.points || 0}
                  </p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center relative flex-1 transform hover:scale-105 transition-transform duration-300 mx-2">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-sm animate-pulse"></div>
                    <Crown className="w-6 h-6 relative z-10 text-yellow-400 animate-bounce" />
                  </div>
                </div>
                <div className="relative mb-2">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold px-2 py-1 rounded-full z-10 text-xs min-w-[2rem] text-center">
                    1st
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full blur-sm opacity-60"></div>
                    <AvatarIcon 
                      buttonSize="w-14 h-14"  
                      iconSize="w-6 h-6"      
                      backgroundColor="bg-gradient-to-r from-yellow-300 to-yellow-400"
                      hoverColor="hover:from-yellow-400 hover:to-yellow-500"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-sm mb-1 truncate max-w-[80px]">
                    {topUsers[0]?.name || 'User 1'}
                  </h3>
                  <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    <span className="text-xs">🏆</span> {topUsers[0]?.points || 0}
                  </p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1 transform hover:scale-105 transition-transform duration-300">
                <div className="relative mb-2">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-2 py-1 rounded-full z-10 text-xs min-w-[2rem] text-center">
                    3rd
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur-sm opacity-60"></div>
                    <AvatarIcon 
                      buttonSize="w-12 h-12"  
                      iconSize="w-5 h-5"      
                      backgroundColor="bg-gradient-to-r from-amber-400 to-amber-500"
                      hoverColor="hover:from-amber-500 hover:to-amber-600"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-xs mb-1 truncate max-w-[80px]">
                    {topUsers[2]?.name || 'User 3'}
                  </h3>
                  <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    <span className="text-xs">🏆</span> {topUsers[2]?.points || 0}
                  </p>
                </div>
              </div>
              
            </div>
          )}

          {/* Loading State for Podium */}
          {loading && (
            <div className="flex justify-between items-end mb-8 px-2">
              {[2, 1, 3].map((rank) => (
                <div key={rank} className={`flex flex-col items-center flex-1 ${rank === 1 ? 'mx-2' : ''}`}>
                  <div className="relative mb-2">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-300 text-transparent font-bold px-2 py-1 rounded-full z-10 text-xs min-w-[2rem] text-center animate-pulse">
                      {rank}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-300 rounded-full blur-sm opacity-60"></div>
                      <div className={`relative bg-gray-200 rounded-full ${rank === 1 ? 'w-14 h-14' : 'w-12 h-12'} flex items-center justify-center animate-pulse`}>
                        <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Table - Using default props */}
          <div className="flex-1">
            <Leaderboard />
          </div>

        </div>
      </div>
    </div>
  )
}