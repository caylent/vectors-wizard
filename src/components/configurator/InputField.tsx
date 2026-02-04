import { Tooltip } from "@/components/ui/Tooltip";

export function InputField({
  label,
  tooltip,
  value,
  onChange,
  suffix,
  min = 0,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center text-sm font-medium text-text-secondary">
        {label}
        <Tooltip text={tooltip} />
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent-glow"
        />
        {suffix && (
          <span className="shrink-0 text-xs text-muted">{suffix}</span>
        )}
      </div>
    </div>
  );
}
