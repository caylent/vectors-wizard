import type { CostLineItem } from "@/lib/providers/types";

export function CostDistributionBar({
  lineItems,
}: {
  lineItems: CostLineItem[];
}) {
  const total = lineItems.reduce((s, item) => s + item.amount, 0) || 1;

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
        {lineItems.map((item) => (
          <div
            key={item.label}
            className="transition-all duration-500"
            style={{
              width: `${(item.amount / total) * 100}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {lineItems.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-mono text-muted">
              {total > 0
                ? `${((item.amount / total) * 100).toFixed(0)}%`
                : "0%"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
