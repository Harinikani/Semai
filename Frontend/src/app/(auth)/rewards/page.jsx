// app/rewards/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { QrCode, Clock, Coins, Loader2 } from 'lucide-react';
import BigBox from '@/app/components/BigBox';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose 
} from '@/components/ui/sheet';
import { CountingNumber } from '@/components/ui/shadcn-io/counting-number';
import { useRouter } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/Breadcrumb';

const RewardsPage = () => {
  const router = useRouter();
  const [currency, setCurrency] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [openSheet, setOpenSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  // Fetch user currency and vouchers on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        alert('Please login first');
        router.push('/login');
        return;
      }

      // Fetch currency 
      const currencyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/points/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (currencyResponse.ok) {  
        const currencyData = await currencyResponse.json(); 
        console.log("💰 Currency response:", currencyData);
        setCurrency(currencyData.currency || currencyData.points || 0);
        
        // Update localStorage with latest currency
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          user.currency = currencyData.currency || currencyData.points || 0;
          localStorage.setItem('user_data', JSON.stringify(user));
        }
      } else {
        console.error("❌ Failed to fetch currency:", currencyResponse.status);
        // Try alternative endpoint
        try {
          const altResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vouchers/currency`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const altCurrency = altData.currency || 0;
            setCurrency(altCurrency);
            
            // Update localStorage
            const storedUserData = localStorage.getItem('user_data');
            if (storedUserData) {
              const user = JSON.parse(storedUserData);
              user.currency = altCurrency;
              localStorage.setItem('user_data', JSON.stringify(user));
            }
          }
        } catch (altError) {
          console.error("❌ Alternative endpoint also failed:", altError);
        }
      }

      // Fetch available vouchers
      const availableResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vouchers/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (availableResponse.ok) {
        const vouchers = await availableResponse.json();
        setAvailableVouchers(vouchers);
      }

      // Fetch user's vouchers
      const myVouchersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vouchers/my-vouchers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (myVouchersResponse.ok) {
        const userVouchers = await myVouchersResponse.json();
        setMyVouchers(userVouchers);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use localStorage as fallback
      const storedUserData = localStorage.getItem('user_data');
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        setCurrency(user.currency || user.points || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemVoucher = async (voucher) => {
    // Use currency_required if available, fallback to points_required
    const cost = voucher.currency_required || voucher.points_required;
    
    if (currency < cost) {
      alert(`Not enough coins! You need ${cost} coins but only have ${currency}.`);
      return;
    }

    if (!confirm(`Redeem ${voucher.title} for ${cost} coins?`)) {
      return;
    }

    try {
      setRedeeming(voucher.id);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vouchers/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucher_id: voucher.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully redeemed ${voucher.title}!`);
        
        // Update localStorage with new currency immediately
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          user.currency = currency - cost;
          localStorage.setItem('user_data', JSON.stringify(user));
        }
        
        // Update local state immediately
        setCurrency(prev => prev - cost);
        
        // Refresh data to reflect changes
        await fetchUserData();
      } else {
        alert(`Failed to redeem voucher: ${result.detail}`);
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      alert('Error redeeming voucher');
    } finally {
      setRedeeming(null);
    }
  };

  const handleViewQR = (voucher) => {
    alert(`QR Code for ${voucher.voucher_title}:\nRedemption Code: ${voucher.redemption_code}\n\nShow this code at the merchant to redeem your voucher.`);
  };

  const handleUseVoucher = async (voucher) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/vouchers/use/${voucher.redemption_code}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert('Voucher marked as used!');
        // Refresh data
        await fetchUserData();
      } else {
        alert(`Failed to use voucher: ${result.detail}`);
      }
    } catch (error) {
      console.error('Error using voucher:', error);
      alert('Error using voucher');
    }
  };

  const handleViewAll = (sheetType) => {
    setOpenSheet(sheetType);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const renderVoucherCard = (voucher, isMyVoucher = false) => {
    // Add function to calculate days until expiration
    const getDaysUntilExpiration = (dateString) => {
      const today = new Date();
      const expiryDate = new Date(dateString);
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // Use currency_required if available, fallback to points_required
    const cost = voucher.currency_required || voucher.points_required;

    // Determine if date should be red (for My Vouchers only)
    const isExpiringSoon = isMyVoucher &&
                           !voucher.is_used &&
                           getDaysUntilExpiration(voucher.expires_at) < 10 &&
                           getDaysUntilExpiration(voucher.expires_at) >=0;
    
    return (
      <div key={voucher.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        {/* First Row: Two Columns - Title (Left) and Expiry (right) */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-800">
            {isMyVoucher ? voucher.voucher_title : voucher.title}
          </h3>
          <div className={`text-right ${isExpiringSoon ? 'text-red-600' : 'text-amber-600'}`}>
            <div className="flex flex-col items-end">
              <div className="text-left">
                <span className="text-sm font-medium">Expire:</span>
                <div className="flex items-center justify-start">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="text-sm">{formatDate(isMyVoucher ? voucher.expires_at : voucher.expiry_date)}</span>
                </div>
                {isExpiringSoon && (
                  <span className="text-xs font-medium">(Soon!)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: One Column - Description */}
        {(voucher.description || voucher.voucher_description) && (
          <p className="text-sm text-gray-600 mb-3">
            {isMyVoucher ? voucher.voucher_description : voucher.description}
          </p>
        )}
        
        {isMyVoucher && voucher.merchant_name && (
          <p className="text-sm text-gray-500 mb-2">
            Merchant: {voucher.voucher_merchant_name}
          </p>
        )}
        
        {/* Third Row: Two Columns - Code (left) and Buttons (right) */}
        <div className="flex justify-between items-center">
          {isMyVoucher ? (
            <>
              <div className="text-left">
                <div className="text-sm text-gray-500 mb-1">Code:</div>
                <div className="font-mono text-sm text-gray-800">
                  {voucher.redemption_code}
                </div>
              </div>
              {/* <div className="flex gap-2">
                {!voucher.is_used && (
                  <button 
                    onClick={() => handleUseVoucher(voucher)}
                    className="flex items-center bg-emerald-400 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
                  >
                    Mark Used
                  </button>
                )}
                <button 
                  onClick={() => handleViewQR(voucher)}
                  className="flex items-center bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  View Code
                </button>
              </div> */}
            </>
            ) : (
            <>
              <div className="flex items-center text-emerald-600 font-semibold">
                <Coins className="w-4 h-4 mr-1" />
                {cost} coins
              </div>
              <button 
                onClick={() => handleRedeemVoucher(voucher)}
                disabled={redeeming === voucher.id || currency < cost}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {redeeming === voucher.id ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                Redeem
              </button>
            </>
          )}
        </div>
        {isMyVoucher && voucher.is_used && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            ✓ Used on {voucher.used_at ? formatDate(voucher.used_at) : 'previously'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-gray-600">Loading rewards...</span>
        </div>
      </div>
    );
  }

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
              <BreadcrumbPage>Rewards</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Currency Section - Centered */}
        <div className="px-6 pt-2 pb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="text-center">
              <p className="text-emerald-100 text-lg font-medium mb-2">Your Coins</p>
              <CountingNumber 
                number={currency}
                duration={1500}
                transition={
                  currency > 500
                  ? { stiffness: 150, damping: 40 }
                  : { stiffness: 90, damping: 50 }
                }
                className="text-4xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          
          {/* Available Vouchers Section */}
          <BigBox 
            title="Available Vouchers"
            actionText="View All"
            onActionClick={() => handleViewAll('available')}
            gradientFrom="from-emerald-50"
            gradientTo="to-teal-50"
          >
            <div className="space-y-4">
              {availableVouchers.slice(0, 2).map((voucher) => renderVoucherCard(voucher, false))}
              {availableVouchers.length === 0 && (
                <p className="text-gray-500 text-center py-4">No vouchers available</p>
              )}
            </div>
          </BigBox>

          {/* My Vouchers Section */}
          <BigBox 
            title="My Vouchers"
            actionText="View All"
            onActionClick={() => handleViewAll('myVouchers')}
            gradientFrom="from-pink-50"
            gradientTo="to-fuchsia-50"
          >
            <div className="space-y-4">
              {myVouchers.slice(0, 2).map((voucher) => renderVoucherCard(voucher, true))}
              {myVouchers.length === 0 && (
                <p className="text-gray-500 text-center py-4">You haven't redeemed any vouchers yet</p>
              )}
            </div>
          </BigBox>

        </div>

        {/* Available Vouchers Sheet */}
        <Sheet open={openSheet === 'available'} onOpenChange={(open) => !open && handleCloseSheet()}>
          <SheetContent side="bottom" className="p-0 bg-white border border-emerald-100 max-w-[430px] mx-auto">
            <div className="flex flex-col h-full p-6 max-w-[430px] mx-auto w-full bg-white">
              <SheetHeader className="text-left border-b border-emerald-100 pb-4 mb-4">
                <SheetTitle className="text-emerald-700 text-2xl font-bold">All Available Vouchers</SheetTitle>
                <SheetDescription className="text-emerald-600">
                  Browse and redeem available vouchers
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-2 flex-grow overflow-y-auto bg-white rounded-lg">
                <div className="space-y-4">
                  {availableVouchers.map((voucher) => renderVoucherCard(voucher, false))}
                  {availableVouchers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No vouchers available</p>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-emerald-100">
                <SheetClose asChild>
                  <button className="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                    Close
                  </button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* My Vouchers Sheet */}
        <Sheet open={openSheet === 'myVouchers'} onOpenChange={(open) => !open && handleCloseSheet()}>
          <SheetContent side="bottom" className="p-0 bg-white border border-emerald-100 max-w-[430px] mx-auto">
            <div className="flex flex-col h-full p-6 max-w-[430px] mx-auto w-full bg-white">
              <SheetHeader className="text-left border-b border-emerald-100 pb-4 mb-4">
                <SheetTitle className="text-emerald-700 text-2xl font-bold">My Vouchers</SheetTitle>
                <SheetDescription className="text-emerald-600">
                  View and manage your vouchers
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-2 flex-grow overflow-y-auto bg-white rounded-lg">
                <div className="space-y-4">
                  {myVouchers.map((voucher) => renderVoucherCard(voucher, true))}
                  {myVouchers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">You haven't redeemed any vouchers yet</p>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-emerald-100">
                <SheetClose asChild>
                  <button className="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                    Close
                  </button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>

      </div>
    </div>
  );
};

export default RewardsPage;