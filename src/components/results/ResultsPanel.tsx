import type { ProviderCostBreakdown } from "@/lib/providers/types";
import type { PricingProvider } from "@/lib/providers/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CostCard } from "./CostCard";
import { CostDistributionBar } from "./CostDistributionBar";

const ACCENT_COLORS = ["text-accent", "text-info", "text-success", "text-warning"];

function buildConfigSummary(config: Record<string, number>): string {
  const parts: string[] = [];

  // Primary metric: vector/object count or storage size
  if (config.numVectors > 0) {
    parts.push(`${formatNumber(config.numVectors)} vectors`);
  } else if (config.numObjects > 0) {
    parts.push(`${formatNumber(config.numObjects)} objects`);
  } else if (config.indexSizeGB > 0) {
    parts.push(`${formatNumber(config.indexSizeGB)} GB index`);
  } else if (config.storageGB > 0) {
    parts.push(`${formatNumber(config.storageGB)} GB storage`);
  }

  // Dimensions (only for providers that have them)
  if (config.dimensions > 0) {
    parts.push(`${config.dimensions}-dim`);
  }

  // Throughput metric
  if (config.monthlyQueries > 0) {
    parts.push(`${formatNumber(config.monthlyQueries)} queries/mo`);
  }

  return parts.join(" \u00b7 "); // middot
}

export function ResultsPanel({
  breakdown,
  config,
  provider,
}: {
  breakdown: ProviderCostBreakdown;
  config: Record<string, number>;
  provider: PricingProvider<Record<string, number>>;
}) {
  const summary = buildConfigSummary(config);

  return (
    <div className="space-y-6">
      {/* Total cost card */}
      <div className="gradient-border results-glow rounded-2xl bg-gradient-to-br from-surface-bright to-surface p-8">
        <div className="mb-1 text-sm uppercase tracking-[0.15em] text-muted">
          Estimated Monthly Cost
        </div>
        <div className="font-mono text-5xl font-medium text-caylent-green">
          {formatCurrency(breakdown.totalMonthlyCost)}
        </div>
        {summary && (
          <div className="mt-1 text-xs text-muted">{summary}</div>
        )}
        <div className="mt-5">
          <CostDistributionBar lineItems={breakdown.lineItems} />
        </div>
      </div>

      {/* Individual cost cards */}
      {breakdown.lineItems.map((item, i) => (
        <CostCard
          key={item.category}
          title={item.label}
          amount={item.amount}
          accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
          details={
            <div className="space-y-1">
              {Object.entries(item.details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          }
        />
      ))}

      {/* Query note for S3 Vectors */}
      {config.nonFilterableMetadataBytes > 0 && (
        <div className="card-glow rounded-[16px] border border-border bg-surface p-5">
          <div className="rounded-md bg-surface-bright px-2.5 py-1.5 text-[11px] leading-relaxed text-text-secondary">
            Non-filterable metadata ({config.nonFilterableMetadataBytes} bytes/vec) is excluded from query
            data-processed charges. Moving large payloads to non-filterable keys saves on query costs.
          </div>
        </div>
      )}

      {/* Pricing reference */}
      <div className="card-glow rounded-[16px] border border-border bg-surface p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-muted">
          Pricing Reference
        </h3>
        <div className="space-y-1.5 font-mono text-xs text-text-secondary">
          {provider.pricingReference.map((ref) => (
            <div key={ref.label} className="flex justify-between">
              <span>{ref.label}</span>
              <span>{ref.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted">
          {provider.pricingDisclaimer}
        </div>
      </div>
    </div>
  );
}
