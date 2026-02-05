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
        className="w-full rounded-[4px] border border-border bg-surface-bright px-3 py-2 font-mono text-sm text-text-primary outline-none transition-all duration-200 focus:border-text-secondary/40 focus:ring-2 focus:ring-white/5"
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
