"use client";

const SmallBox = ({
  icon: Icon,
  border,
  gradientFrom,
  gradientTo,
  iconColor,
  title,
  value,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full cursor-pointer"
    >
      <div
        className={`
          ${border}
          bg-gradient-to-br ${gradientFrom} ${gradientTo}
          rounded-2xl p-4 text-center shadow-sm h-full
          transition-all duration-200 ease-in-out
          hover:shadow-sm hover:scale-[1.02] 
          active:scale-[0.98]
        `}
      >
        <Icon className={`w-6 h-6 ${iconColor} mx-auto mb-2`} />
        <p className={`text-sm text-gray-600 font-medium`}>{title}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </button>
  );
};

export default SmallBox;