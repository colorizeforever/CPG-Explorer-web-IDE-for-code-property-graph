const LoadingGrid = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="bg-surface-800 rounded-lg border border-surface-600 p-4 animate-pulse"
      >
        <div className="h-3 bg-surface-600 rounded w-16 mb-2" />
        <div className="h-6 bg-surface-600 rounded w-24" />
      </div>
    ))}
  </div>
);

export default LoadingGrid;
