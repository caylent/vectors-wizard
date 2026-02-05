"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mb-4 text-4xl">!</div>
        <h2 className="mb-2 text-lg font-medium text-text-primary">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-text-secondary">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dim"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
