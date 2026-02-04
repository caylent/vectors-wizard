import type { ProviderCostBreakdown } from "@/lib/providers/types";
import type { PricingProvider } from "@/lib/providers/types";
import { formatCurrency, formatNumber } from "@/lib/providers/s3-vectors/pricing";
import { CostCard } from "./CostCard";
import { CostDistributionBar } from "./CostDistributionBar";

const ACCENT_COLORS = ["text-accent", "text-info", "text-success", "text-warning"];

export function ResultsPanel({
  breakdown,
  config,
  provider,
}: {
  breakdown: ProviderCostBreakdown;
  config: Record<string, number>;
  provider: PricingProvider<Record<string, number>>;
}) {
  return (
    <div className="space-y-5">
      {/* Total cost card */}
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-6 shadow-[0_0_40px_rgba(133,85,240,0.08)]">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
          Estimated Monthly Cost
        </div>
        <div className="font-mono text-4xl font-bold text-caylent-green">
          {formatCurrency(breakdown.totalMonthlyCost)}
        </div>
        <div className="mt-1 text-xs text-muted">
          {formatNumber(config.numVectors ?? 0)} vectors &middot;{" "}
          {config.dimensions ?? 0}-dim &middot;{" "}
          {formatNumber(config.monthlyQueries ?? 0)} queries/mo
        </div>
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
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="rounded-md bg-surface-bright px-2.5 py-1.5 text-[11px] leading-relaxed text-text-secondary">
            Non-filterable metadata ({config.nonFilterableMetadataBytes} bytes/vec) is excluded from query
            data-processed charges. Moving large payloads to non-filterable keys saves on query costs.
          </div>
        </div>
      )}

      {/* Pricing reference */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
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
