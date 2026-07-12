import { AlertTriangle } from "lucide-react";

const ErrorState = ({ message = "Something went wrong.", onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertTriangle size={40} className="text-red-500 mb-3" />
    <p className="text-red-400 text-sm font-medium">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded"
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
