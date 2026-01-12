// components/ReadAloud.jsx
export default function ReadAloud() {
  return (
    <div className="z-50">
      <button className="group relative">
        {/* Main Round Button  */}
        <div className="relative w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center">
          {/* Speaker Icon  */}
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Click to read aloud
            <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </div>
      </button>
    </div>
  );
}