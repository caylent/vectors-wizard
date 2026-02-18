"use client";

import { useState, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  extractUniversalConfig,
  compareAllProviders,
  type ProviderComparison,
} from "@/lib/providers/config-translator";

interface ComparisonPanelProps {
  currentProviderId: string;
  currentConfig: Record<string, number>;
  onSelectProvider: (providerId: string) => void;
}

function formatCurrency(n: number): string {
  if (n < 1) return `$${n.toFixed(2)}`;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(0)}`;
}

export function ComparisonPanel({
  currentProviderId,
  currentConfig,
  onSelectProvider,
}: ComparisonPanelProps) {
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Debounce config to avoid running 9 provider calculations on every keystroke
  const debouncedConfig = useDebouncedValue(currentConfig, 150);

  // Extract universal config and compare all providers
  const comparisons = useMemo(() => {
    const universal = extractUniversalConfig(currentProviderId, debouncedConfig);
    return compareAllProviders(universal);
  }, [currentProviderId, debouncedConfig]);

  // Filter visible providers
  const visibleComparisons = comparisons.filter(
    (c) => !hiddenProviders.has(c.providerId)
  );

  // Calculate max cost for bar scaling
  const maxCost = visibleComparisons.length > 0
    ? Math.max(...visibleComparisons.map((c) => c.monthlyCost))
    : 0;

  const toggleProvider = (providerId: string) => {
    const newHidden = new Set(hiddenProviders);
    if (newHidden.has(providerId)) {
      newHidden.delete(providerId);
    } else {
      newHidden.add(providerId);
    }
    setHiddenProviders(newHidden);
  };

  const showAll = () => setHiddenProviders(new Set());

  // Get cheapest provider
  const cheapest = visibleComparisons.find((c) => c.isApplicable);

  return (
    <div className="rounded-2xl border border-border bg-surface/50 backdrop-blur-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8555f0]/20">
            <svg
              className="h-4 w-4 text-[#8555f0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-text-primary">Compare Providers</h3>
            <p className="text-xs text-muted">
              {visibleComparisons.length} providers · Cheapest: {cheapest?.name ?? "N/A"}
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4">
          {/* Filter chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            {hiddenProviders.size > 0 && (
              <button
                onClick={showAll}
                className="rounded-full bg-[#8555f0]/20 px-3 py-1 text-xs font-medium text-[#8555f0] hover:bg-[#8555f0]/30"
              >
                Show all ({hiddenProviders.size} hidden)
              </button>
            )}
            {comparisons.map((c) => (
              <button
                key={c.providerId}
                onClick={() => toggleProvider(c.providerId)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  hiddenProviders.has(c.providerId)
                    ? "bg-surface-bright text-muted line-through"
                    : c.providerId === currentProviderId
                    ? "bg-[#8555f0] text-white"
                    : "bg-surface-bright text-text-secondary hover:text-text-primary"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Comparison bars */}
          <div className="space-y-3">
            {visibleComparisons.map((comparison, index) => (
              <ComparisonBar
                key={comparison.providerId}
                comparison={comparison}
                maxCost={maxCost}
                isCurrent={comparison.providerId === currentProviderId}
                isCheapest={index === 0 && comparison.isApplicable}
                onSelect={() => onSelectProvider(comparison.providerId)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#8555f0]" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#34d399]" />
              <span>Cheapest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-surface-bright" />
              <span>Click to switch</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonBar({
  comparison,
  maxCost,
  isCurrent,
  isCheapest,
  onSelect,
}: {
  comparison: ProviderComparison;
  maxCost: number;
  isCurrent: boolean;
  isCheapest: boolean;
  onSelect: () => void;
}) {
  const percentage = maxCost > 0 ? (comparison.monthlyCost / maxCost) * 100 : 0;

  // Determine bar color
  let barColor = "bg-surface-bright";
  if (isCurrent) barColor = "bg-[#8555f0]";
  else if (isCheapest) barColor = "bg-[#34d399]";

  if (!comparison.isApplicable) {
    return (
      <div className="group rounded-lg p-2 opacity-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-muted">{comparison.name}</span>
          <span className="text-xs text-muted">N/A</span>
        </div>
        <div className="h-6 rounded-md bg-surface-bright flex items-center justify-center">
          <span className="text-xs text-muted">{comparison.notes}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`group w-full rounded-lg p-2 text-left transition-colors ${
        isCurrent
          ? "bg-[#8555f0]/10"
          : "hover:bg-surface-bright"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isCurrent ? "text-[#8555f0]" : "text-text-primary"}`}>
            {comparison.name}
          </span>
          {isCheapest && !isCurrent && (
            <span className="rounded-full bg-[#34d399]/20 px-2 py-0.5 text-[10px] font-medium text-[#34d399]">
              Cheapest
            </span>
          )}
          {isCurrent && (
            <span className="rounded-full bg-[#8555f0]/20 px-2 py-0.5 text-[10px] font-medium text-[#8555f0]">
              Current
            </span>
          )}
        </div>
        <span className={`text-sm font-semibold tabular-nums ${isCurrent ? "text-[#8555f0]" : "text-text-primary"}`}>
          {formatCurrency(comparison.monthlyCost)}/mo
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-6 overflow-hidden rounded-md bg-background">
        <div
          className={`absolute inset-y-0 left-0 rounded-md transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-xs text-text-secondary truncate">
            {comparison.description}
          </span>
        </div>
      </div>
    </button>
  );
}
