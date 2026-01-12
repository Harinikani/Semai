'use client';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const progressPercentage = totalSteps <= 1
    ? 0
    : ((currentStep - 1) / totalSteps) * 100;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-green-700">
          Question {currentStep} of {totalSteps}
        </p>
        <span className="text-sm font-semibold text-gray-600">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      <div className="relative w-full bg-gray-200 rounded-full h-4">
        <div 
          className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
        {/* Mascot tracker */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out"
          style={{ left: `${progressPercentage}%` }}
        >
          <img 
            src="/mascot.png"
            alt="Progress tracker"
            className="w-8 h-8 drop-shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;