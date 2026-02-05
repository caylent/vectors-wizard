"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useCalculator } from "@/hooks/use-calculator";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CalculatorShell } from "./CalculatorShell";
import { decodeShareableState, encodeShareableState } from "@/lib/providers/shareable-state";

export function VectorCostCalculator({
  providerId: initialProviderId = "s3-vectors",
  initialState,
  className,
}: {
  providerId?: string;
  initialState?: string; // base64 encoded state
  className?: string;
}) {
  // Decode initial state if provided
  const decoded = initialState ? decodeShareableState(initialState) : null;
  const [providerId, setProviderId] = useState(decoded?.providerId ?? initialProviderId);
  const state = useCalculator(providerId, decoded?.config);

  // Generate shareable link
  const getShareableLink = useCallback(() => {
    const encoded = encodeShareableState(providerId, state.config);
    const url = new URL(window.location.origin);
    url.searchParams.set("s", encoded);
    return url.toString();
  }, [providerId, state.config]);

  const handleProviderChange = useCallback((newProviderId: string) => {
    setProviderId(newProviderId);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("s"); // Clear shared state
    url.searchParams.set("provider", newProviderId);
    window.history.pushState({}, "", url.toString());
  }, []);

  // Debounce config so URL doesn't update on every keystroke
  const debouncedConfig = useDebouncedValue(state.config, 300);

  // Update URL when config changes (debounced)
  useEffect(() => {
    if (state.mode !== "landing") {
      const encoded = encodeShareableState(providerId, debouncedConfig);
      const url = new URL(window.location.href);
      url.searchParams.set("s", encoded);
      window.history.replaceState({}, "", url.toString());
    }
  }, [providerId, debouncedConfig, state.mode]);

  return (
    <div className={`cosmic-bg noise-overlay min-h-screen ${className ?? ""}`}>
      {/* Header */}
      <header className="border-b border-border bg-background/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-bright">
              <svg
                className="h-5 w-5 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-medium text-text-primary">
                Vectors Wizard
              </h1>
              <p className="text-xs text-muted">Vector cost calculator & visualizer</p>
            </div>
          </div>
          <Link
            href="/visualizer"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-text-secondary/30 hover:bg-surface-bright hover:text-text-primary"
          >
            Visualizer
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-12 lg:py-16">
        <CalculatorShell
          state={state}
          onProviderChange={handleProviderChange}
          getShareableLink={getShareableLink}
        />
      </main>
    </div>
  );
}
