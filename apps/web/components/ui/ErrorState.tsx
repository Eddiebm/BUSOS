import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message,
  code,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 py-8 px-6 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-red-800">{message}</p>
      {code && (
        <p className="mt-1 text-xs text-red-600" aria-hidden>
          Code: {code}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}
