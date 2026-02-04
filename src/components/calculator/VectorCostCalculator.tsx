"use client";

import { useCalculator } from "@/hooks/use-calculator";
import { CalculatorShell } from "./CalculatorShell";

export function VectorCostCalculator({
  providerId = "s3-vectors",
  className,
}: {
  providerId?: string;
  className?: string;
}) {
  const state = useCalculator(providerId);

  return (
    <div className={`min-h-screen bg-background ${className ?? ""}`}>
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <svg
              className="h-5 w-5 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-medium text-text-primary">
              {state.provider.name} Cost Calculator
            </h1>
            <p className="text-xs text-muted">{state.provider.regionLabel}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <CalculatorShell state={state} />
      </main>
    </div>
  );
}
