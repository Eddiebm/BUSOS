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
          ? "border-destructive/35 bg-destructive/15"
          : "border-destructive/40 bg-destructive/10/50",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <p className={cn("text-sm font-medium", dark ? "text-destructive-foreground" : "text-destructive")}>{message}</p>
      {code && (
        <p className={cn("mt-1 text-xs", dark ? "text-destructive/90" : "text-destructive")} aria-hidden>
          Code: {code}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-4 rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-background",
            dark
              ? "border-destructive/40 bg-card text-destructive-foreground hover:bg-destructive/20"
              : "border-destructive/45 bg-card text-destructive hover:bg-destructive/10"
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}
