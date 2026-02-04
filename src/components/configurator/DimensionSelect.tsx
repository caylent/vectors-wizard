import { Tooltip } from "@/components/ui/Tooltip";

export function DimensionSelect({
  label,
  tooltip,
  value,
  onChange,
  options,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center text-sm font-medium text-text-secondary">
        {label}
        <Tooltip text={tooltip} />
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent-glow"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
