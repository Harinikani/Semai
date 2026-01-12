import React, { useState } from "react";
import ShareActionSheet from "./ShareActionSheet";

const InviteSection = () => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const inviteCode = "EXPLORER-5A8B2";

  const handleOpenActionSheet = () => {
    setIsActionSheetOpen(true);
  };

  const handleCloseActionSheet = () => {
    setIsActionSheetOpen(false);
  };

  return (
    <>
      <div
        className="flex items-center gap-4 bg-white w-full p-4 text-center shadow-lg
          border border-emerald-200 rounded-2xl
          transition-all duration-200 ease-in-out cursor-pointer
          hover:shadow-sm hover:scale-[1.02] 
          active:scale-[0.98]"
        onClick={handleOpenActionSheet}
      >
        {/* Logo on the left */}
        <div
          className="flex-shrink-0 flex items-center justify-center bg-emerald-100"
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
          }}
        >
          <svg
            className="text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              width: "32px",
              height: "32px",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>

        {/* Text content on the right */}
        <div className="flex-1 text-left">
          <h3
            className="font-semibold text-gray-800 mb-1"
            style={{
              fontSize: "18px",
              lineHeight: "28px",
            }}
          >
            Invite Friends
          </h3>
          <p
            className="text-gray-600 mb-2"
            style={{
              fontSize: "14px",
              lineHeight: "20px",
            }}
          >
            Share your invite code
          </p>
          <div
            className="font-mono font-semibold text-emerald-700 border border-emerald-200"
            style={{
              borderRadius: "8px",
              backgroundColor: "#ecfdf5",
              padding: "8px 12px",
              fontSize: "14px",
              display: "inline-block",
            }}
          >
            {inviteCode}
          </div>
        </div>
      </div>

      <ShareActionSheet
        isOpen={isActionSheetOpen}
        onClose={handleCloseActionSheet}
        inviteCode={inviteCode}
      />
    </>
  );
};

export default InviteSection;