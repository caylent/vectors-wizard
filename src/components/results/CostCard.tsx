import { formatCurrency } from "@/lib/providers/s3-vectors/pricing";

export function CostCard({
  title,
  amount,
  details,
  accentColor = "text-accent",
}: {
  title: string;
  amount: number;
  details: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/30">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <span className={`font-mono text-lg font-semibold ${accentColor}`}>
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="space-y-1 text-xs text-muted">{details}</div>
    </div>
  );
}
