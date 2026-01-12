"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Navigation from '@/app/components/Navigation';
import BackButton from '@/app/components/BackButton';
import SearchBar from '@/app/components/SearchBar';
import StoryPreview from '@/app/components/StoryPreview';
import BigBox from '@/app/components/BigBox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';

export default function StoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopularSheetOpen, setIsPopularSheetOpen] = useState(false);

  const popularStories = [
      { id: 1, title: 'Hornbill', image: 'https://shorturl.at/foUcd' },
      { id: 2, title: 'Blue Ringed Octopus', image: 'https://shorturl.at/1Q6rq' },
      { id: 3, title: 'Poison Dart Frog', image: 'https://shorturl.at/GxmQu' },
      { id: 4, title: 'Sea Turtle', image: 'https://shorturl.at/eKMJ9' },
      { id: 5, title: 'Orangutan', image: 'https://shorturl.at/pKkvA' },
      { id: 6, title: 'Rafflesia', image: 'https://shorturl.at/EmiY5' }
    ];

  const allStories = [
    ...popularStories,
    { id: 7, title: 'Elephant', image: 'https://shorturl.at/GxmQu' },
    { id: 8, title: 'Tiger', image: 'https://shorturl.at/GxmQu' },
    { id: 9, title: 'Panda', image: 'https://shorturl.at/GxmQu' },
    { id: 10, title: 'Penguin', image: 'https://shorturl.at/GxmQu' },
    { id: 11, title: 'Dolphin', image: 'https://shorturl.at/GxmQu' },
    { id: 12, title: 'Eagle', image: 'https://shorturl.at/GxmQu' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter logic would go here
  };

  const handleStoryClick = (storyId) => {
    router.push(`/story/${storyId}`);
  };

  const handleViewAllStories = () => {
    setIsPopularSheetOpen(true);
  };

  const renderStoryItem = (story) => (
    <div 
      key={story.id}
      onClick={() => handleStoryClick(story.id)}
      className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors mb-4"
    >
      <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-200">
        <img
          src={story.image}
          alt={story.title}
          className="w-12 h-12 object-cover rounded"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-800">{story.title}</h3>
        <button 
          className="flex items-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors mt-1"
        >
          Read the full story
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-md mx-auto min-h-screen pb-24">
        
        {/* Header with Back Button and Search Bar Side by Side */}
        <div className="pt-6 px-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex-1 min-w-0">
              <SearchBar 
                placeholder="Search by name or ID"
                onSearch={handleSearch}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pt-6">
          
          {/* Popular Stories using BigBox Component */}
          <BigBox
            title="Popular Stories"
            actionText="View All"
            onActionClick={handleViewAllStories}
            gradientFrom="from-blue-50"
            gradientTo="to-emerald-50"
          >
            <div className="grid grid-cols-2 gap-4">
              {popularStories.map((story) => (
                <div 
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-200">
                    <div className="relative h-32">
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-end">
                        <h3 className="text-white font-semibold text-sm p-3">
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BigBox>

          {/* Featured Story Preview */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Featured Story</h2>
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-emerald-200">
              <div className="relative">
                <img
                  src="https://shorturl.at/GxmQu"
                  alt="Story image"
                  className="w-full h-48 object-cover"
                />
                
                <div className="absolute inset-0 bg-black/40 flex items-end">
                  <h1 className="text-3xl font-bold text-white p-6">The Colorful Warning</h1>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-800">
                  A tiny frog with a big secret. Discover the vibrant world of the poison dart frog.
                </p>
              </div>
            </div>
          </section>

          {/* Recent Stories - Regular Section without BigBox */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Stories</h2>
            <div className="space-y-4">
              {popularStories.slice(0, 3).map((story) => (
                <div 
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-200">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{story.title}</h3>
                    <button 
                      className="flex items-center text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors mt-1"
                    >
                      Read the full story
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Sheet for All Stories */}
    <Sheet open={isPopularSheetOpen} onOpenChange={setIsPopularSheetOpen}>
    <SheetContent side="bottom" className="h-[85vh] max-w-md mx-auto">
        <SheetHeader>
        <SheetTitle className="text-xl font-bold text-gray-800">All Stories</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 overflow-y-auto pb-8 px-4">
        {allStories.map(renderStoryItem)}
        </div>
    </SheetContent>
    </Sheet>
    </div>
  );
}