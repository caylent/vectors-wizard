import type { CalculatorMode } from "@/hooks/use-calculator";

export function ModeSelector({
  mode,
  onModeChange,
}: {
  mode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
}) {
  if (mode === "landing") return null;

  return (
    <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      <button
        onClick={() => onModeChange("wizard")}
        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          mode === "wizard"
            ? "bg-accent/15 text-accent shadow-sm"
            : "text-muted hover:text-text-secondary"
        }`}
      >
        Guided
      </button>
      <button
        onClick={() => onModeChange("configurator")}
        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          mode === "configurator"
            ? "bg-accent/15 text-accent shadow-sm"
            : "text-muted hover:text-text-secondary"
        }`}
      >
        Manual
      </button>
    </div>
  );
}
