import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
  /** Use on dark app backgrounds (obsidian shell). */
  variant?: "light" | "dark";
}

export function ErrorState({
  message,
  code,
  onRetry,
  className,
  variant = "light",
}: ErrorStateProps) {
  const dark = variant === "dark";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border py-8 px-6 text-center",
        dark
          ? "border-red-500/30 bg-red-950/40"
          : "border-red-200 bg-red-50/50",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <p className={cn("text-sm font-medium", dark ? "text-red-200" : "text-red-800")}>{message}</p>
      {code && (
        <p className={cn("mt-1 text-xs", dark ? "text-red-400/90" : "text-red-600")} aria-hidden>
          Code: {code}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-4 rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
            dark
              ? "border-red-500/40 bg-zinc-900 text-red-100 hover:bg-red-950/50"
              : "border-red-300 bg-white text-red-700 hover:bg-red-50"
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}
