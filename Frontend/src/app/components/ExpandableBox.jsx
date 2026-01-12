import { ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet"
import { useState } from 'react';

const ExpandableBox = ({ 
  title, 
  children, 
  onOpen, 
  onClose,
  // New props for customization
  showDescription = true, // NEW: Control whether to show description
  bgColor = "bg-gradient-to-r from-emerald-50 to-teal-50",
  borderColor = "border-emerald-300",
  hoverBorderColor = "hover:border-emerald-300",
  headerBgColor = "bg-white",
  titleColor = "text-emerald-700",
  descriptionColor = "text-emerald-600",
  chevronColor = "text-emerald-400",
  chevronHoverColor = "group-hover:text-emerald-600",
  closeButtonBg = "bg-emerald-500",
  closeButtonHoverBg = "hover:bg-emerald-600",
  textHoverColor = "group-hover:text-emerald-700" // NEW: Customizable text hover color
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      onOpen?.(); // Call when sheet opens
    } else {
      onClose?.(); // Call when sheet closes
    }
  };

  return (
    <div className={`w-full ${bgColor} rounded-2xl shadow-sm border ${borderColor} overflow-hidden mb-4 ${hoverBorderColor} transition-colors`}>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <div className={`flex items-center justify-between p-4 cursor-pointer hover:${bgColor.replace('50', '100')} transition-colors group`}>
            <span className={`text-gray-800 font-semibold text-lg ${textHoverColor} transition-colors`}>{title}</span>
            <ChevronRight className={`${chevronColor} ${chevronHoverColor} transition-colors`} />
          </div>
        </SheetTrigger>
        
        <SheetContent 
          side="bottom"
          className="p-0 bg-white border border-gray-200 max-w-[430px] mx-auto h-auto max-h-[85vh]"
        >
          {/* Internal container to structure Header, Scrollable Content, and Footer */}
          <div className="flex flex-col h-auto p-6 max-w-[430px] mx-auto w-full bg-white"> 
            
            <SheetHeader className={`text-left border-b border-gray-200 pb-4 mb-4 ${headerBgColor}`}>
              <SheetTitle className={`${titleColor} text-2xl font-bold`}>{title}</SheetTitle>
              {/* MODIFIED: Only show description if showDescription is true */}
              {showDescription && (
                <SheetDescription className={descriptionColor}>
                  {title === "Major Threats" 
                    ? "Understanding the challenges facing this species."
                    : title === "Conservation Efforts" 
                    ? "Current efforts to protect and preserve this species."
                    : `View and manage your ${title.toLowerCase()}.`
                  }
                </SheetDescription>
              )}
            </SheetHeader>
            
            {/* Main content area with constrained height and scrolling */}
            <div className="py-2 flex-grow overflow-y-auto bg-white rounded-lg max-h-[50vh]">
              {children}
            </div>
            
            {/* Footer */}
            <SheetFooter className="mt-4 pt-4 border-t border-gray-200">
              <SheetClose asChild>
                <button className={`w-full px-4 py-3 ${closeButtonBg} text-white font-semibold rounded-lg ${closeButtonHoverBg} transition-colors shadow-sm`}>
                  Close
                </button>
              </SheetClose>
            </SheetFooter>
            
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ExpandableBox;