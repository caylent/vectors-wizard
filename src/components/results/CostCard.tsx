import { formatCurrency } from "@/lib/format";

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
    <div className="card-glow rounded-[16px] border border-border bg-surface p-5 transition-all duration-200">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        <span className={`font-mono text-lg font-medium ${accentColor}`}>
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="space-y-1 text-xs text-muted">{details}</div>
    </div>
  );
}
