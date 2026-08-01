const StatsSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-3.5 bg-gray-200 rounded-full w-28" />
            <div className="size-10 bg-gray-200 rounded-full shrink-0" />
          </div>
          <div className="h-8 bg-gray-200 rounded-lg w-20 mb-1" />
          <div className="h-3 bg-gray-100 rounded-full w-16" />
        </div>
      ))}
    </div>
  );
};

export default StatsSkeleton;
