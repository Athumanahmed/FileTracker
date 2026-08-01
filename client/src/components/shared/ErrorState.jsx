const ErrorState = ({ error, onRetry, title = "Failed to load data" }) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

  return (
    <div className="my-6 rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-semibold text-red-700">{title}</p>
          <p className="text-sm text-red-600 mt-1">Error: {message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-white px-4 py-1.5 rounded-full bg-red-700"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
