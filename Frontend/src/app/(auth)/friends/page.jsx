'use client';
import React, { useState } from 'react';
import FriendsTab from '@/app/components/FriendsTab';
import MyFriends from '@/app/components/MyFriends';
import DropDown from '@/app/components/DropDown';
import SearchBar from '@/app/components/SearchBar';
import AddFriendsTab from '@/app/components/AddFriendsTab';
import RequestsTab from '@/app/components/RequestsTab';
import PageHeader from '@/app/components/PageHeader';
import FriendsStats from '@/app/components/FriendsStats';
import CommunityStats from '@/app/components/CommunityStats';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/Breadcrumb';

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('My Friends');
  const [sortOption, setSortOption] = useState('a-z');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sortValue) => {
    setSortOption(sortValue);
  };

  const renderTabContent = () => {
    const tabComponents = {
      'My Friends': (
        <div className="space-y-6">
          <MyFriends sortOption={sortOption} searchQuery={searchQuery} />
        </div>
      ),
      'Add Friends': <AddFriendsTab searchQuery={searchQuery} onSearch={handleSearch} />,
      'Requests': <RequestsTab />
    };
   
    return tabComponents[activeTab];
  };

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
              <BreadcrumbPage>Friends</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mx-auto max-w-2xl px-6 pt-2">
          {/* <PageHeader
            title="Connect with other explorers"
            subtitle="Build your community and share your journey"
          /> */}

          <FriendsTab activeTab={activeTab} setActiveTab={setActiveTab} className="mt-6" />

          {activeTab === 'My Friends' && (
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1">
                <SearchBar
                  placeholder="Search friends by name"
                  onSearch={handleSearch}
                />
              </div>
              <div className="flex-shrink-0">
                <DropDown onSortChange={handleSortChange} />
              </div>
            </div>
          )}

          <div className="mt-6">
            {renderTabContent()}
          </div>

          {activeTab === 'My Friends' && <CommunityStats />}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;