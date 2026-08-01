const TableSkeleton = ({ rows = 8, columns = 6 }) => {
  return (
    <div className="w-full animate-pulse">
      {/* header */}
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>

      {/* rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid gap-2 mb-2"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, col) => (
            <div key={col} className="h-6 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
